export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// Screen-space palm centres: x grows rightwards, y grows downwards.
export function handControl(hands, neutral = { angle: 0, x: 0.5 }) {
  if (hands.length !== 2) return null;
  const [left, right] = [...hands].sort((a, b) => a.x - b.x);
  const angle = Math.atan2(right.y - left.y, Math.max(0.15, right.x - left.x));
  return {
    angle: clamp(angle - neutral.angle, -0.65, 0.65),
    x: clamp(((left.x + right.x) / 2 - neutral.x) * 1.8, -0.65, 0.65),
    rawAngle: angle,
    rawX: (left.x + right.x) / 2,
  };
}
export function spillRate(angle, velocity) {
  return (
    Math.max(0, Math.abs(angle) - 0.18) * 27 +
    Math.max(0, Math.abs(velocity) - 1.4) * 1.2
  );
}
