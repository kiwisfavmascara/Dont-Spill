import test from "node:test";
import assert from "node:assert/strict";
import { trayTarget, handControl } from "../physics.js";
import { disturbance, BALL_HIT_SECONDS } from "../events.js";

test("strong hand poses remain visible against opposing disturbances", () => {
  assert.ok(trayTarget(0.65, -0.56) > 0.35);
  assert.ok(trayTarget(-0.65, 0.56) < -0.35);
  assert.equal(trayTarget(0, 0.56), 0.56);
  const h = [{x:0.2,y:0.2},{x:0.8,y:0.6}];
  assert.ok(handControl(h).angle > 0.6);
  assert.equal(handControl(h).angle, handControl([...h].reverse()).angle);
});

test("ball impact shakes only on contact, then decays", () => {
  assert.deepEqual(disturbance("ball", BALL_HIT_SECONDS, 1, false), {angle:0,x:0,y:0});
  assert.deepEqual(disturbance("ball", BALL_HIT_SECONDS-0.01, 1, true), {angle:0,x:0,y:0});
  const hit = disturbance("ball", BALL_HIT_SECONDS, 1, true);
  assert.ok(hit.angle > 0.5 && hit.y > 20);
  assert.ok(Math.abs(disturbance("ball", BALL_HIT_SECONDS+1, 1, true).angle) < 0.03);
  assert.deepEqual(disturbance("ball", BALL_HIT_SECONDS+1.5, 1, true), {angle:0,x:0,y:0});
});
