import test from "node:test";
import assert from "node:assert/strict";
import {
  ROUND_SECONDS,
  EVENT_TYPES,
  EVENT_SECONDS,
  WARNING_SECONDS,
  shuffledEvents,
  disturbance,
  ballCollision,
} from "../events.js";
test("all five unique events fit one 30 second round including warnings and gaps", () => {
  assert.equal(ROUND_SECONDS, 30);
  const order = shuffledEvents(() => 0.3);
  assert.equal(new Set(order.map((e) => e.type)).size, 5);
  assert.ok(
    2.5 + EVENT_TYPES.length * EVENT_SECONDS + (EVENT_TYPES.length - 1) <
      ROUND_SECONDS,
  );
});
test("no forces during warning and stronger slope can be counteracted", () => {
  for (const e of EVENT_TYPES)
    assert.deepEqual(disturbance(e.type, 0.5), { angle: 0, x: 0, y: 0 });
  const f = disturbance("slope", 2, 1);
  assert.ok(f.angle > 0.4);
  assert.ok(f.angle < 0.65);
  assert.equal(f.angle, -disturbance("slope", 2, -1).angle);
});
test("slip and chase create motion; ball hit depends on player position", () => {
  assert.notEqual(disturbance("slip", 2).x, 0);
  assert.notEqual(disturbance("bear", 2).y, 0);
  assert.equal(ballCollision(-0.45, -0.45), true);
  assert.equal(ballCollision(0.4, -0.45), false);
});
