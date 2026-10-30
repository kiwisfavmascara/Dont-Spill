import test from "node:test";
import assert from "node:assert/strict";
import {
  ROUND_SECONDS,
  EVENT_TYPES,
  EVENT_SECONDS,
  WARNING_SECONDS,
  shuffledEvents,
  createEventPlan,
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

test("random plans vary counts and selections while fitting 30 seconds", () => {
  const counts=new Set(),selections=new Set();
  for(let seed=1;seed<=150;seed++) {
    let state=seed;
    const random=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);
    // Mix initial seeds before sampling the plan's event count.
    for(let i=0;i<10;i++)random();
    const plan=createEventPlan(random);counts.add(plan.length);
    selections.add(plan.map(e=>e.type).join(','));
    assert.ok(plan.length>=4&&plan.length<=6);
    assert.ok(new Set(plan.map(e=>e.type)).size>=3);
    assert.ok(plan.at(-1).start+plan.at(-1).duration<=29.300001);
    plan.forEach((e,i)=>{
      assert.ok(e.duration>1.8&&e.strength>=.85&&e.strength<=1.15);
      assert.ok(Math.abs(e.ballX)>=.38&&Math.abs(e.ballX)<=.7);
      if(i){assert.notEqual(e.type,plan[i-1].type);assert.ok(e.start>plan[i-1].start+plan[i-1].duration);}
    });
  }
  assert.equal(counts.size,3);assert.ok(selections.size>80);
});
