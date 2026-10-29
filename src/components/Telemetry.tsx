import { useLayoutEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Minus, Pause, Play, Radio, Thermometer, Waves } from 'lucide-react';
import { BASE_TIME, TELEMETRY_INTERVAL, getLiveSeries, isOnline, lastCollected, sampleAt, telemetryTime } from '../data/mockApi';
import type { Sample } from '../domain/types';
import { useStore } from '../state/Store';

/** The primary readout is the exact received sample; decorative transitions must not delay it. */
export function LiveValue({value,digits=2}:{value:number|null;digits?:number}) {
 return <span className="telemetry-number" data-value={value??'unavailable'}>{value===null?'—':value.toLocaleString('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits})}</span>;
}

function Sparkline({samples,metric}:{samples:Sample[];metric:'pressure'|'flow'|'temperature'}) {
 const valid=samples.map(s=>s[metric]).filter((v):v is number=>v!==null);
 if(!valid.length)return <div className="telemetry-no-signal">采集离线 · 等待有效数据</div>;
 const min=Math.min(...valid),max=Math.max(...valid),padding=Math.max((max-min)*.3,metric==='pressure'?.002:metric==='flow'?3:.005);
 const y=(v:number)=>44-(v-min+padding)/(max-min+2*padding)*36;
 let path='',connected=false;
 samples.forEach((s,i)=>{const v=s[metric];if(v===null){connected=false;return;}path+=`${connected?'L':'M'}${(i/(samples.length-1)*300).toFixed(1)},${y(v).toFixed(1)} `;connected=true;});
 const last=samples[samples.length-1][metric];
 return <svg className="telemetry-spark" viewBox="0 0 300 52" preserveAspectRatio="none" aria-hidden="true"><path className="spark-grid" d="M0 15H300M0 36H300"/><path className="spark-trace" d={path}/>{last!==null&&<circle className="spark-tip" cx="300" cy={y(last)} r="3"/>}</svg>;
}

export function LiveStatus({sensorId}:{sensorId:string}) {
 const {state,telemetry,togglePause}=useStore(),online=isOnline(state,sensorId);
 const [renderMs,setRenderMs]=useState<number|null>(null);
 useLayoutEffect(()=>{
  if(state.paused||!telemetry||telemetry.clock!==state.clock)return;
  const id=requestAnimationFrame(()=>setRenderMs(Math.max(0,performance.now()-telemetry.sampledAt)));
  return()=>cancelAnimationFrame(id);
 },[state.clock,state.paused,telemetry]);
 return <section className={`telemetry-stream ${state.paused?'is-paused':''} ${!online?'is-offline':''}`} aria-label="实时采集状态" data-sample-time={state.clock}>
  <div className="stream-source"><span className="stream-radio"><Radio size={20}/><i/></span><div><strong>{state.paused?'实时展示已暂停':online?'实时模拟采集中':'设备离线 · 等待采集'}</strong><small>{sensorId} · {online?'压力 / 流量 / 温度':'保留最后采集时间，缺失值不补齐'}</small></div></div>
  <div className="stream-bars" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{animationDelay:`${-i*.12}s`,height:`${10+(i*17%25)}px`}}/>)}</div>
  <div className="stream-timestamp"><span>最近采集 <b>250 ms / 次 · 4 Hz</b></span><time>{telemetryTime(lastCollected(state,sensorId),true)}</time></div>
  <div className="stream-latency"><span>前端刷新耗时</span><b data-render-ms={renderMs??''}>{state.paused?'已暂停':!online?'无采样':renderMs===null?'测量中':`${Math.round(renderMs)} ms`}</b></div>
  <span className="stream-sequence">FRAME <b>{String(Math.max(0,Math.floor((state.clock-BASE_TIME)/TELEMETRY_INTERVAL))+1).padStart(6,'0')}</b></span>
  <button className="button secondary stream-pause" onClick={togglePause} aria-label={state.paused?'继续实时展示':'暂停实时展示'}>{state.paused?<Play size={14}/>:<Pause size={14}/>} {state.paused?'继续展示':'暂停展示'}</button>
 </section>;
}

export function TelemetryDeck({sensorId}:{sensorId:string}) {
 const {state}=useStore();
 const samples=useMemo(()=>getLiveSeries(state,sensorId,state.clock-60000,state.clock),[state.clock,state.scenario,state.alerts,sensorId]);
 const value=samples[samples.length-1],previous=sampleAt(state,sensorId,state.clock-TELEMETRY_INTERVAL);
 const metrics=[{title:'管道压力',key:'pressure' as const,unit:'MPa',digits:3,Icon:Activity},{title:'标准状态体积流量',key:'flow' as const,unit:'Nm³/h',digits:0,Icon:Waves},{title:'介质温度',key:'temperature' as const,unit:'℃',digits:2,Icon:Thermometer}];
 return <div className={`telemetry-deck ${state.paused?'is-paused':''}`} aria-label="实时检测数据">{metrics.map(m=>{
  const v=value[m.key],prev=previous[m.key],delta=v!==null&&prev!==null?+(v-prev).toFixed(m.digits):null;
  const Direction=delta===null||delta===0?Minus:delta>0?ArrowUpRight:ArrowDownRight;
  return <section className={`telemetry-card telemetry-${m.key}`} key={m.key} data-metric={m.key}>
   <div className="telemetry-card-title"><span><m.Icon size={17}/>{m.title}</span><span className="telemetry-unit">{m.unit}</span></div>
   <div className="telemetry-value"><LiveValue value={v} digits={m.digits}/><span className={`telemetry-delta ${delta!==null&&delta<0?'falling':''}`}><Direction size={14}/>{delta===null?'无信号':`${delta>0?'+':''}${delta.toFixed(m.digits)}`}</span></div>
   <Sparkline samples={samples} metric={m.key}/>
   <div className="telemetry-card-foot"><span>最近 60 秒 · 独立刻度</span><span>{v===null?'离线':state.paused?'已暂停':'● 250 ms 更新'}</span></div>
  </section>;
 })}</div>;
}

export function RecentSamples({sensorId}:{sensorId:string}) {
 const {state}=useStore();
 const rows=Array.from({length:6},(_,i)=>sampleAt(state,sensorId,state.clock-i*TELEMETRY_INTERVAL));
 return <div className="table-wrap"><table className="recent-samples"><thead><tr><th>采样时间</th><th>压力 / MPa</th><th>流量 / Nm³/h</th><th>温度 / ℃</th><th>数据质量</th></tr></thead><tbody>{rows.map((s,i)=><tr key={`${sensorId}-${s.time}`} className={i===0?'sample-newest':''}><td className="mono">{telemetryTime(s.time)}{i===0&&<span className="latest-tag">最新</span>}</td><td>{s.pressure?.toFixed(3)??'—'}</td><td>{s.flow?.toLocaleString('zh-CN')??'—'}</td><td>{s.temperature?.toFixed(2)??'—'}</td><td><span className={`sample-quality ${s.pressure===null?'missing':''}`}>{s.pressure===null?'缺失 · 设备离线':'有效 · 模拟采样'}</span></td></tr>)}</tbody></table></div>;
}
