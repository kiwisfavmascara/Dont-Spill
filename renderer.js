import { clamp } from "./physics.js";
import { disturbance, WARNING_SECONDS } from "./events.js";
const C = {
  blue: "#164eeb",
  light: "#51b8ff",
  cream: "#fff8e7",
  red: "#ff4634",
  yellow: "#ffdf39",
};
// Transparent illustrations are independent layers; liquid is drawn through a
// masked opening, so its position and amount remain live rather than pre-rendered.
export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d"),
    assets = {},
    tiles = new Map();
  // Cache print textures: no random flicker or per-frame particle generation.
  const ballArt = document.createElement("canvas");
  ballArt.width = ballArt.height = 224;
  const b = ballArt.getContext("2d");
  b.translate(112, 112);
  b.beginPath(); b.arc(0, 0, 105, 0, Math.PI * 2); b.clip();
  b.fillStyle = C.cream; b.fillRect(-112, -112, 224, 224);
  b.fillStyle = C.blue;
  b.beginPath(); b.arc(0, 0, 103, 0, Math.PI * 2);
  b.arc(30, -37, 94, 0, Math.PI * 2, true); b.fill("evenodd");
  let seed = 731;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 6500; i++) {
    const x = random() * 214 - 107, y = random() * 214 - 107;
    const shade = Math.hypot(x - 30, y + 37);
    if (random() < Math.max(0, Math.min(0.9, (shade - 40) / 100))) {
      b.fillStyle = random() < 0.18 ? C.light : C.blue;
      b.beginPath(); b.arc(x, y, 0.5 + random() * 1.6, 0, 7); b.fill();
    }
  }
  b.fillStyle = C.cream;
  for (const [x,y,rx,ry,r] of [[-24,-66,24,12,-0.4],[77,4,9,24,0.1]]) {
    b.beginPath(); b.ellipse(x,y,rx,ry,r,0,7); b.fill();
  }
  const ready = Promise.all(
    ["tray", "bowl", "cup", "alien", "bear"].map(
      (name) =>
        new Promise((resolve) => {
          const im = new Image();
          im.onload = () => {
            assets[name] = im;
            resolve(true);
          };
          im.onerror = () => {
            assets[name] = null;
            resolve(false);
          };
          im.src = `assets/${name}.png`;
        }),
    ),
  );
  function shape(d, fill) {
    ctx.fillStyle = fill;
    ctx.fill(new Path2D(d));
  }
  function ellipse(x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function line(x, y, x2, y2, color, width = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function dots(color) {
    if (!tiles.has(color)) {
      const c = document.createElement("canvas");
      c.width = c.height = 10;
      const g = c.getContext("2d");
      g.fillStyle = color;
      g.beginPath();
      g.arc(2, 2, 1.4, 0, 7);
      g.arc(7, 7, 1.4, 0, 7);
      g.fill();
      tiles.set(color, ctx.createPattern(c, "repeat"));
    }
    return tiles.get(color);
  }
  function sprite(name, x, y, w, h) {
    if (assets[name]) ctx.drawImage(assets[name], x, y, w, h);
  }
  function burst(x, y, side = 1, size = 0.55) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(side * size, size);
    shape(
      "M 0 0 L -115 -80 L -42 -57 L -92 -140 L -18 -63 L -18 -108 L 18 -15 Z",
      C.red,
    );
    ctx.restore();
  }
  // Opening geometry in the generated sprite's original 1672 x 940 frame.
  const containers = {
    cup: {
      rect: [-310, -165, 620, 349],
      opening: [-0.018, -0.266, 0.317, 0.176],
    },
    bowl: { rect: [-295, -145, 590, 332], opening: [0, -0.19, 0.42, 0.22] },
  };
  function opening(kind) {
    const q = containers[kind],
      r = q.rect,
      o = q.opening;
    return {
      cx: r[0] + r[2] * (0.5 + o[0]),
      cy: r[1] + r[3] * (0.5 + o[1]),
      rx: r[2] * o[2],
      ry: r[3] * o[3],
      rect: r,
    };
  }
  function container(s) {
    const coffee = s.drink.name === "coffee",
      kind = coffee ? "cup" : "bowl",
      g = opening(kind);
    const [dx, dy, w, h] = g.rect;
    // Start with the empty vessel. Its opening receives the procedural surface.
    sprite(kind, dx, dy, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy, g.rx, g.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = C.cream;
    ctx.fillRect(g.cx - g.rx, g.cy - g.ry, g.rx * 2, g.ry * 2);
    const fill = clamp(s.remaining / 100, 0, 1),
      surface = g.cy - g.ry + (1 - fill) * g.ry * 2;
    const slosh = -s.angle * 0.55;
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(slosh);
    ctx.fillStyle = s.drink.color;
    ctx.beginPath();
    ctx.moveTo(-g.rx * 1.5, g.ry * 2);
    ctx.lineTo(-g.rx * 1.5, surface - g.cy);
    ctx.bezierCurveTo(
      -g.rx * 0.5,
      surface - g.cy - 8,
      g.rx * 0.5,
      surface - g.cy + 8,
      g.rx * 1.5,
      surface - g.cy,
    );
    ctx.lineTo(g.rx * 1.5, g.ry * 2);
    ctx.closePath();
    ctx.fill();
    // Texture and cream swirl share the liquid's clipping region and drain with it.
    ctx.clip();
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = dots(coffee ? "#663720" : "#da2d24");
    ctx.fillRect(-g.rx, -g.ry, g.rx * 2, g.ry * 2);
    ctx.restore();
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, g.rx * 0.45, g.ry * 0.27, -0.06, 0, Math.PI * 1.65);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const x = -g.rx * 0.7 + ((i * 53) % (g.rx * 1.4)),
        y = -g.ry * 0.2 + ((i * 19) % (g.ry * 0.8));
      if (coffee) {
        ellipse(x, y, 3, 2, C.cream);
      } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i * 0.7);
        ctx.fillStyle = i % 2 ? "#159c48" : C.cream;
        ctx.fillRect(-7, -3, 14, 6);
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.restore();
    // Fine rim follows vessel, while wave and droplets respond to the tilt.
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy, g.rx + 2, g.ry + 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    const tip = Math.abs(s.angle),
      dir = s.angle >= 0 ? 1 : -1;
    if (tip > 0.17 && s.remaining > 0) {
      ctx.save();
      ctx.translate(g.cx + dir * g.rx * 0.75, g.cy + dir * g.ry * 0.15);
      ctx.scale(dir, 1);
      const a = clamp((tip - 0.17) * 150, 0, 65);
      ctx.fillStyle = s.drink.color;
      ctx.beginPath();
      ctx.moveTo(-35, 8);
      ctx.bezierCurveTo(10, -2, 42, -a, 51, -a);
      ctx.bezierCurveTo(65, -a - 6, 71, -a + 8, 58, -a + 15);
      ctx.bezierCurveTo(38, -a + 18, 27, 25, -12, 26);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const t = (s.elapsed * 1.5 + i * 0.27) % 1;
        ellipse(
          65 + t * 65,
          10 + t * t * 95 - a * 0.5,
          5 - t * 2,
          8 - t * 2,
          s.drink.color,
        );
      }
      ctx.restore();
    }
  }
  function fallingBall(s) {
    const e = s.event;
    if (!e) return;
    const age = s.elapsed - e.start;
    if (e.type === "ball") {
      const bx = e.ballX * 300;
      ctx.save();
      ctx.globalAlpha = 0.3;
      ellipse(bx, 160, 65, 14, C.red);
      ctx.restore();
      ctx.fillStyle = C.red;
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("↓", bx, 135);
      if (age < 2.8) {
        const by =
          age < WARNING_SECONDS
            ? -245
            : -245 +
              Math.pow(clamp((age - WARNING_SECONDS) / 1.4, 0, 1), 2) * 430;
        ctx.drawImage(ballArt, bx - 80, by - 80, 160, 160);
        for (let i = -2; i <= 2; i++) {
          const x = bx + i * 24;
          shape(`M ${x} ${by-92} Q ${x-5} ${by-125} ${x+2} ${by-180} Q ${x+8} ${by-120} ${x} ${by-92} Z`, i % 2 ? C.light : C.blue);
        }
      }
    }
  }
  function effects(s) {
    const e = s.event;
    if (!e) return;
    const age = s.elapsed - e.start,
      active = age > WARNING_SECONDS;
    if (e.type === "slope") {
      ctx.save();
      ctx.globalAlpha = 0.35;
      line(-550, 250, 550, 250 + e.direction * 35, C.blue, 1.5);
      ctx.restore();
    }
    if (e.type === "alien") {
      const ax = e.direction > 0 ? -370 : 235,
        ay = -285;
      if (active) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        shape(
          `M ${ax + 65} ${ay + 110} L ${-e.direction * 330} 95 L ${-e.direction * 270} 95 Z`,
          C.cream,
        );
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = dots(C.blue);
        ctx.fill(new Path2D(`M ${ax + 65} ${ay + 110} L ${-e.direction * 330} 95 L ${-e.direction * 270} 95 Z`));
        ctx.globalAlpha = 0.65;
        line(ax + 65, ay + 110, -e.direction * 300, 95, C.blue, 2);
        ctx.restore();
      }
      sprite("alien", ax - 15, ay, 180, 180);
    }
    if (e.type === "slip") {
      // A tiny peel and red skid marks communicate a jolt without changing scenery.
      ctx.save();
      ctx.translate(-410, 250);
      shape(
        "M -35 0 Q -10 8 0 -28 Q 12 0 38 8 Q 17 19 1 1 Q -8 23 -35 0 Z",
        C.cream,
      );
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.stroke(new Path2D("M -35 0 Q -10 8 0 -28 Q 12 0 38 8 Q 17 19 1 1 Q -8 23 -35 0 Z"));
      line(0, -28, 0, -38, C.blue, 3);
      line(-32, 13, 40, 20, C.blue, 2);
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(48 + i * 12, -6); ctx.rotate(0.3 + i * 0.3);
        ctx.fillStyle = C.red; ctx.fillRect(-2, -20, 4, 18); ctx.restore();
      }
      ctx.restore();
      if (active) {
        for (const side of [-1, 1])
          for (let i = 0; i < 3; i++)
            line(side * 470, 30 + i * 30, side * 540, 5 + i * 30, C.red, 4);
      }
    }
    if (e.type === "bear") {
      const bounce = active ? Math.sin(age * 14) * 3 : 0;
      ctx.save();
      ctx.globalAlpha = 0.25;
      for (const side of [-1, 1])
        line(side * 45, -155, side * 540, 110, C.cream, 2);
      ctx.restore();
      sprite("bear", -70, -270 + bounce, 140, 146);
      if (active) {
        for (const side of [-1, 1]) {
          for (let i = 0; i < 4; i++) {
            const t = (age * 1.5 + i * 0.25) % 1;
            const x = side * (75 + t * 65);
            ellipse(x, -137 - Math.sin(t * Math.PI) * 16, 3 + t * 8, 3 + t * 5, i % 2 ? C.red : C.cream);
          }
        }
      }
      if (active) {
        for (const side of [-1, 1]) {
          burst(side * 120, -195, side, 0.3);
          line(side * 480, 60, side * 500, 100, C.blue, 4);
        }
      }
    }
  }
  function draw(s) {
    const rect = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr),
      h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const scale = Math.min(rect.width / 1120, rect.height / 630);
    ctx.translate(rect.width / 2, rect.height * 0.51);
    ctx.scale(scale, scale);
    effects(s);
    const age = s.event ? s.elapsed - s.event.start : 0,
      f = s.event
        ? disturbance(s.event.type, age, s.event.direction)
        : { y: 0 };
    ctx.save();
    ctx.translate(s.x * 300, -25 + f.y);
    ctx.rotate(s.angle);
    if (Math.abs(s.angle) > 0.17) {
      burst(-390, 25);
      burst(390, 25, -1);
    }
    if (assets.tray) {
      sprite("tray", -560, -225, 1120, 630);
    } else {
      ellipse(0, 100, 450, 120, C.blue);
    }
    container(s);
    ctx.restore();
    fallingBall(s);
    if (!assets.tray || !assets.bowl || !assets.cup) {
      ctx.textAlign = "center";
      ctx.fillStyle = C.blue;
      ctx.font = "13px Arial";
      ctx.fillText(
        "Loading artwork… if this persists, reload the page.",
        0,
        270,
      );
    }
    if (s.phase === "calibrating" || s.lost) {
      ctx.textAlign = "center";
      ctx.fillStyle = C.blue;
      ctx.font = "bold 14px Arial";
      ctx.fillText(
        s.hands === 2 ? "HOLD STEADY…" : "SHOW BOTH HANDS TO THE CAMERA",
        0,
        -265,
      );
    }
  }
  return { draw, ready };
}
