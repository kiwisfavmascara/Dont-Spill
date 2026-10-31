import { clamp } from "./physics.js";
const CORNER = { x: 1120, y: 0 };
export const WEB_BUILD_SECONDS = 6;
export const WEB_ROUTE = [{x:1060,y:80},CORNER];
// First attach the radial threads, then join them with alternating curved passes.
for (let i=0;i<7;i++) {
  const a=Math.PI/2+i*Math.PI/12;
  WEB_ROUTE.push({x:1120+Math.cos(a)*112,y:Math.sin(a)*112},CORNER);
}
for(let ring=0;ring<6;ring++) {
  const radius=22+ring*18;
  for(let j=0;j<=20;j++) {
    const f=ring%2?1-j/20:j/20;
    const a=Math.PI/2+f*Math.PI/2;
    WEB_ROUTE.push({x:1120+Math.cos(a)*radius,y:Math.sin(a)*radius});
  }
}
const lengths=WEB_ROUTE.slice(1).map((p,i)=>Math.hypot(p.x-WEB_ROUTE[i].x,p.y-WEB_ROUTE[i].y));
const total=lengths.reduce((a,b)=>a+b,0);

export function webTrace(progress) {
  let distance=clamp(progress,0,1)*total;
  const points=[WEB_ROUTE[0]];
  for(let i=0;i<lengths.length;i++) {
    const a=WEB_ROUTE[i],b=WEB_ROUTE[i+1],length=lengths[i];
    if(distance>=length) {points.push(b);distance-=length;continue;}
    const t=length?distance/length:0;
    points.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});break;
  }
  return points;
}

export function spiderFrame(age) {
  if(age<0)return null;
  const trail=age>=1?webTrace((age-1)/WEB_BUILD_SECONDS):[];
  if(age<1)return {trail,x:1060,y:-25+105*age,visible:true};
  const tip=trail.at(-1);
  if(age<7)return {trail,...tip,visible:true};
  const exit=clamp(age-7,0,1);
  return {trail,x:tip.x+(1145-tip.x)*exit,y:tip.y+(-30-tip.y)*exit,visible:age<8};
}
