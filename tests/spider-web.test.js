import test from 'node:test';
import assert from 'node:assert/strict';
import { spiderFrame, webTrace, WEB_ROUTE } from '../spider-web.js';
test('spider stays on the endpoint of the silk it has laid',()=>{
  assert.equal(spiderFrame(-.1),null);
  for(let i=0;i<60;i++){
    const frame=spiderFrame(1+i/10),tip=frame.trail.at(-1);
    assert.equal(frame.x,tip.x);assert.equal(frame.y,tip.y);
    assert.ok(frame.trail.length<=WEB_ROUTE.length+1);
  }
});
test('thread starts continuous, grows progressively and remains after the spider leaves',()=>{
  const entrance=spiderFrame(.99999),begin=spiderFrame(1);
  assert.ok(Math.hypot(entrance.x-begin.x,entrance.y-begin.y)<.01);
  assert.ok(webTrace(.2).length<webTrace(.8).length);
  const finished=spiderFrame(7),gone=spiderFrame(9);
  assert.equal(gone.visible,false);assert.deepEqual(gone.trail,finished.trail);
  assert.deepEqual(webTrace(1),WEB_ROUTE);
});
