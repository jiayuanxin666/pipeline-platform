import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/data/mockApi';
import { historyReport } from '../src/domain/reporting';

test('historical chart follows selected dates, including dates older than the live seven-day window', () => {
  const state = initialState(); state.pipeline = 'all';
  const report = historyReport(state, '2026-10-09', '2026-10-09');
  assert.equal(report.records.length, 1);
  assert.deepEqual(report.daily.labels, ['10-09']);
  assert.deepEqual(report.daily.counts, [1]);
});
test('wide date queries include every result once and keep chart buckets bounded', () => {
  const state = initialState(); state.pipeline = 'all';
  const report = historyReport(state, '2025-01-01', '2026-12-31');
  assert.ok(report.daily.labels.length <= 14);
  assert.equal(report.daily.counts.reduce((a,b)=>a+b,0), report.records.length);
});
test('pipeline and keyword filters also constrain closed-work statistics', () => {
  const state = initialState(); state.pipeline = 'B';
  const report = historyReport(state, '2026-10-01', '2026-10-14', '通信中断');
  assert.equal(report.records.length, 1);
  assert.equal(report.closed.length, 1);
  assert.equal(report.averageHours, 2.25);
  assert.ok(report.records.every(a => a.pipeline === 'B'));
});
test('invalid, missing and reversed dates return a visible validation error and no misleading totals', () => {
  for (const [from,to] of [['','2026-10-14'],['2026-02-30','2026-10-14'],['2026-10-15','2026-10-01']]) {
    const report = historyReport(initialState(),from,to);
    assert.ok(report.error);
    assert.equal(report.records.length,0);
    assert.equal(report.closed.length,0);
    assert.equal(report.daily.counts.length,0);
  }
});
