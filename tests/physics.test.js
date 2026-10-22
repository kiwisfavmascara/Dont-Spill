import test from "node:test";
import assert from "node:assert/strict";
import { handControl, spillRate } from "../physics.js";
test("two level hands give a level centered tray regardless of detection ordering", () => {
  const a = { x: 0.2, y: 0.5 },
    b = { x: 0.8, y: 0.5 };
  assert.equal(handControl([a, b]).angle, 0);
  assert.equal(handControl([b, a]).x, 0);
});
test("raising screen-left hand slopes tray down right; translation moves tray", () => {
  assert.ok(
    handControl([
      { x: 0.3, y: 0.3 },
      { x: 0.9, y: 0.6 },
    ]).angle > 0,
  );
  assert.ok(
    handControl([
      { x: 0.3, y: 0.3 },
      { x: 0.9, y: 0.6 },
    ]).x > 0,
  );
});
test("missing hand blocks input; calibration subtracts comfortable resting tilt", () => {
  assert.equal(handControl([{ x: 0.3, y: 0.3 }]), null);
  const h = [
    { x: 0.2, y: 0.3 },
    { x: 0.8, y: 0.6 },
  ];
  const raw = handControl(h);
  assert.equal(handControl(h, { angle: raw.rawAngle, x: raw.rawX }).angle, 0);
});
test("level tray loses nothing; spilling increases with tilt and is symmetric", () => {
  assert.equal(spillRate(0, 0), 0);
  assert.equal(spillRate(0.1, 0), 0);
  assert.ok(spillRate(0.6, 0) > spillRate(0.3, 0));
  assert.equal(spillRate(-0.4, 0), spillRate(0.4, 0));
});
