import test from 'node:test';
import assert from 'node:assert/strict';
import { startTelemetryScheduler, type TelemetryFrame } from '../src/domain/telemetryScheduler';

function harness() {
 let now=0,id=0;
 const timers=new Map<number,{callback:()=>void;due:number}>(),frames=new Map<number,()=>void>();
 const packets:TelemetryFrame[]=[];
 const stop=startTelemetryScheduler(10000,p=>packets.push(p),{
  now:()=>now,
  timeout:(callback,delay)=>{const next=++id;timers.set(next,{callback,due:now+delay});return next;},
  clearTimeout:key=>{timers.delete(key);},frame:callback=>{const next=++id;frames.set(next,callback);return next;},cancelFrame:key=>{frames.delete(key);},
 });
 const flush=()=>{const ready=[...frames.values()];frames.clear();ready.forEach(callback=>callback());};
 const advance=(milliseconds:number,draw=true)=>{now+=milliseconds;for(const [key,timer] of [...timers])if(timer.due<=now){timers.delete(key);timer.callback();}if(draw)flush();};
 return {packets,advance,flush,stop,timers,frames};
}

test('late callbacks catch up to monotonic time instead of accumulating one-step clock drift',()=>{
 const h=harness();h.advance(250);h.advance(1375);
 assert.deepEqual(h.packets.map(p=>p.clock),[10250,11500]);
 assert.equal(h.packets[1].sampledAt,1500);
 assert.equal(h.packets[1].deliveredAt,1625);
 h.advance(125);assert.equal(h.packets.at(-1)?.clock,11750);
 h.stop();
});

test('one pending browser frame coalesces intermediate samples and publishes only the newest value',()=>{
 const h=harness();h.advance(250,false);h.advance(250,false);h.advance(250,false);
 assert.equal(h.frames.size,1);assert.equal(h.packets.length,0);
 h.flush();assert.deepEqual(h.packets.map(p=>p.clock),[10750]);h.stop();
});

test('stopping cancels sampling and pending display callbacks without leaking late updates',()=>{
 const h=harness();h.advance(250,false);h.stop();h.advance(2000);h.flush();
 assert.equal(h.packets.length,0);assert.equal(h.timers.size,0);assert.equal(h.frames.size,0);
});
