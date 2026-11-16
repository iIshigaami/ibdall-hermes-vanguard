// Vanguard v2 — armor company: three MBTs, mutual support, front-armor facing,
// focus fire. Authored with Hermes Agent from the published rules and replay evidence.
(() => {
const F=65536, TAU=2*Math.PI;
let r,m,side,points,fields,open,assign={},memory={},home=null;
const len=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angle=(x,y)=>Math.round(Math.atan2(y,x)*4096/TAU)&4095;
const diff=(a,b)=>((b-a+6144)&4095)-2048;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function tile(x,y){return clamp(Math.floor(y/F),0,m.height-1)*m.width+clamp(Math.floor(x/F),0,m.width-1);}
function clear(ax,ay,bx,by){
 const n=Math.ceil(Math.hypot(bx-ax,by-ay)/F*3);
 for(let k=1;k<=n;k++)if(!open[tile(ax+(bx-ax)*k/n,ay+(by-ay)*k/n)])return false;
 return true;
}
function wave(p){
 const n=open.length,d=new Int32Array(n);d.fill(1000000);
 const q=new Int32Array(n);let head=0,tail=0;
 const radius=p.radius*.6,rr=radius*radius;
 for(let y=Math.max(0,Math.floor((p.y-radius)/F));y<=Math.min(m.height-1,Math.ceil((p.y+radius)/F));y++)
 for(let x=Math.max(0,Math.floor((p.x-radius)/F));x<=Math.min(m.width-1,Math.ceil((p.x+radius)/F));x++){
  const i=y*m.width+x,dx=(x+.5)*F-p.x,dy=(y+.5)*F-p.y;
  if(open[i]&&dx*dx+dy*dy<rr){d[i]=0;q[tail++]=i;}
 }
 if(!tail){let best=-1,bd=Infinity;for(let i=0;i<n;i++)if(open[i]){
  const v=Math.hypot((i%m.width+.5)*F-p.x,(Math.floor(i/m.width)+.5)*F-p.y);
  if(v<bd){bd=v;best=i;}}d[best]=0;q[tail++]=best;}
 while(head<tail){const i=q[head++],x=i%m.width,y=Math.floor(i/m.width),v=d[i]+1;
  let j=i-1;if(x>0&&open[j]&&d[j]>v){d[j]=v;q[tail++]=j;}
  j=i+1;if(x<m.width-1&&open[j]&&d[j]>v){d[j]=v;q[tail++]=j;}
  j=i-m.width;if(y>0&&open[j]&&d[j]>v){d[j]=v;q[tail++]=j;}
  j=i+m.width;if(y<m.height-1&&open[j]&&d[j]>v){d[j]=v;q[tail++]=j;}
 }
 return d;
}
function waypoint(u,idx){
 const d=fields[idx];let at=tile(u.x,u.y),best=at;
 for(let k=0;k<8;k++){
  const x=at%m.width,y=Math.floor(at/m.width);let next=at;
  for(const j of [x>0?at-1:-1,x<m.width-1&&at+1<m.width*m.height?at+1:-1,y>0?at-m.width:-1,y<m.height-1?at+m.width:-1])
   if(j>=0&&d[j]<d[next])next=j;
  if(next===at)break;at=next;
  if(clear(u.x,u.y,(at%m.width+.5)*F,(Math.floor(at/m.width)+.5)*F))best=at;else break;
 }
 return {x:(best%m.width+.5)*F,y:(Math.floor(best/m.width)+.5)*F};
}
globalThis.controller={
 draft(h){
  // 12 points exactly. The 7-day meta shows 3x MBT is the most picked comp
  // (~50.6%) and our old 2x APC + MBT + scout sat below it at ~49.1%.
  const costs=h.draft.costs||{mbt:4};
  const pick=['mbt','mbt','mbt'];
  if(pick.reduce((s,k)=>s+(costs[k]||4),0)<=(h.draft.budget||12)&&pick.length<=(h.draft.max||5))return pick;
  return ['mbt','mbt','scout'];
 },
 hello(h){
  r=h.rules;m=h.map;side=h.side;points=h.objectives;assign={};memory={};
  open=new Uint8Array(m.width*m.height);
  for(let i=0;i<open.length;i++)open[i]=r.terrainSpeed[m.terrain[i]]>0?1:0;
  fields=points.map(wave);
  home=h.map.spawns[side]?{x:h.map.spawns[side][0]*F,y:h.map.spawns[side][1]*F}:null;
  // Spread the company over objectives; extra hulls join the nearest one.
  const us=h.units.slice().sort((a,b)=>(a.id||0)-(b.id||0));
  us.forEach((u,i)=>{
   let idx=0;
   if(points.length>1){
    const near=points.map((p,j)=>({j,v:Math.hypot(p.x-u.x,p.y-u.y)})).sort((a,b)=>a.v-b.v);
    idx=near[i%Math.min(points.length,near.length)].j;
   }
   assign[u.id]=idx;
  });
 },
 tick(o){
  const orders=[],alive=o.units.filter(u=>u.alive);
  for(const c of o.contacts)memory[c.id]={...c,t:o.tick};
  const friends=alive.filter(u=>u.kind!=='drone');
  for(const u of alive){
   const spec=r.units[u.kind]||r.units.mbt,gun=spec.gun||{};
   const order={id:u.id};
   const idx=assign[u.id]??0,p=o.objectives[idx]||o.objectives[0];
   const goal=waypoint(u,idx);
   // ---- target: focus the finishable / most dangerous contact in range ----
   let target=null,best=-Infinity;
   for(const c of o.contacts){
    if(!c.seenBy||!c.seenBy.includes(u.id))continue;
    const d=len(u,c);
    if(d>(gun.maxRange||0)||d<(gun.minRange||0))continue;
    const value=(1-(c.hpFrac??F)/F)*22+(c.kind==='mbt'?8:0)+(c.kind==='drone'?4:0)-d/F*.35;
    if(value>best){best=value;target=c;}
   }
   const hpFrac=(u.hp??(spec.hp*F))/((spec.hp||160)*F);
   const threat=target?len(u,target):Infinity;
   // ---- movement: hold near the objective rim, face the enemy with front armor ----
   let gx=goal.x,gy=goal.y;
   if(p){
    const d=len(u,p);
    if(d<p.radius*.8){gx=u.x+(p.x-u.x)*.12;gy=u.y+(p.y-u.y)*.12;}
   }
   // Low hulls disengage from a MBT duel instead of feeding it a kill.
   if(hpFrac<.32&&threat<10*F&&target){
    gx=u.x+(u.x-target.x);gy=u.y+(u.y-target.y);
   }
   for(const s of o.incoming||[])if(s.ticks<r.tickHz*2&&len(u,s)<4*F){
    const a=angle(u.x-s.x,u.y-s.y);
    const x=u.x+Math.cos(a*TAU/4096)*5*F,y=u.y+Math.sin(a*TAU/4096)*5*F;
    if(clear(u.x,u.y,x,y)){gx=x;gy=y;}
   }
   if(o.canMove){
    // Present the thick front plate while engaging; otherwise face travel.
    const face=target&&threat<gun.maxRange?target:{x:gx,y:gy};
    let a=angle(face.x-u.x,face.y-u.y),turn=diff(u.heading,a);
    order.steer=clamp(Math.round(turn/(spec.turnRate||F/8)*F),-F,F);
    const avoid=u.blocked&&!target;
    order.throttle=avoid?-Math.round(F*.5):Math.abs(turn)>900?0:Math.abs(turn)>350?Math.round(F*.4):F;
    if(avoid)order.steer=((Math.floor(o.tick/18)+u.id)%2?1:-1)*F;
   }
   // ---- fire: lead the target, use the full aim tolerance, concentrate ----
   if(target&&gun.mode!=='indirect'&&gun.mode!=='lock-on'){
    const t=len(u,target)/Math.max(gun.shellSpeed||F/10,F/10);
    const a=(target.heading||0)*TAU/4096;
    const x=Math.round(target.x+Math.cos(a)*(target.speed||0)*t);
    const y=Math.round(target.y+Math.sin(a)*(target.speed||0)*t);
    order.aimAt=[x,y];
    if((u.reload||0)===0&&Math.abs(diff(u.turret||0,angle(x-u.x,y-u.y)))<=gun.aimTolerance)
     order.fire=[x,y];
   }
   orders.push(order);
  }
  return {units:orders};
 }
};
})();
