import { initialState, sensors, isOnline, staff } from '../data/mockApi';
import type { Command, DemoState, Log, PipelineId } from './types';
const required=(value:string,label:string)=>{if(!value.trim())throw new Error(`请填写${label}`);if(value.trim().length>2000)throw new Error(`${label}不能超过 2000 字`);return value.trim();};
export function execute(state:DemoState,command:Command):DemoState {
 const next=structuredClone(state),now=next.clock;
 const log=(action:string,note:string,actor='值班员 · 陈晨'):Log=>({at:now,actor,action,note});
 if('alertId' in command) {
  const alert=next.alerts.find(a=>a.id===command.alertId);if(!alert)throw new Error('告警不存在');
  const note=required(command.note,command.kind==='dismiss'?'误报原因':command.kind==='create'?'任务描述':'核查说明');
  if(command.kind==='create') {
   if(next.works.some(w=>w.alertId===alert.id&&w.status!=='已关闭'))throw new Error('该告警已有有效工单，不能重复派单');
   if(alert.status!=='已确认')throw new Error('请先确认异常后创建工单');
   if(!staff.includes(command.owner))throw new Error('请选择有效的负责人');
   const id=`WO-20261014-${String(next.works.filter(w=>w.id.startsWith('WO-20261014')).length+1).padStart(3,'0')}`;
   next.works.unshift({id,alertId:alert.id,pipeline:alert.pipeline,type:alert.type==='通信中断'?'设备检修':'管线巡检',owner:command.owner,description:note,createdAt:now,status:'待处理',logs:[log('创建并派单',note)]});
   alert.owner=command.owner;alert.status='处理中';alert.logs.push(log('关联工单',`${id} · ${command.owner}`));
  } else {
   if(alert.status!=='待核查')throw new Error('该事件已核查，不能重复确认');
   alert.status=command.kind==='confirm'?'已确认':'已关闭';
   if(command.kind==='dismiss')alert.resolution='误报';
   alert.logs.push(log(command.kind==='confirm'?(alert.type==='通信中断'?'确认设备异常':'确认异常'):'判定误报',note));
  }
 } else {
  const work=next.works.find(w=>w.id===command.workId);if(!work)throw new Error('工单不存在');
  const alert=next.alerts.find(a=>a.id===work.alertId);if(!alert)throw new Error('关联告警不存在');
  if(command.kind==='start') {
   if(work.status!=='待处理')throw new Error('仅待处理工单可以开始处理');
   work.status='处理中';work.logs.push(log('开始处理','已领取任务，开始现场核查。',work.owner));
  } else if(command.kind==='submit') {
   if(work.status!=='处理中')throw new Error('仅处理中工单可以提交处理结果');
   const note=required(command.note,'现场处理说明');work.status='待复核';work.result=note;work.logs.push(log('提交处理结果',note,work.owner));
  } else {
   if(work.status!=='待复核')throw new Error('仅待复核工单可以进行复核');
   const note=required(command.note,command.kind==='reject'?'退回原因':'复核说明');
   work.review=note;
   if(command.kind==='reject'){work.status='处理中';work.logs.push(log('复核退回',note,'复核员 · 刘工'));}
   else {work.status='已关闭';work.closedAt=now;alert.status='已关闭';alert.resolution='已解决';work.logs.push(log('复核关闭',note,'复核员 · 刘工'));alert.logs.push(log('问题已解决',`${work.id} 复核通过：${note}`,'复核员 · 刘工'));}
  }
 }
 return next;
}
export function statistics(state:DemoState,pipeline:PipelineId|'all'=state.pipeline) {const scoped=state.alerts.filter(a=>pipeline==='all'||a.pipeline===pipeline),points=sensors.filter(s=>pipeline==='all'||s.pipeline===pipeline);return {segments:pipeline==='all'?6:3,pending:scoped.filter(a=>a.status==='待核查').length,active:scoped.filter(a=>a.status!=='已关闭').length,online:points.filter(s=>isOnline(state,s.id)).length,total:points.length,works:state.works.filter(w=>(pipeline==='all'||w.pipeline===pipeline)&&w.status!=='已关闭').length};}
export const STORAGE_KEY='pipeline-demo-v3';
export function decodeState(raw:string|null):DemoState {
 if(!raw)return initialState();
 try {
  const parsed=JSON.parse(raw) as DemoState;
  if(parsed.version!==3||!['normal','leak','offline'].includes(parsed.scenario)||!Number.isFinite(parsed.clock)||typeof parsed.paused!=='boolean'||!['A','B','all'].includes(parsed.pipeline)||!Array.isArray(parsed.alerts)||!Array.isArray(parsed.works))return initialState();
  const fresh=initialState(parsed.scenario);
  const ids=fresh.alerts.map(a=>a.id);
  if(parsed.alerts.length!==ids.length||new Set(parsed.alerts.map(a=>a.id)).size!==ids.length||parsed.alerts.some(a=>!ids.includes(a.id)||!['待核查','已确认','处理中','已关闭'].includes(a.status)||!Array.isArray(a.logs)||a.logs.some(l=>!Number.isFinite(l.at)||typeof l.note!=='string'||typeof l.actor!=='string'||typeof l.action!=='string')))return initialState();
  if(parsed.works.some(w=>!ids.includes(w.alertId)||!['待处理','处理中','待复核','已关闭'].includes(w.status)||!Number.isFinite(w.createdAt)||typeof w.owner!=='string'||typeof w.description!=='string'||!Array.isArray(w.logs)||w.logs.some(l=>!Number.isFinite(l.at)||typeof l.note!=='string')))return initialState();
  // 固定种子中的原始证据不可被持久化状态改写。
  parsed.alerts=parsed.alerts.map(a=>({...fresh.alerts.find(seed=>seed.id===a.id)!,status:a.status,owner:a.owner,resolution:a.resolution,logs:a.logs}));
  return parsed;
 }catch{return initialState();}
}
export function csvText(headers:string[],rows:(string|number)[][]) {const quote=(v:string|number)=>`"${String(v).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')}"`;return '\uFEFF'+[headers,...rows].map(r=>r.map(quote).join(',')).join('\r\n');}
export function downloadCsv(name:string,headers:string[],rows:(string|number)[][]) {const url=URL.createObjectURL(new Blob([csvText(headers,rows)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
