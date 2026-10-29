import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, isOnline, sampleAt } from '../src/data/mockApi';
import { decodeState, execute, statistics, STORAGE_KEY } from '../src/domain/business';
import type { DemoState } from '../src/domain/types';

test('leak alert follows confirmation through work order review and closes consistently', () => {
  let state=initialState('leak');
  const alertId='AL-20261014-001';
  state=execute(state,{kind:'confirm',alertId,note:'现场检查发现压力异常，隔离管段进一步核查。'});
  assert.equal(state.alerts.find(a=>a.id===alertId)?.status,'已确认');
  state=execute(state,{kind:'create',alertId,owner:'张工（检修组）',note:'检查 A-02 管段并完成压力测试。'});
  const work=state.works.find(w=>w.alertId===alertId)!;
  assert.equal(work.status,'待处理');
  assert.equal(state.alerts.find(a=>a.id===alertId)?.status,'处理中');
  assert.throws(()=>execute(state,{kind:'create',alertId,owner:'张工（检修组）',note:'重复派单'}),/不能重复派单/);
  state=execute(state,{kind:'start',workId:work.id,note:''});
  assert.equal(state.works.find(w=>w.id===work.id)?.status,'处理中');
  assert.throws(()=>execute(state,{kind:'submit',workId:work.id,note:'   '}),/请填写现场处理说明/);
  state=execute(state,{kind:'submit',workId:work.id,note:'完成现场检查，处理后压力恢复稳定。'});
  assert.equal(state.works.find(w=>w.id===work.id)?.status,'待复核');
  assert.throws(()=>execute(state,{kind:'reject',workId:work.id,note:''}),/请填写退回原因/);
  state=execute(state,{kind:'reject',workId:work.id,note:'请补充下游压力复测记录。'});
  assert.equal(state.works.find(w=>w.id===work.id)?.status,'处理中');
  state=execute(state,{kind:'submit',workId:work.id,note:'补充复测记录，压力及流量差恢复到运行范围。'});
  state=execute(state,{kind:'approve',workId:work.id,note:'复核记录完整，运行指标稳定，准予关闭。'});
  assert.equal(state.works.find(w=>w.id===work.id)?.status,'已关闭');
  assert.equal(state.alerts.find(a=>a.id===alertId)?.status,'已关闭');
  assert.equal(statistics(state,'A').works,0);
  assert.ok((state.works.find(w=>w.id===work.id)?.closedAt||0)>=work.createdAt);
});

test('false alarm closure requires a reason and preserves its evidence and history', () => {
  let state=initialState('leak');
  const alertId='AL-20261014-002';
  assert.throws(()=>execute(state,{kind:'dismiss',alertId,note:''}),/请填写误报原因/);
  const before=state.alerts.find(a=>a.id===alertId)!;
  state=execute(state,{kind:'dismiss',alertId,note:'已核对调压计划，波动由站场工况变化引起。'});
  const after=state.alerts.find(a=>a.id===alertId)!;
  assert.equal(after.status,'已关闭');
  assert.equal(after.resolution,'误报');
  assert.deepEqual(after.evidence,before.evidence);
  assert.equal(after.logs.at(-1)?.action,'判定误报');
  assert.match(after.logs.at(-1)?.note||'',/工况变化/);
});

test('offline device values remain unavailable and scoped counts match the shared records', () => {
  const state=initialState('offline');
  const last=state.alerts.find(a=>a.type==='通信中断'&&a.id==='AL-20261014-003')!;
  assert.equal(isOnline(state,'A-M05'),false);
  assert.equal(sampleAt(state,'A-M05',state.clock).pressure,null);
  assert.equal(sampleAt(state,'A-M05',state.clock).flow,null);
  assert.equal(statistics(state,'all').online,11);
  assert.equal(statistics(state,'all').total,12);
  assert.equal(statistics(state,'all').pending,state.alerts.filter(a=>a.status==='待核查').length);
  assert.equal(statistics(state,'A').pending,state.alerts.filter(a=>a.pipeline==='A'&&a.status==='待核查').length);
  assert.ok(last.logs.length>0);
});

test('processed state survives storage decoding and corrupt data recovers to a valid initial state', () => {
  let state=initialState('leak');
  state=execute(state,{kind:'confirm',alertId:'AL-20261014-001',note:'完成核查并确认异常。'});
  const restored=decodeState(JSON.stringify(state));
  assert.equal(restored.alerts.find(a=>a.id==='AL-20261014-001')?.status,'已确认');
  assert.equal(restored.pipeline,state.pipeline);
  const recovered=decodeState('{broken');
  assert.equal(recovered.version,3);
  assert.equal(recovered.scenario,'leak');
  assert.ok(STORAGE_KEY.length>0);
});
