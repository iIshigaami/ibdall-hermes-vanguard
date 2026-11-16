// Vanguard: original objective logistics controller, authored with Hermes Agent.
// Four-connected reverse wavefronts avoid river traps; independent garrisons
// exploit APC capture multipliers, with lead-fire and timed splash evasion.
(() => {
const F=65536, TAU=2*Math.PI;
let r,m,side,points,fields,open,assign={},memory={};
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
 const radius=p.radius*.55,rr=radius*radius;
 for(let y=Math.max(0,Math.floor((p.y-radius)/F));y<=Math.min(m.height-1,Math.ceil((p.y+radius)/F));y++)for(let x=Math.max(0,Math.floor((p.x-radius)/F));x<=Math.min(m.width-1,Math.ceil((p.x+radius)/F));x++){
  const i=y*m.width+x,dx=(x+.5)*F-p.x,dy=(y+.5)*F-p.y;
  if(open[i]&&dx*dx+dy*dy<rr){d[i]=0;q[tail++]=i;}
 }
 if(!tail){let best=-1,bd=Infinity;for(let i=0;i<n;i++)if(open[i]){let v=Math.hypot((i%m.width+.5)*F-p.x,(Math.floor(i/m.width)+.5)*F-p.y);if(v<bd){bd=v;best=i;}}d[best]=0;q[tail++]=best;}
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
 // Descend the field then shortcut only through actually traversable ground.
 for(let k=0;k<7;k++){
  const x=at%m.width,y=Math.floor(at/m.width);let next=at;
  for(const j of [x>0?at-1:-1,x<m.width-1?at+1:-1,y>0?at-m.width:-1,y<m.height-1?at+m.width:-1])if(j>=0&&d[j]<d[next])next=j;
  if(next===at)break;at=next;
  if(clear(u.x,u.y,(at%m.width+.5)*F,(Math.floor(at/m.width)+.5)*F))best=at;else break;
 }
 return {x:(best%m.width+.5)*F,y:(Math.floor(best/m.width)+.5)*F};
}
globalThis.controller={
 draft(h){const pick=['apc','apc','mbt','scout'];return pick.reduce((s,k)=>s+h.draft.costs[k],0)<=h.draft.budget?pick:undefined;},
 hello(h){r=h.rules;m=h.map;side=h.side;points=h.objectives;assign={};memory={};open=new Uint8Array(m.width*m.height);for(let i=0;i<open.length;i++)open[i]=r.terrainSpeed[m.terrain[i]]>0?1:0;fields=points.map(wave);
  const home=h.map.spawns[side],order=points.map((p,i)=>({i,v:Math.hypot(p.x/F-home[0],p.y/F-home[1])/p.weight})).sort((a,b)=>a.v-b.v);
  let ai=0;for(const u of h.units){assign[u.id]=u.kind==='apc'?order[(ai++)%Math.min(2,order.length)].i:order[0].i;}
 },
 tick(o){const orders=[],alive=o.units.filter(u=>u.alive);
 for(const c of o.contacts)memory[c.id]={...c,t:o.tick};
 for(const u of alive){const spec=r.units[u.kind],gun=spec.gun,order={id:u.id};let idx=assign[u.id]??0;
  // Scouts cover the unguarded point; a tank reinforces the pressure point.
  if(u.kind==='scout'||u.kind==='mbt'){
   let best=-Infinity;
   for(let i=0;i<points.length;i++){const p=o.objectives[i],cost=fields[i][tile(u.x,u.y)],guard=alive.filter(v=>v.id!==u.id&&assign[v.id]===i&&v.kind==='apc').length;
    const threat=o.contacts.filter(c=>len(c,p)<p.radius+12*F).length;
    const value=p.weight*18-cost*.18-guard*13+(p.owner!==side?12:0)+(u.kind==='mbt'?threat*14:0);
    if(value>best){best=value;idx=i;}}
   assign[u.id]=idx;
  }
  const p=o.objectives[idx],distance=len(u,p);let goal=waypoint(u,idx),hold=distance<p.radius*.55;
  // Step sideways out of an incoming artillery footprint before it lands.
  for(const shell of o.incoming||[])if(shell.ticks<r.tickHz*2&&len(u,shell)<4*F){const a=angle(u.x-shell.x,u.y-shell.y);const x=u.x+Math.cos(a*TAU/4096)*5*F,y=u.y+Math.sin(a*TAU/4096)*5*F;if(clear(u.x,u.y,x,y)){goal={x,y};hold=false;}}
  if(o.canMove){let a=angle(goal.x-u.x,goal.y-u.y),turn=diff(u.heading,a);
   order.steer=clamp(Math.round(turn/spec.turnRate*F),-F,F);
   order.throttle=hold?0:Math.abs(turn)>600?0:Math.abs(turn)>230?Math.round(F*.35):F;
   if(u.blocked&&!hold){order.throttle=-Math.round(F*.5);order.steer=((Math.floor(o.tick/18)+u.id)%2?1:-1)*F;}
  }
  let target=null,best=-Infinity;
  for(const c of o.contacts){const distance=len(u,c);if(distance>gun.maxRange||distance<(gun.minRange||0))continue;
   if(gun.mode==='direct'&&!c.seenBy.includes(u.id))continue;
   const value=(c.kind==='drone'?3:0)+(1-c.hpFrac/F)*8-distance/F*.12+(len(c,p)<p.radius?5:0);
   if(value>best){target=c;best=value;}}
  if(target&&gun.mode==='direct'){
   const t=len(u,target)/Math.max(gun.shellSpeed||F,F/10),a=target.heading*TAU/4096;
   const x=Math.round(target.x+Math.cos(a)*target.speed*t),y=Math.round(target.y+Math.sin(a)*target.speed*t);
   order.aimAt=[x,y];
   if(u.reload===0&&Math.abs(diff(u.turret,angle(x-u.x,y-u.y)))<gun.aimTolerance*.85)order.fire=[x,y];
  }
  orders.push(order);
 }
 return {units:orders};
 }
};
})();
