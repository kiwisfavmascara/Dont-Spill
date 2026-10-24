import { clamp } from "./physics.js";
import { coverAge, SPLASH_SECONDS } from "./occlusions.js";
const BLUE = "#164eeb", CREAM = "#fff8e7", RED = "#ff4634";
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export function createOverlayRenderer(ctx) {
  // Foreground-only illustration: never copy a still containing a second tray.
  const cloth = document.createElement("canvas");
  cloth.width = 1180; cloth.height = 720;
  const g = cloth.getContext("2d");
  const outline = new Path2D("M 25 20 Q 240 -10 510 15 Q 820 -15 1145 32 L 1165 165 Q 1110 280 1160 410 L 1120 700 Q 920 660 800 700 Q 460 665 290 710 L 10 665 Q 45 490 12 335 Z");
  g.save(); g.clip(outline); g.fillStyle = CREAM; g.fillRect(0,0,1180,720);
  g.translate(590,360); g.rotate(-0.13);
  g.fillStyle = BLUE;
  for (let x=-850;x<850;x+=155) g.fillRect(x,-650,28,1300);
  for (let y=-650;y<650;y+=145) g.fillRect(-850,y,1700,23);
  // Reproducible irregular print flecks and folds, cached once.
  let seed=91;
  const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<6200;i++) {
    const x=random()*1600-800,y=random()*1100-550;
    g.fillStyle=random()<.55?CREAM:BLUE;
    g.globalAlpha=.25+random()*.4;
    g.fillRect(x,y,.7+random()*2.2,.7+random()*2.2);
  }
  g.globalAlpha=.16; g.fillStyle=BLUE;
  g.beginPath();g.moveTo(-650,150);g.bezierCurveTo(-200,-50,100,270,650,50);g.lineTo(650,95);g.bezierCurveTo(100,315,-200,0,-650,200);g.fill();
  g.restore();
  g.save();g.clip(outline);
  g.fillStyle=CREAM;g.beginPath();g.moveTo(900,0);g.quadraticCurveTo(865,150,1128,210);g.lineTo(1180,0);g.fill();
  g.globalAlpha=.5;g.fillStyle=BLUE;g.beginPath();g.moveTo(900,0);g.quadraticCurveTo(950,145,1128,210);g.quadraticCurveTo(935,205,900,0);g.fill();
  g.restore();g.strokeStyle=RED;g.lineWidth=3;g.setLineDash([9,9]);g.stroke(outline);

  function ellipse(x,y,rx,ry,color) {
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
  }
  function line(x,y,x2,y2,color,width=1.5) {
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function drawCloth(cover,time) {
    const age=coverAge(cover,time);
    if(age<0||age>2.65)return;
    const enter=smooth(age/.24),exit=smooth((age-2)/.65),side=cover.direction;
    ctx.save();ctx.translate(560+side*exit*1350,315-850*(1-enter)+exit*500);
    ctx.rotate(-.035+side*exit*.8);
    ctx.drawImage(cloth,-540,-305,1080,610);ctx.restore();
  }
  function drawFog(cover,time) {
    const age=coverAge(cover,time);
    if(age<0||age>2.35)return;
    const enter=smooth(age/.25),out=smooth((age-1.6)/.75);
    ctx.save();
    // Each bank separates and fades; no abrupt removal at the last frame.
    for(let i=0;i<12;i++) {
      const column=i%4,row=Math.floor(i/4),side=column<2?-1:1;
      const x=95+column*310+Math.sin(time*.8+i)*13+side*out*(230+row*40);
      const y=50+row*255-out*(row===0?200:-120);
      ctx.globalAlpha=enter*(1-out)*.97;
      ellipse(x,y,245+out*95,185+out*40,CREAM);
      ctx.globalAlpha=enter*(1-out)*.13;
      for(let j=0;j<32;j++) {
        const a=j*.71+i;
        ellipse(x+Math.cos(a)*220,y+Math.sin(a)*160,1.7,1.3,BLUE);
      }
    }
    ctx.restore();
  }
  function drawSplash(splash,time,drink) {
    const age=coverAge(splash,time);
    if(age<0||age>SPLASH_SECONDS)return;
    const spread=smooth(age/.07),drain=clamp((age-.12)/.68,0,1);
    ctx.save();ctx.translate(560,315+drain*drain*1150);ctx.scale(.85+spread*.15,1+drain*.5);
    const body=new Path2D("M -610 -330 Q -410 -410 -250 -300 Q -130 -400 0 -335 Q 200 -420 300 -290 Q 440 -390 610 -290 L 620 170 Q 530 260 440 160 Q 430 430 390 440 Q 350 450 340 205 Q 230 320 110 225 Q 100 470 65 485 Q 20 480 25 245 Q -110 330 -230 215 Q -240 420 -280 430 Q -325 425 -310 200 Q -470 300 -620 180 Z");
    ctx.fillStyle=drink.color;ctx.fill(body);
    ctx.save();ctx.clip(body);
    ctx.globalAlpha=.23;ctx.fillStyle=BLUE;
    for(let i=0;i<500;i++)ctx.fillRect((i*73%1240)-620,(i*137%780)-350,2,2);
    ctx.restore();
    for(let i=0;i<7;i++) {
      ctx.save();ctx.translate(-480+i*157,-180+(i%3)*74);ctx.rotate(-.35);
      ellipse(0,0,27,9,CREAM);ctx.restore();
      if(drink.name!=="coffee") {
        ctx.fillStyle="#159c48";ctx.fillRect(-420+i*139,-100+(i%3)*83,12,7);
      }
    }
    ctx.restore();
  }
  function drawSpider(start,time) {
    const age=time-start;if(age<0)return;
    const build=clamp((age-1.15)/1.8,0,1);
    const cx=1120,cy=0;
    ctx.save();
    // Small corner web remains until reset. It has no force or spill input.
    ctx.globalAlpha=.8;
    if(build>0) {
      for(let i=0;i<7;i++) {
        const a=Math.PI/2+i*Math.PI/12;
        line(cx,cy,cx+Math.cos(a)*115*build,cy+Math.sin(a)*115*build,CREAM,2);
      }
      for(let r=20;r<=110*build;r+=18) {
        ctx.strokeStyle=CREAM;ctx.lineWidth=1.5;ctx.beginPath();
        ctx.arc(cx,cy,r,Math.PI/2,Math.PI);ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
    if(age<4.5) {
      let x=cx-45,y;
      if(age<1.15)y=-20+110*smooth(age/1.15);
      else if(age<2.95){x=cx-45+Math.sin((age-1.15)*7)*17;y=85+Math.cos((age-1.15)*7)*15;}
      else y=90-130*smooth((age-2.95)/1.55);
      line(x,-5,x,y,BLUE,1.3);
      for(const side of [-1,1])for(let i=0;i<4;i++){
        const y1=y-8+i*5,wiggle=Math.sin(age*9+i)*2;
        line(x+side*7,y1,x+side*17,y1-8+wiggle,BLUE,2);
        line(x+side*17,y1-8+wiggle,x+side*23,y1+4,BLUE,2);
      }
      ellipse(x,y,10,12,BLUE);ellipse(x,y+10,7,6,BLUE);
      ellipse(x-3,y+10,2,2,CREAM);ellipse(x+3,y+10,2,2,CREAM);
    }
    ctx.restore();
  }
  return (state,time,drink)=>{
    drawSpider(state.spiderStart,time);
    drawFog(state.fog,time);
    drawCloth(state.cloth,time);
    drawSplash(state.splash,time,drink);
  };
}
