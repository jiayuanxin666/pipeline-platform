export type PipelineId = 'A' | 'B';
export type Scenario = 'normal' | 'leak' | 'offline';
export type AlertType = '疑似泄漏' | '压力预警' | '通信中断';
export type AlertStatus = '待核查' | '已确认' | '处理中' | '已关闭';
export type WorkStatus = '待处理' | '处理中' | '待复核' | '已关闭';
export interface Pipeline { id: PipelineId; name: string; length: number; medium: string; segments: Segment[] }
export interface Segment { id: string; pipeline: PipelineId; start: number; end: number }
export interface Sensor { id: string; pipeline: PipelineId; km: number; name: string; deviceId: string }
export interface Device { id: string; sensorId: string; model: string }
export interface Sample { time: number; pressure: number | null; flow: number | null; temperature: number | null }
export interface Log { at: number; actor: string; action: string; note: string }
export interface Alert {
 id: string; pipeline: PipelineId; segment: string; type: AlertType; priority: '高' | '中' | '低';
 at: number; end: number; status: AlertStatus; owner: string; sensors: string[]; location: string;
 range?: [number, number]; rule: string; evidence: string[]; operating: string;
 resolution?: '误报' | '已解决'; logs: Log[];
}
export interface WorkOrder { id: string; alertId: string; pipeline: PipelineId; type: string; owner: string; description: string; createdAt: number; closedAt?: number; status: WorkStatus; result?: string; review?: string; logs: Log[] }
export interface DemoState { version: 3; scenario: Scenario; clock: number; paused: boolean; pipeline: PipelineId | 'all'; alerts: Alert[]; works: WorkOrder[] }
export type Command = { kind: 'confirm' | 'dismiss'; alertId: string; note: string } | { kind: 'create'; alertId: string; owner: string; note: string } | { kind: 'start' | 'submit' | 'approve' | 'reject'; workId: string; note: string };
