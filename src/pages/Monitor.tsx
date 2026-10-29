import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/Store';
import { fullTime, getLiveSeries, getSeries, isOnline, lastCollected, sensors } from '../data/mockApi';
import { Badge, PageHeading, Panel } from '../components/UI';
import { TrendChart } from '../components/Charts';
import { LiveStatus, RecentSamples, TelemetryDeck } from '../components/Telemetry';
export default function Monitor({query,go}:{query:string;go:(path:string)=>void}) {
 const {state,setPipeline}=useStore();const params=new URLSearchParams(query),requested=params.get('sensor');
 const [sensorId,setSensorId]=useState(requested||`${state.pipeline==='all'?'A':state.pipeline}-M04`),[range,setRange]=useState(params.has('at')?60:5),[loading,setLoading]=useState(true);
 const lastQuery=useRef<string|null>(null);
 const pendingPipeline=useRef<string|null>(null);
 useEffect(()=>{
  if(lastQuery.current!==query){
   lastQuery.current=query;
   const target=sensors.find(s=>s.id===requested);
   setRange(params.has('at')?60:5);
   if(target){pendingPipeline.current=target.pipeline!==state.pipeline?target.pipeline:null;setSensorId(target.id);setPipeline(target.pipeline);return;}
  }
  if(pendingPipeline.current){if(state.pipeline===pendingPipeline.current)pendingPipeline.current=null;return;}
  if(state.pipeline!=='all'&&!sensorId.startsWith(state.pipeline))setSensorId(`${state.pipeline}-M04`);
 },[query,state.pipeline]);
 useEffect(()=>{setLoading(true);const id=setTimeout(()=>setLoading(false),160);return()=>clearTimeout(id);},[sensorId,range]);
 const sensor=sensors.find(s=>s.id===sensorId)||sensors[3],online=isOnline(state,sensor.id);
 const linked=state.alerts.find(a=>a.id===params.get('alert'))||state.alerts.find(a=>a.sensors.includes(sensor.id)&&a.id.includes('20261014'));
 const requestedTime=Number(params.get('at'));
 const evidenceTime=params.has('at')&&Number.isFinite(requestedTime)&&requestedTime>0&&requestedTime<=state.clock?requestedTime:undefined;
 const to=evidenceTime?Math.min(state.clock,Math.max(evidenceTime+20*60000,linked?.end||evidenceTime)):state.clock;
 const series=useMemo(()=>(evidenceTime?getSeries:getLiveSeries)(state,sensor.id,to-range*60000,to),[state.scenario,state.alerts,sensor.id,to,range,evidenceTime]);
 return <><PageHeading eyebrow="LIVE TELEMETRY" title="实时监测" description="以 250 ms 周期展示最新原始采样，追踪管道运行变化。" actions={<Badge tone={state.paused?'gray':'green'}>{state.paused?'模拟更新已暂停':'模拟更新中'}</Badge>}/><LiveStatus sensorId={sensor.id}/><Panel className="filter-panel"><div className="filters"><label>当前管线<select aria-label="监测管线" value={sensor.pipeline} onChange={e=>setPipeline(e.target.value as 'A'|'B')}><option value="A">示例管线 A</option><option value="B">示例管线 B</option></select></label><label>监测点<select aria-label="监测点" value={sensor.id} onChange={e=>setSensorId(e.target.value)}>{sensors.filter(s=>s.pipeline===sensor.pipeline).map(s=><option value={s.id} key={s.id}>{s.name} · {s.id}</option>)}</select></label><div className="range-control"><span>时间范围</span><div className="segmented">{[1,5,15,30,60].map(n=><button key={n} aria-pressed={range===n} className={range===n?'active':''} onClick={()=>setRange(n)}>{evidenceTime?'窗口':'最近'} {n} 分钟</button>)}</div></div></div></Panel>{evidenceTime&&<div className="info-banner">已定位告警异常窗口：{fullTime(linked?.at||evidenceTime)} ～ {fullTime(linked?.end||to)}。可缩放图表查看异常前后变化。<button className="text-button" onClick={()=>go(`/monitor?sensor=${sensor.id}`)}>返回实时窗口 →</button></div>}{!online&&<div className="offline-banner"><Badge>离线</Badge><span>{sensor.deviceId} 通信中断。最后采集：{fullTime(lastCollected(state,sensor.id))}；离线期间曲线保留缺口。</span></div>}<TelemetryDeck sensorId={sensor.id}/><div className="two-columns"><Panel title="压力趋势" meta={<span>单位：MPa</span>}>{loading?<div className="chart-loading">正在加载模拟曲线…</div>:<TrendChart samples={series} metric="pressure" window={linked?[linked.at,linked.end]:undefined} live={!evidenceTime} height={300}/>}</Panel><Panel title="标准状态体积流量趋势" meta={<span>单位：Nm³/h</span>}>{loading?<div className="chart-loading">正在加载模拟曲线…</div>:<TrendChart samples={series} metric="flow" window={linked?[linked.at,linked.end]:undefined} live={!evidenceTime} height={300}/>}</Panel></div><Panel title="最近采样记录" meta={<span>当前监测点 · 每 250 ms 新增一条 · 最新在上</span>}><RecentSamples sensorId={sensor.id}/></Panel>{linked&&<div className="monitor-event-link"><div><strong>关联事件 · {linked.type}</strong><span>{linked.location} · {linked.status}</span></div><button className="button secondary" onClick={()=>go(`/alerts/${linked.id}`)}>查看诊断证据 →</button></div>}<Panel title="数据质量与采集信息"><div className="quality-grid"><div><span>采集设备</span><strong>{sensor.deviceId}</strong><small>综合采集终端 · SIM-300</small></div><div><span>设备在线状态</span><Badge>{online?'在线':'离线'}</Badge><small>{online?'模拟心跳正常':'未收到模拟心跳'}</small></div><div><span>数据质量</span><strong>{online?'有效 · 模拟数据':'数据不可用'}</strong><small>4 Hz 模拟采样 · 原始值直接显示</small></div><div><span>最后采集时间</span><strong className="mono">{fullTime(lastCollected(state,sensor.id))}</strong><small>时间戳补偿调度漂移，可随时暂停</small></div></div></Panel><p className="footnote">悬停查看数值；拖动底部滑块或在图表内滚动缩放。红色区域为异常窗口，曲线恢复不自动关闭告警。</p></>;
}
