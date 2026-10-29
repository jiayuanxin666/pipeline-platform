import { dateLabel } from '../data/mockApi';
import type { DemoState } from './types';

const DAY = 86400000;
function dayStart(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(`${value}T00:00:00+08:00`);
  return Number.isFinite(time) && dateLabel(time) === value ? time : NaN;
}

/** One query feeds the history table, counters, and every chart. */
export function historyReport(state: DemoState, from: string, to: string, search = '') {
  const start = dayStart(from), end = dayStart(to);
  const error = !Number.isFinite(start) || !Number.isFinite(end) ? '请选择完整、有效的开始和结束日期。' : start > end ? '开始日期不能晚于结束日期。' : '';
  const keyword = search.trim().toLowerCase();
  const matches = state.alerts.filter(a => (state.pipeline === 'all' || a.pipeline === state.pipeline) && `${a.id} ${a.location} ${a.type} ${a.segment}`.toLowerCase().includes(keyword));
  const records = error ? [] : matches.filter(a => a.at >= start && a.at < end + DAY).sort((a,b) => b.at - a.at);
  const ids = new Set(matches.map(a => a.id));
  const closed = error ? [] : state.works.filter(w => ids.has(w.alertId) && w.status === '已关闭' && w.closedAt !== undefined && w.closedAt >= start && w.closedAt < end + DAY);
  const days = error ? 0 : Math.round((end-start)/DAY)+1;
  const bucketDays = Math.max(1, Math.ceil(days / 14));
  const daily = { labels: [] as string[], counts: [] as number[], bucketDays };
  for (let i = 0; i < days; i += bucketDays) {
    const low = start + i*DAY, high = Math.min(end + DAY, low + bucketDays*DAY);
    daily.labels.push(bucketDays === 1 ? dateLabel(low).slice(5) : `${dateLabel(low).slice(5)}～${dateLabel(high-DAY).slice(5)}`);
    daily.counts.push(records.filter(a => a.at >= low && a.at < high).length);
  }
  const averageHours = closed.length ? closed.reduce((sum,w) => sum + (w.closedAt!-w.createdAt)/3600000, 0) / closed.length : 0;
  return { error, records, closed, daily, averageHours };
}
