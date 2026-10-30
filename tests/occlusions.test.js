import test from "node:test";
import assert from "node:assert/strict";
import { createSceneFeedback, clothSteps, SPLASH_SECONDS } from "../occlusions.js";

test("splash requires more than eight points in a short window, not slow loss", () => {
  const a=createSceneFeedback(()=>.2);
  a.update(.1,92,null,0);assert.equal(a.state.splash,null);
  a.update(.2,91.9,null,0);assert.equal(a.state.splash.start,.2);
  a.update(.3,80,null,0);assert.equal(a.state.splash.start,.2);
  const b=createSceneFeedback(()=>.2);
  for(let i=0;i<200;i++)b.update(i*.05,100-i*.1,null,0);
  assert.equal(b.state.splash,null);assert.equal(SPLASH_SECONDS,.8);
});

test("covers use independent choices and do not restart on the same event", () => {
  const a=createSceneFeedback(()=>.2),event={start:8};
  a.update(8,100,event,2);assert.equal(a.state.cloth.start,8.1);
  a.update(8.2,100,event,2);assert.equal(a.state.cloth.start,8.1);
  a.update(19,100,{start:19},4);assert.equal(a.state.cloth.start,19.1);
  assert.equal(a.state.fog,null);
  const prior=JSON.stringify(a.state);a.update(19,100,{start:19},4);
  assert.equal(JSON.stringify(a.state),prior);
});

test("only cloth adds footsteps; reset clears splashes and covers", () => {
  assert.deepEqual(clothSteps(null,12),{angle:0,x:0,y:0});
  assert.notEqual(clothSteps({start:1},2).angle,0);
  assert.deepEqual(clothSteps({start:1},4),{angle:0,x:0,y:0});
  const a=createSceneFeedback(()=>.2);a.update(.1,80,null,0);
  const fresh=createSceneFeedback(()=>.2);
  assert.equal(fresh.state.splash,null);assert.equal(fresh.state.cloth,null);
  assert.ok(fresh.state.spiderStart>=3&&fresh.state.spiderStart<=21);
});
