import type { KeyboardEvent } from 'react';
import { isOnline, kmLabel, sensors } from '../data/mockApi';
import type { DemoState, PipelineId, Sensor } from '../domain/types';

export function Topology({ state, pipeline, onSensor, onSegment }: {
  state: DemoState;
  pipeline: PipelineId;
  onSensor: (sensor: Sensor) => void;
  onSegment: (id: string) => void;
}) {
  const active = state.alerts.filter(alert => alert.pipeline === pipeline && alert.status !== '已关闭');
  const leak = active.find(alert => alert.type === '疑似泄漏');
  const x = (km: number) => 65 + km / 30 * 800;
  const activate = (callback: () => void) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  };

  return <div className="topology">
    <div className="topology-header">
      <span className="topology-name">示例管线 {pipeline}<span>天然气 · 全长 30 km</span></span>
      <span className="topology-caption">拓扑示意，非地理地图</span>
    </div>
    <svg viewBox="0 0 930 270" aria-label={`示例管线 ${pipeline} 拓扑示意`} role="img">
      <defs>
        <pattern id={`grid-${pipeline}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#1c3541" strokeWidth=".7"/>
        </pattern>
        <linearGradient id={`pipe-glow-${pipeline}`} x1="0" x2="1">
          <stop offset="0" stopColor="#34d5ba" stopOpacity=".1"/>
          <stop offset=".5" stopColor="#34d5ba" stopOpacity=".32"/>
          <stop offset="1" stopColor="#34d5ba" stopOpacity=".08"/>
        </linearGradient>
      </defs>
      <rect width="930" height="270" fill="#0c1d27"/>
      <rect width="930" height="270" fill={`url(#grid-${pipeline})`}/>
      <path d="M65 144H865" stroke={`url(#pipe-glow-${pipeline})`} strokeWidth="28" strokeLinecap="round"/>
      <path d="M65 144H865" stroke="#263d49" strokeWidth="16" strokeLinecap="round"/>
      {[0, 10, 20].map(start => {
        const id = `${pipeline}-0${start / 10 + 1}`;
        const alert = active.find(item => item.segment === id && item.type !== '通信中断');
        const color = alert?.priority === '高' ? '#ff7461' : alert ? '#f5b451' : '#34d5ba';
        return <g key={id} role="button" tabIndex={0} aria-label={`${id} 管段，${alert ? '异常' : '正常'}，点击查看`}
          onClick={() => onSegment(id)} onKeyDown={activate(() => onSegment(id))} className="svg-button">
          <path d={`M${x(start) + 8} 144H${x(start + 10) - 8}`} stroke={color} strokeWidth="7" strokeLinecap="round"/>
          <path d={`M${x(start) + 8} 144H${x(start + 10) - 8}`} className="pipe-flow"/>
          <rect x={x(start) + 55} y="187" width="154" height="39" rx="7" fill="#122a36" stroke="#294451"/>
          <text x={x(start) + 132} y="203" textAnchor="middle" fontSize="12" fill="#d9e9ee">{id} 管段</text>
          <text x={x(start) + 132} y="218" textAnchor="middle" fontSize="10" fill="#91a9b5">{kmLabel(start)} — {kmLabel(start + 10)}</text>
        </g>;
      })}
      {leak && <g className="leak-callout">
        <circle className="leak-pulse" cx={x(12.4)} cy="144" r="17"/>
        <rect x={x(12.2) - 7} y="128" width="26" height="32" rx="5" fill="#3c2528" stroke="#ff7461" strokeDasharray="3 2"/>
        <path d={`M${x(12.4) + 6} 127V92H${x(12.4) + 58}`} fill="none" stroke="#ff7461"/>
        <rect x={x(12.4) + 48} y="57" width="205" height="49" rx="8" fill="#211f26" stroke="#8d4945"/>
        <circle cx={x(12.4) + 63} cy="73" r="3.5" fill="#ff7461"/>
        <text x={x(12.4) + 74} y="78" fontSize="12" fill="#ff998b">疑似泄漏区间</text>
        <text x={x(12.4) + 63} y="95" fontSize="11" fill="#b6a8aa">K12+200～K12+600</text>
      </g>}
      {sensors.filter(sensor => sensor.pipeline === pipeline).map(sensor => {
        const online = isOnline(state, sensor.id);
        return <g key={sensor.id} role="button" tabIndex={0} aria-label={`${sensor.name}，${online ? '在线' : '离线'}，查看设备`}
          onClick={() => onSensor(sensor)} onKeyDown={activate(() => onSensor(sensor))} className={`svg-button ${online ? 'sensor-live' : 'sensor-down'}`}>
          {online && <circle className="sensor-pulse" cx={x(sensor.km)} cy="144" r="15"/>}
          <circle cx={x(sensor.km)} cy="144" r="11" fill="#0c1d27" stroke={online ? '#55e2cb' : '#81909b'} strokeWidth="2"/>
          <circle cx={x(sensor.km)} cy="144" r="4" fill={online ? '#55e2cb' : '#81909b'}/>
          <text x={x(sensor.km)} y={sensor.km === 0 || sensor.km === 30 ? 104 : 111} textAnchor="middle" fontSize="12" fill="#d8e8ed">
            {sensor.km === 0 ? '起点站场' : sensor.km === 30 ? '终点站场' : `${sensor.km} km`}
          </text>
          <text x={x(sensor.km)} y="176" textAnchor="middle" fontSize="10" fill={online ? '#85bcb2' : '#b7a6a2'}>
            {online ? sensor.id : '离线 · 数据不可用'}
          </text>
        </g>;
      })}
    </svg>
    <div className="topology-bottom">
      <div className="legend"><span><i className="green"/>正常管段</span><span><i className="orange"/>预警管段</span><span><i className="red"/>异常管段</span><span><i className="gray"/>离线监测点</span></div>
      <span>点击管段或监测点查看详情</span>
    </div>
  </div>;
}
