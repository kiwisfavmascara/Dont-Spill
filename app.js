import { clamp, handControl, spillRate } from "./physics.js";
import {
  ROUND_SECONDS,
  EVENT_SECONDS,
  WARNING_SECONDS,
  shuffledEvents,
  disturbance,
  ballCollision,
} from "./events.js";
import { createRenderer } from "./renderer.js";
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
  nextEvent = 2.5,
  eventIndex = 0,
  drops = [],
  keys = new Set(),
  lost = false,
  pausedFrom = "running";
const drinks = {
  tomato: { name: "tomato soup", color: "#ff4634" },
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
  nextEvent = 2.5;
  eventOrder = shuffledEvents();
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
let eventOrder = shuffledEvents();
function update(dt, now) {
  track(now);
  let live = false;
  if (phase === "running" || phase === "calibrating")
    live = input(now, dt) && phase === "running";
  if (live) {
    elapsed += dt;
    if (elapsed >= ROUND_SECONDS || remaining <= 0) {
      finish();
      return;
    }
    if (!event && elapsed >= nextEvent && eventIndex < eventOrder.length) {
      const e = eventOrder[eventIndex++];
      event = {
        ...e,
        start: elapsed,
        direction: eventIndex % 2 ? 1 : -1,
        ballX: Math.random() < 0.5 ? -0.6 : 0.6,
        hit: false,
      };
    }
    let force = { angle: 0, x: 0, y: 0 };
    if (event) {
      const age = elapsed - event.start;
      force = disturbance(event.type, age, event.direction);
      if (event.type === "ball" && age >= 2.5 && !event.hit) {
        event.hit = true;
        if (ballCollision(x, event.ballX)) {
          remaining = Math.max(0, remaining - 18);
          spawn(18);
          status("Bump! Move away from the marked landing spot.");
        } else status("Nice dodge. Still delivering.");
      }
      if (age > EVENT_SECONDS) {
        event = null;
        nextEvent = elapsed + 1;
      }
    }
    const old = angle;
    angle +=
      (clamp(target + force.angle, -0.85, 0.85) - angle) *
      (1 - Math.exp(-dt * 8));
    velocity = (angle - old) / Math.max(0.001, dt);
    x += (clamp(targetX + force.x, -0.75, 0.75) - x) * (1 - Math.exp(-dt * 7));
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
    `${Math.max(0, Math.ceil(ROUND_SECONDS - elapsed))}<span>s</span>`;
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
  $("timer").innerHTML =
    `${Math.max(0, Math.ceil(ROUND_SECONDS - elapsed))}<span>s</span>`;
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
const renderer = createRenderer(canvas);
function draw() {
  renderer.draw({
    angle,
    x,
    remaining,
    drink,
    event,
    elapsed,
    phase,
    hands: hands.length,
    calibrated,
    lost,
  });
}
function loop(now) {
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  update(dt, now);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
