export const TELEMETRY_INTERVAL = 250;
export interface TelemetryFrame { clock:number; sampledAt:number; deliveredAt:number }
interface Runtime {
 now:()=>number;
 timeout:(callback:()=>void,delay:number)=>number;
 clearTimeout:(id:number)=>void;
 frame:(callback:()=>void)=>number;
 cancelFrame:(id:number)=>void;
}
const browserRuntime:Runtime={
 now:()=>performance.now(),timeout:(cb,delay)=>window.setTimeout(cb,delay),clearTimeout:id=>window.clearTimeout(id),
 frame:cb=>requestAnimationFrame(cb),cancelFrame:id=>cancelAnimationFrame(id),
};

/** Anchor to monotonic elapsed time. Publish only the newest due sample on the next display frame. */
export function startTelemetryScheduler(clock:number,publish:(frame:TelemetryFrame)=>void,runtime:Runtime=browserRuntime) {
 const origin=runtime.now();
 let timer:number|undefined,frame:number|undefined,latest:TelemetryFrame|undefined,lastTick=0,stopped=false;
 const collect=()=>{
  if(stopped)return;
  const now=runtime.now(),tick=Math.floor((now-origin)/TELEMETRY_INTERVAL);
  if(tick>lastTick){
   lastTick=tick;
   latest={clock:clock+tick*TELEMETRY_INTERVAL,sampledAt:origin+tick*TELEMETRY_INTERVAL,deliveredAt:now};
   if(frame===undefined)frame=runtime.frame(()=>{frame=undefined;if(!stopped&&latest){const packet=latest;latest=undefined;publish(packet);}});
  }
  timer=runtime.timeout(collect,Math.max(1,origin+(tick+1)*TELEMETRY_INTERVAL-runtime.now()));
 };
 timer=runtime.timeout(collect,TELEMETRY_INTERVAL);
 return ()=>{stopped=true;if(timer!==undefined)runtime.clearTimeout(timer);if(frame!==undefined)runtime.cancelFrame(frame);latest=undefined;};
}
