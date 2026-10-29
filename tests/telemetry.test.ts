import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_TIME, getLiveSeries, initialState, lastCollected, sampleAt } from '../src/data/mockApi';

test('250ms telemetry varies deterministically without replacing historical measurements', () => {
 const state=initialState();
 // A quantized temperature can legitimately repeat over several frames; never invent movement.
 const values=Array.from({length:32},(_,i)=>sampleAt(state,'A-M04',BASE_TIME+i*250));
 for(const metric of ['pressure','flow','temperature'] as const)assert.ok(new Set(values.map(v=>v[metric])).size>1,`${metric} should vary at the live cadence`);
 assert.deepEqual(values[2],sampleAt({...state,clock:BASE_TIME+60000},'A-M04',BASE_TIME+500));
});

test('rolling samples append the exact latest point, preserve overlapping timestamps and stay bounded', () => {
 const state=initialState();
 const first=getLiveSeries(state,'A-M04',BASE_TIME-60000,BASE_TIME);
 const next=getLiveSeries(state,'A-M04',BASE_TIME-59750,BASE_TIME+250);
 assert.equal(first.length,241);
 assert.deepEqual(first.slice(1),next.slice(0,-1));
 assert.equal(next.at(-1)?.time,BASE_TIME+250);
 const long=getLiveSeries(state,'B-M02',BASE_TIME-3600000,BASE_TIME+1234);
 assert.ok(long.length<=722);
 assert.equal(long.at(-1)?.time,BASE_TIME+1234);
});

test('offline devices keep missing readings and their last actual collection time while the feed clock advances', () => {
 const state=initialState('offline'),last=lastCollected(state,'A-M05');
 const samples=getLiveSeries({...state,clock:BASE_TIME+60000},'A-M05',BASE_TIME,BASE_TIME+60000);
 assert.ok(samples.every(s=>s.pressure===null&&s.flow===null&&s.temperature===null));
 assert.equal(lastCollected({...state,clock:BASE_TIME+60000},'A-M05'),last);
});
