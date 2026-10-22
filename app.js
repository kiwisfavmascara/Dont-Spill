import { clamp, handControl, spillRate } from "./physics.js";
const $ = (id) => document.getElementById(id),
  canvas = $("scene"),
  ctx = canvas.getContext("2d"),
  video = $("video");
const colors = {
  blue: "#164eeb",
  light: "#51b8ff",
  cream: "#fff8e7",
  red: "#ff4634",
  skin: "#ffd0aa",
  yellow: "#ffdf39",
};
let mode = "none",
  phase = "intro",
  model,
  stream,
  loading = false,
  session = 0,
  camTick = 0,
  lastVideo = -1,
  hands = [],
  neutral = { angle: 0, x: 0.5 },
  readyAt = 0,
  lastSeen = 0,
  calibrated = false;
let angle = 0,
  target = 0,
  x = 0,
  targetX = 0,
  velocity = 0,
  remaining = 100,
  elapsed = 0,
  previous = performance.now(),
  event = null,
  nextEvent = 6,
  eventIndex = 0,
  drops = [],
  keys = new Set(),
  lost = false,
  pausedFrom = "running";
const drinks = {
  tomato: { name: "tomato soup", color: "#ff4634" },
  pumpkin: { name: "pumpkin soup", color: "#ff9e19" },
  coffee: { name: "coffee", color: "#9e542c" },
};
let drink = drinks.tomato;
function status(t) {
  $("message").textContent = t;
}
function controls() {
  const active = phase !== "intro" && phase !== "result";
  $("pause").disabled = !active;
  $("pause").textContent = phase === "paused" ? "Resume" : "Pause";
  $("stop").disabled = !stream;
  $("calibrate").disabled = mode !== "camera" || !calibrated;
}
function choose() {
  drink =
    drinks[
      document.querySelector("input[name=drink]:checked")?.value || "tomato"
    ];
}
function reset() {
  angle = target = x = targetX = velocity = 0;
  remaining = 100;
  elapsed = 0;
  event = null;
  nextEvent = 6;
  eventIndex = 0;
  drops = [];
  readyAt = 0;
  lost = false;
}
function begin() {
  phase = "running";
  $("overlay").classList.add("hidden");
  status("Steady hands. Your delivery starts now.");
  controls();
}
function showCard(title, text, buttons) {
  $("overlay").classList.remove("hidden");
  $("overlay").innerHTML =
    `<div class="card"><span class="eyebrow">DON’T SPILL / A BALANCING ACT</span><h1>${title}</h1><p>${text}</p>${buttons}</div>`;
}
function keyboard() {
  session++;
  loading = false;
  stopCamera();
  mode = "keyboard";
  choose();
  reset();
  $("mode-label").textContent = "A / D = TILT · ← / → = MOVE · SPACE = PAUSE";
  begin();
}
$("keyboard").onclick = keyboard;
$("camera").onclick = startCamera;
async function startCamera() {
  if (loading) return;
  loading = true;
  const own = ++session;
  choose();
  $("camera").disabled = true;
  $("setup-status").textContent = "Loading hand tracking…";
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
      throw Error("Camera needs HTTPS or localhost.");
    const vision = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs"
    );
    const files = await vision.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm",
    );
    const detector = await vision.HandLandmarker.createFromOptions(files, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });
    if (own !== session) {
      detector.close();
      return;
    }
    model?.close();
    model = detector;
    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
      audio: false,
    });
    if (own !== session) {
      cameraStream.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = cameraStream;
    video.srcObject = stream;
    await video.play();
    mode = "camera";
    reset();
    calibrated = false;
    hands = [];
    lastVideo = -1;
    lastSeen = 0;
    phase = "calibrating";
    $("overlay").classList.add("hidden");
    $("camera-box").hidden = false;
    $("mode-label").textContent = "TWO HANDS = BALANCE · MOVE TOGETHER = DODGE";
    status("Show both hands, comfortably apart. Hold still for calibration.");
    controls();
  } catch (err) {
    if (own !== session) return;
    stopCamera();
    const label =
      err.name === "NotAllowedError"
        ? "Camera permission was denied. Allow access and retry, or use keyboard."
        : err.name === "NotFoundError"
          ? "No camera found. Try keyboard mode."
          : `Could not start hand tracking. ${err.message} Try again or use keyboard.`;
    $("setup-status").textContent = label;
    status("Camera unavailable — keyboard mode is ready.");
  } finally {
    if (own === session) {
      loading = false;
      if ($("camera")) $("camera").disabled = false;
    }
  }
}
function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  hands = [];
  $("camera-box").hidden = true;
  controls();
}
$("stop").onclick = () => {
  session++;
  stopCamera();
  phase = "paused";
  status("Camera stopped. Use keyboard to continue, or return home.");
  showCard(
    "Take a<br>breather.",
    "Your camera is off. Your delivery is paused.",
    '<button class="primary" id="continue-key">Continue with keyboard</button><button class="secondary" id="home">Start over</button>',
  );
  $("continue-key").onclick = () => {
    mode = "keyboard";
    lost = false;
    begin();
    $("mode-label").textContent = "A / D = TILT · ← / → = MOVE · SPACE = PAUSE";
  };
  $("home").onclick = () => location.reload();
};
function pause() {
  if (["intro", "result"].includes(phase)) return;
  if (phase === "paused") {
    phase = pausedFrom;
    readyAt = 0;
    status(
      mode === "camera"
        ? "Show both hands to continue."
        : "Back to the balancing act.",
    );
  } else {
    pausedFrom = phase;
    phase = "paused";
    status("Paused. Take your time.");
  }
  keys.clear();
  controls();
}
$("pause").onclick = pause;
$("calibrate").onclick = () => {
  phase = "calibrating";
  calibrated = false;
  readyAt = 0;
  status("Hold both hands in your comfortable level position.");
};
addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", " ", "a", "A", "d", "D"].includes(e.key)) {
    if (e.target.matches("button,input") && e.key === " ") return;
    e.preventDefault();
    if (e.key === " " && !e.repeat) pause();
    keys.add(e.key.toLowerCase());
  }
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  if (
    document.hidden &&
    phase !== "paused" &&
    !["intro", "result"].includes(phase)
  )
    pause();
});
function track(now) {
  if (!model || !stream || video.readyState < 2 || now - camTick < 65) return;
  camTick = now;
  if (video.currentTime === lastVideo) {
    if (now - lastSeen > 500) hands = [];
    return;
  }
  lastVideo = video.currentTime;
  try {
    const result = model.detectForVideo(video, now);
    hands = result.landmarks.map((l) => {
      const p = [0, 5, 9, 13, 17].map((i) => l[i]);
      return {
        x: 1 - p.reduce((a, b) => a + b.x, 0) / p.length,
        y: p.reduce((a, b) => a + b.y, 0) / p.length,
      };
    });
    if (hands.length === 2) lastSeen = now;
    drawTracking(result.landmarks);
  } catch (err) {
    hands = [];
    status("Tracking interrupted. Stop camera and try keyboard mode.");
  }
}
function drawTracking(landmarks) {
  const c = $("landmarks");
  c.width = 640;
  c.height = 480;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 640, 480);
  for (const l of landmarks) {
    for (const i of [0, 5, 9, 13, 17]) {
      g.beginPath();
      g.arc(l[i].x * 640, l[i].y * 480, 6, 0, Math.PI * 2);
      g.fillStyle = "#ffdf39";
      g.fill();
    }
  }
  $("tracking").textContent = `${landmarks.length}/2 hands visible`;
}
function input(now, dt) {
  if (mode === "keyboard") {
    target = ((keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0)) * 0.48;
    targetX = clamp(
      targetX +
        ((keys.has("arrowright") ? 1 : 0) - (keys.has("arrowleft") ? 1 : 0)) *
          dt *
          0.8,
      -0.65,
      0.65,
    );
    return true;
  }
  if (mode !== "camera") return false;
  const both = hands.length === 2 && now - lastSeen < 350;
  if (!both) {
    readyAt = 0;
    lost = true;
    status("Bring both hands into view — time and spills are paused.");
    return false;
  }
  if (phase === "calibrating") {
    const control = handControl(hands);
    if (!readyAt) readyAt = now;
    neutral = { angle: control.rawAngle, x: control.rawX };
    status(
      `Hold comfortably… ${Math.max(1, Math.ceil((1500 - now + readyAt) / 1000))}`,
    );
    if (now - readyAt > 1500) {
      calibrated = true;
      lost = true;
      readyAt = 0;
      phase = "running";
      controls();
    }
    return false;
  }
  if (lost) {
    if (!readyAt) readyAt = now;
    status(
      `Two hands found. Resuming in ${Math.max(1, Math.ceil((1500 - now + readyAt) / 1000))}…`,
    );
    if (now - readyAt < 1500) return false;
    lost = false;
    readyAt = 0;
    status("Keep the bowl level. Small moves are enough.");
  }
  const control = handControl(hands, neutral);
  target = control.angle;
  targetX = control.x;
  return true;
}
const events = [
  { name: "SIDE WIND →", type: "wind" },
  { name: "THE FLOOR IS TIPPING!", type: "slope" },
  { name: "LOOK OUT! MOVE LEFT OR RIGHT", type: "ball" },
];
function update(dt, now) {
  track(now);
  let live = false;
  if (phase === "running" || phase === "calibrating")
    live = input(now, dt) && phase === "running";
  if (live) {
    elapsed += dt;
    if (elapsed >= 30 || remaining <= 0) {
      finish();
      return;
    }
    if (!event && elapsed >= nextEvent) {
      const e = events[eventIndex++ % events.length];
      event = {
        ...e,
        start: elapsed,
        direction: eventIndex % 2 ? 1 : -1,
        ballX: clamp(x + (Math.random() - 0.5) * 0.22, -0.55, 0.55),
        hit: false,
      };
    }
    let force = 0;
    if (event) {
      const age = elapsed - event.start;
      if (age > 2) {
        if (event.type === "wind")
          force = Math.sin((age - 2) * 2) * 0.17 + event.direction * 0.13;
        if (event.type === "slope") force = event.direction * 0.3;
        if (event.type === "ball" && age >= 3 && age < 3.3 && !event.hit) {
          event.hit = true;
          if (Math.abs(x - event.ballX) < 0.28) {
            remaining = Math.max(0, remaining - 15);
            spawn(18);
            status("Bump! Move the tray away from the falling ball.");
          } else status("Nice dodge. Still delivering.");
        }
      }
      if (age > 6) {
        event = null;
        nextEvent = elapsed + 5;
      }
    }
    const old = angle;
    angle += (target + force - angle) * (1 - Math.exp(-dt * 8));
    velocity = (angle - old) / Math.max(0.001, dt);
    x += (targetX - x) * (1 - Math.exp(-dt * 7));
    const loss = spillRate(angle, velocity) * dt;
    remaining = Math.max(0, remaining - loss);
    if (loss > 0.015 && Math.random() < 0.6) spawn(1);
  } else if (phase === "intro") {
    angle = Math.sin(now / 1800) * 0.025;
  }
  for (const d of drops) {
    if (live) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 500 * dt;
      d.life -= dt;
    }
  }
  drops = drops.filter((d) => d.life > 0);
  $("remaining").innerHTML = `${Math.ceil(remaining)}<span>%</span>`;
  $("timer").innerHTML =
    `${Math.max(0, Math.ceil(30 - elapsed))}<span>s</span>`;
  $("tilt-label").textContent =
    Math.abs(angle) < 0.13
      ? "LEVEL"
      : angle > 0
        ? "TIPPING RIGHT ↘"
        : "↙ TIPPING LEFT";
  $("event").textContent =
    phase === "paused" ? "PAUSED" : event ? event.name : "";
}
function spawn(n) {
  for (let i = 0; i < n; i++)
    drops.push({
      x: angle > 0 ? 170 : -170,
      y: -65,
      vx: (angle > 0 ? 1 : -1) * (60 + Math.random() * 100),
      vy: -70 - Math.random() * 100,
      life: 1.4,
    });
}
function finish() {
  phase = "result";
  event = null;
  const amount = Math.ceil(remaining);
  showCard(
    `${amount}%<br>delivered!`,
    amount > 75
      ? "A remarkably steady delivery."
      : amount > 35
        ? "Some lunch survived the journey."
        : "The table ordered a bowl. You brought a story.",
    '<button id="again" class="primary">Another delivery ↗</button><button id="home" class="secondary">Change order / return home</button>',
  );
  $("again").onclick = () => {
    reset();
    if (mode === "camera") lost = true;
    begin();
  };
  $("home").onclick = () => location.reload();
  status("Delivery complete. Try again or change your order.");
  controls();
}
// Canvas shapes stay separate so the liquid can move independently from the bowl.
function path(d, fill, stroke) {
  const p = new Path2D(d);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(p);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke(p);
  }
}
function ellipse(cx, cy, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}
// Cache printed dot tiles rather than drawing thousands of circles every frame.
const dotTiles = new Map();
function dots(cx, cy, rx, ry, color, spacing = 8) {
  const key = `${color}:${spacing}`;
  if (!dotTiles.has(key)) {
    const tile = document.createElement("canvas");
    tile.width = tile.height = spacing * 2;
    const g = tile.getContext("2d");
    g.fillStyle = color;
    for (const [x, y] of [
      [spacing / 2, spacing / 2],
      [spacing * 1.5, spacing * 1.5],
    ]) {
      g.beginPath();
      g.arc(x, y, 1.5, 0, Math.PI * 2);
      g.fill();
    }
    dotTiles.set(key, ctx.createPattern(tile, "repeat"));
  }
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = dotTiles.get(key);
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.restore();
}
function hand(flip) {
  ctx.save();
  ctx.translate(flip * 405, 120);
  ctx.scale(-flip, 1);
  path(
    "M -110 340 L -40 96 Q -87 39 -43 -17 L -3 -54 Q 14 -66 27 -47 L 42 -12 Q 56 10 45 38 L 35 74 L 85 340 Z",
    colors.skin,
    colors.blue,
  );
  path("M -43 -17 Q -56 15 -40 40 M 27 -47 Q 4 -31 13 -9", null, colors.blue);
  dots(-2, 83, 42, 16, colors.red, 7);
  dots(44, 200, 25, 110, colors.blue, 8);
  ctx.restore();
}
function draw(now) {
  const rect = canvas.getBoundingClientRect(),
    dpr = Math.min(devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(rect.width * dpr) ||
    canvas.height !== Math.round(rect.height * dpr)
  ) {
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  const scale = Math.min(rect.width / 1120, rect.height / 650);
  ctx.translate(rect.width / 2, rect.height * 0.52);
  ctx.scale(scale, scale);
  if (event?.type === "ball") {
    const age = elapsed - event.start,
      bx = event.ballX * 400;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ellipse(bx, 230, 65, 14, colors.red);
    ctx.restore();
    if (age < 3.3) {
      const by = age < 2 ? -260 : -260 + (age - 2) * 440;
      ellipse(bx, by, 35, 35, colors.cream);
      dots(bx, by + 9, 33, 25, colors.blue, 6);
      ctx.fillStyle = colors.blue;
      ctx.font = "bold 25px Arial";
      ctx.fillText("↓", bx - 10, by - 50);
    }
  }
  ctx.save();
  ctx.translate(x * 280, 30);
  ctx.rotate(angle);
  path(
    "M -310 -85 L -415 -180 L -355 -65 L -470 -105 L -350 -20 Z",
    colors.red,
  );
  path("M 310 -85 L 415 -180 L 355 -65 L 470 -105 L 350 -20 Z", colors.red);
  hand(-1);
  hand(1);
  ellipse(0, 92, 443, 152, colors.cream);
  ellipse(0, 82, 427, 139, colors.blue);
  ellipse(0, 69, 400, 112, colors.light);
  dots(0, 95, 400, 98, colors.blue, 7);
  ctx.save();
  ctx.strokeStyle = colors.cream;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 65, 407, 119, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // Thumbs rest on the front rim so the grip stays readable.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 399, 126);
    ctx.scale(-side, 1);
    path(
      "M -30 39 Q -48 12 -24 -12 L 6 -44 Q 26 -60 39 -40 Q 48 -23 31 -5 L 13 24 Q 6 43 -30 39 Z",
      colors.skin,
      colors.blue,
    );
    dots(4, 26, 23, 9, colors.red, 7);
    ctx.restore();
  }
  ellipse(0, 95, 195, 35, colors.blue);
  path("M -216 -85 C -199 165 194 165 216 -85 Z", colors.cream);
  ctx.save();
  ctx.clip(new Path2D("M -216 -85 C -199 165 194 165 216 -85 Z"));
  dots(-110, 33, 150, 95, colors.light, 6);
  dots(-155, 69, 90, 57, colors.blue, 7);
  ctx.restore();
  ellipse(0, -85, 218, 92, colors.cream);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -85, 201, 77, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = colors.cream;
  ctx.fillRect(-220, -170, 440, 180);
  const level = -130 + (100 - remaining) * 0.75;
  ctx.beginPath();
  ctx.moveTo(-240, 40);
  ctx.lineTo(-240, level - angle * 140);
  ctx.bezierCurveTo(
    -100,
    level + angle * 100 + Math.sin(now / 250) * 8,
    70,
    level - angle * 110,
    240,
    level + angle * 140,
  );
  ctx.lineTo(240, 40);
  ctx.closePath();
  ctx.fillStyle = drink.color;
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    const gx = -150 + ((i * 47) % 300),
      gy = -90 + ((i * 23) % 60);
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(i);
    ctx.fillStyle = i % 2 ? "#169a43" : colors.cream;
    ctx.fillRect(-9, -4, 18, 8);
    ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = colors.cream;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, -85, 214, 88, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (const d of drops) ellipse(d.x, d.y, 5, 9, drink.color);
  ctx.restore();
  if (mode === "camera" && (!calibrated || lost)) {
    ctx.fillStyle = colors.blue;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      hands.length === 2 ? "HOLD STEADY…" : "SHOW BOTH HANDS TO THE CAMERA",
      0,
      -265,
    );
  }
}
function loop(now) {
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  update(dt, now);
  draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
