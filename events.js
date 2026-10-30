import { clamp } from "./physics.js";
export const ROUND_SECONDS = 30;
export const EVENT_SECONDS = 4.3;
export const WARNING_SECONDS = 1.1;
export const BALL_CUE_SECONDS = 0.45;
export const BALL_FALL_SECONDS = 0.32;
export const BALL_HIT_SECONDS = BALL_CUE_SECONDS + BALL_FALL_SECONDS;
export const EVENT_TYPES = [
  { type: "slope", name: "THE FLOOR IS TIPPING!" },
  { type: "ball", name: "FALLING BALL — MOVE AWAY!" },
  { type: "alien", name: "ALIEN VISITOR — COUNTER THE PULL!" },
  { type: "slip", name: "SLIPPERY STEP — STEADY!" },
  { type: "bear", name: "BEAR CHASE — HOLD ON!" },
];
export function shuffledEvents(random = Math.random) {
  const order = [...EVENT_TYPES];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
// Vary the selection and count as well as order, timing, positions and strength.
export function createEventPlan(random = Math.random) {
  const count = 4 + Math.floor(random() * 3);
  const chosen = shuffledEvents(random).slice(0, 3);
  while (chosen.length < count) {
    const options = EVENT_TYPES.filter(e => e.type !== chosen.at(-1).type);
    chosen.push(options[Math.floor(random() * options.length)]);
  }
  let time = 1.3 + random() * 1.4;
  const first = time;
  const plan = chosen.map(e => {
    const item = { ...e, start: time, duration: 2.7 + random() * 1.6,
      direction: random() < .5 ? -1 : 1,
      ballX: (random() < .5 ? -1 : 1) * (.38 + random() * .32),
      strength: .85 + random() * .3 };
    time += item.duration + .5 + random() * 1.5;
    return item;
  });
  const end = plan.at(-1).start + plan.at(-1).duration;
  const scale = Math.min(1, (ROUND_SECONDS - .7 - first) / (end - first));
  return plan.map(e => ({...e, start:first+(e.start-first)*scale,duration:e.duration*scale}));
}
export function disturbance(type, age, direction = 1, collided = false, duration = EVENT_SECONDS) {
  if (type === "ball") {
    const hitAge = age - BALL_HIT_SECONDS;
    if (!collided || hitAge < 0 || hitAge > 1.3) return { angle: 0, x: 0, y: 0 };
    const decay = Math.exp(-hitAge * 3.5);
    return {
      angle: direction * Math.cos(hitAge * 17) * 0.62 * decay,
      x: direction * Math.sin(hitAge * 14) * 0.12 * decay,
      y: Math.cos(hitAge * 22) * 26 * decay,
    };
  }
  const t = age - WARNING_SECONDS;
  if (t < 0) return { angle: 0, x: 0, y: 0 };
  const fade =
    Math.min(1, t / 0.35) * clamp((duration - age) / 0.45, 0, 1);
  if (type === "slope") return { angle: direction * 0.56 * fade, x: 0, y: 0 };
  if (type === "alien")
    return {
      angle: direction * (0.43 + Math.sin(t * 4) * 0.15) * fade,
      x: direction * 0.08 * fade,
      y: -Math.sin(t * 3) * 9 * fade,
    };
  if (type === "slip")
    return {
      angle: direction * Math.sin(t * 7) * 0.74 * Math.exp(-t * 0.65) * fade,
      x: direction * Math.sin(t * 5) * 0.2 * Math.exp(-t * 0.8) * fade,
      y: -Math.sin(t * 8) * 15 * Math.exp(-t) * fade,
    };
  if (type === "bear")
    return {
      angle: (Math.sin(t * 10) * 0.38 + Math.sin(t * 6) * 0.15) * fade,
      x: Math.sin(t * 8) * 0.035 * fade,
      y: Math.sin(t * 15) * 13 * fade,
    };
  return { angle: 0, x: 0, y: 0 };
}
export function ballCollision(trayX, ballX) {
  return Math.abs(trayX - ballX) < 0.25;
}
