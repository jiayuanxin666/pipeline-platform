import type { Alert, DemoState, Device, Pipeline, PipelineId, Sample, Scenario, Sensor, WorkOrder } from '../domain/types';
export const BASE_TIME = Date.parse('2026-10-14T10:30:00+08:00');
export { TELEMETRY_INTERVAL } from '../domain/telemetryScheduler';
const dt = (day: string, clock: string) => Date.parse(`2026-10-${day}T${clock}+08:00`);
export const pipelines: Pipeline[] = ['A','B'].map(id => ({id: id as PipelineId, name: `示例管线 ${id}`, length:30, medium:'天然气', segments:[0,10,20].map((start,i)=>({id:`${id}-0${i+1}`,pipeline:id as PipelineId,start,end:start+10}))}));
export const sensors: Sensor[] = pipelines.flatMap(p=>[0,5,10,20,25,30].map((km,i)=>({id:`${p.id}-M0${i+1}`,pipeline:p.id,km,name:`${p.id} · ${km===0?'起点站':km===30?'终点站':`${km} km监测点`}`,deviceId:`DAQ-${p.id}-0${i+1}`})));
export const devices: Device[] = sensors.map(s=>({id:s.deviceId,sensorId:s.id,model:'综合采集终端 · SIM-300'}));
export const staff = ['张工（检修组）','李工（巡检组）','王工（设备组）'];
export const kmLabel = (km:number) => `K${Math.floor(km)}+${Math.round((km%1)*1000).toString().padStart(3,'0')}`;
const timeFormatter=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'});
const secondsFormatter=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit'});
const dateFormatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'});
export const timeLabel = (t:number, seconds=false) => (seconds?secondsFormatter:timeFormatter).format(t);
export const dateLabel = (t:number) => dateFormatter.format(t);
export const fullTime = (t:number) => `${dateLabel(t)} ${timeLabel(t,true)}`;
export const telemetryTime = (t:number,withDate=false) => `${withDate?fullTime(t):timeLabel(t,true)}.${String(((Math.floor(t)%1000)+1000)%1000).padStart(3,'0')}`;
const makeAlert=(a:Omit<Alert,'logs'|'owner'|'status'>):Alert=>({...a,status:'待核查',owner:'未分配',logs:[{at:a.at,actor:'模拟规则引擎',action:'发现异常',note:a.rule}]});
function currentAlerts(scenario:Scenario):Alert[] {
 const leak=makeAlert({id:'AL-20261014-001',pipeline:'A',segment:'A-02',type:'疑似泄漏',priority:'高',at:dt('14','10:08:00'),end:dt('14','10:24:00'),sensors:['A-M03','A-M04'],location:'K12+200～K12+600',range:[12.2,12.6],rule:'压力降幅 > 0.40 MPa 且管段进出口流量差 > 8%，持续 3 分钟',evidence:['下游压力：5.52 → 4.94 MPa，下降 0.58 MPa','异常窗口进出口流量：约 12,750 / 11,550 Nm³/h，差值约 9.4%','异常持续 16 分钟；10:24 后曲线恢复','10 km 与 20 km 采集设备在线，数据质量有效'],operating:'阀门开度保持 80%；未记录计划性调压。曲线恢复不代表问题已解决，需人工核查。'});
 const pressure=makeAlert({id:'AL-20261014-002',pipeline:'B',segment:'B-01',type:'压力预警',priority:'中',at:dt('14','10:12:00'),end:dt('14','10:20:00'),sensors:['B-M02'],location:'K5+000',rule:'压力波动幅度 > 0.25 MPa，持续 2 分钟',evidence:['压力在 5.70～6.42 MPa 范围波动','流量变化与调压同步，进出口流量差未超过阈值','相关设备在线，未发现通信异常'],operating:'10:12～10:20 为模拟站场调压窗口，可核查为运行工况变化。'});
 const offline=makeAlert({id:'AL-20261014-003',pipeline:'A',segment:'A-03',type:'通信中断',priority:'中',at:dt('14','10:16:00'),end:BASE_TIME,sensors:['A-M05'],location:'K25+000',rule:'连续 60 秒未收到采集设备心跳',evidence:['DAQ-A-05 最后采集：2026-10-14 10:15:00','离线后压力、流量与温度均为数据不可用','相邻监测点在线，离线不等于泄漏'],operating:'模拟采集链路中断，请核查设备电源与通信链路。关闭工单后恢复模拟通信。'});
 return scenario==='normal'?[]:scenario==='offline'?[offline]:[leak,pressure,offline];
}
function historical(): {alerts:Alert[];works:WorkOrder[]} {
 const definitions=[{day:'12',pipeline:'A' as const,type:'压力预警' as const,hours:1.5},{day:'11',pipeline:'B' as const,type:'通信中断' as const,hours:2.25},{day:'09',pipeline:'A' as const,type:'疑似泄漏' as const,hours:3}];
 const alerts=definitions.map((d,i):Alert=>{const at=dt(d.day,'09:00:00');return {id:`AL-202610${d.day}-00${i+1}`,pipeline:d.pipeline,segment:`${d.pipeline}-02`,type:d.type,priority:d.type==='疑似泄漏'?'高':'中',at,end:at+15*60000,status:'已关闭',owner:staff[i],sensors:[`${d.pipeline}-M04`],location:'K20+000',rule:'历史模拟异常规则触发',evidence:['历史模拟压力波动与设备运行记录','事件已经人工核查、现场处理并通过复核'],operating:'历史教学样例；原始证据保留。',resolution:'已解决',logs:[{at,actor:'模拟规则引擎',action:'发现异常',note:'历史教学事件'},{at:at+10*60000,actor:'值班员 · 陈晨',action:'确认异常',note:'现场核查确认异常'},{at:at+d.hours*3600000,actor:'复核员 · 刘工',action:'复核关闭',note:'处理后指标恢复，复核通过'}]};});
 const works=alerts.map((a,i):WorkOrder=>{const createdAt=a.at+15*60000,closedAt=createdAt+definitions[i].hours*3600000;return {id:`WO-202610${definitions[i].day}-001`,alertId:a.id,pipeline:a.pipeline,type:a.type==='通信中断'?'设备检修':'管线巡检',owner:a.owner,description:'历史模拟巡检任务',createdAt,closedAt,status:'已关闭',result:'现场检查并恢复正常运行。',review:'复核通过。',logs:[{at:createdAt,actor:'值班员 · 陈晨',action:'创建并派单',note:'历史模拟任务'},{at:closedAt,actor:'复核员 · 刘工',action:'复核关闭',note:'复核通过'}]};});
 // 统一关闭时间：告警关闭与关联工单完全一致。
 alerts.forEach((a,i)=>a.logs[a.logs.length-1].at=works[i].closedAt!);
 return {alerts,works};
}
export function initialState(scenario:Scenario='leak'):DemoState {const history=historical();return {version:3,scenario,clock:BASE_TIME,paused:false,pipeline:'A',alerts:[...currentAlerts(scenario),...history.alerts],works:history.works};}
export function isOnline(state:DemoState,sensorId:string):boolean {return !(sensorId==='A-M05' && state.scenario!=='normal' && state.alerts.some(a=>a.id==='AL-20261014-003'&&a.status!=='已关闭'));}
export function lastCollected(state:DemoState,sensorId:string):number {return isOnline(state,sensorId)?state.clock:dt('14','10:15:00');}
// 模拟数据访问层：固定数学波形，无运行时随机数；后续可替换成真实 API。
export function sampleAt(state:DemoState,sensorId:string,time:number):Sample {
 const s=sensors.find(s=>s.id===sensorId);if(!s)return {time,pressure:null,flow:null,temperature:null};
 if(s.id==='A-M05'&&!isOnline(state,s.id)&&time>dt('14','10:15:00'))return {time,pressure:null,flow:null,temperature:null};
 const minute=(time-(BASE_TIME-60*60000))/60000;
 const second=(time-BASE_TIME)/1000;
 const wave=Math.sin(minute*.63+s.km)*.025+Math.cos(minute*.21)*.012;
 let pressure=6.25-s.km*.036+wave+(s.pipeline==='B'?.06:0);
 let flow=12850-s.km*5+Math.sin(minute*.45+s.km*.1)*65;
 if(state.scenario==='leak'&&s.pipeline==='A'&&time>=dt('14','10:08:00')&&time<dt('14','10:24:00')&&s.km>=20){pressure-=.58;flow-=1200;}
 if(state.scenario==='leak'&&s.pipeline==='B'&&time>=dt('14','10:12:00')&&time<dt('14','10:20:00')){pressure+=Math.sin(minute*1.9)*.35;flow+=Math.sin(minute*1.9)*180;}
 return {time,pressure:+(pressure+Math.sin(second*.87+s.km)*.007).toFixed(3),flow:Math.round(flow+Math.sin(second*.61+s.km)*14),temperature:+(20.5+s.km*.025+Math.sin(minute*.15)*.4+Math.sin(second*.43+s.km)*.018).toFixed(2)};
}
export function getSeries(state:DemoState,sensorId:string,from:number,to:number):Sample[] {const result:Sample[]=[];for(let time=from;time<=to;time+=30000)result.push(sampleAt(state,sensorId,time));return result;}
/** Stable sample timestamps let charts append new measurements without shifting old values. */
export function getLiveSeries(state:DemoState,sensorId:string,from:number,to:number):Sample[] {
 const step=to-from<=60000?250:to-from<=5*60000?1000:5000;
 const result:Sample[]=[];
 for(let time=Math.ceil(from/step)*step;time<=to;time+=step)result.push(sampleAt(state,sensorId,time));
 if(!result.length||result[result.length-1].time!==to)result.push(sampleAt(state,sensorId,to));
 return result;
}
export const mockApi={pipelines,sensors,devices,getSeries,sampleAt,isOnline,lastCollected,initialState};
