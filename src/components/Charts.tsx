import { memo, useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart as BarSeries } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkAreaComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([LineChart, BarSeries, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkAreaComponent, MarkLineComponent, CanvasRenderer]);
import type { EChartsOption } from 'echarts';
import type { LineSeriesOption } from 'echarts/charts';
import { timeLabel } from '../data/mockApi';
import type { Sample } from '../domain/types';
 const font='"Inter", "Noto Sans SC", "PingFang SC", sans-serif';
export function Chart({option,height=260,label,live=false}:{option:EChartsOption;height?:number;label:string;live?:boolean}) {
 const ref=useRef<HTMLDivElement>(null),instance=useRef<ReturnType<typeof echarts.init>|null>(null);
 useEffect(()=>{if(!ref.current)return;instance.current=echarts.init(ref.current);const resize=new ResizeObserver(()=>instance.current?.resize());resize.observe(ref.current);return()=>{resize.disconnect();instance.current?.dispose();};},[]);
 useEffect(()=>{instance.current?.setOption({...option,animation:!live&&!matchMedia('(prefers-reduced-motion: reduce)').matches,animationDuration:live?0:620,animationDurationUpdate:live?0:460,animationEasing:'cubicOut',textStyle:{fontFamily:font,color:'#a1b5bf',fontSize:11},tooltip:{...option.tooltip,backgroundColor:'rgba(5,16,23,.96)',borderColor:'#31505d',borderWidth:1,textStyle:{fontFamily:font,color:'#e9f5f6',fontSize:12},extraCssText:'box-shadow:0 12px 35px rgba(0,0,0,.35);border-radius:10px;'}},{notMerge:false,replaceMerge:['series'],lazyUpdate:!live});},[option,live]);
 return <div ref={ref} className="chart" style={{height}} role="img" aria-label={label}/>;
}
export function TrendChart({samples,metric,window,zoom=true,height=230,second,live=false}:{samples:Sample[];metric:'pressure'|'flow';window?:[number,number];zoom?:boolean;height?:number;live?:boolean;second?:{samples:Sample[];label:string}}) {
 const unit=metric==='pressure'?'MPa':'Nm³/h',color=metric==='pressure'?'#50c8ff':'#44e0bd';
 const series=(data:Sample[],name:string,lineColor:string)=>({id:`${metric}-${name}`,name,type:'line' as const,showSymbol:false,connectNulls:false,smooth:live?false:0.18,lineStyle:{width:2.5,color:lineColor,shadowColor:`${lineColor}66`,shadowBlur:10},itemStyle:{color:lineColor},areaStyle:second?undefined:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:metric==='pressure'?'rgba(80,200,255,.25)':'rgba(68,224,189,.2)'},{offset:1,color:'rgba(5,17,24,0)'}])},data:data.map(s=>[s.time,s[metric]])});
 const primary:LineSeriesOption={...series(samples,second?'下游监测点':'测量值',color),markArea:window?{silent:true,itemStyle:{color:'rgba(255,116,97,.12)'},label:{show:false},data:[[{xAxis:window[0]},{xAxis:window[1]}]]}:undefined,markLine:window?{symbol:['none','none'],silent:true,label:{formatter:'异常发生',color:'#ff9b84',fontSize:10,position:'insideEndTop'},lineStyle:{color:'#ff7461',type:'dashed' as const},data:[{xAxis:window[0]}]}:undefined};
 const tail=samples[samples.length-1];
 const head:LineSeriesOption|undefined=live&&tail&&tail[metric]!==null?{id:`${metric}-live-head`,name:'最新采样',type:'line' as const,data:[[tail.time,tail[metric]]],symbol:'circle',symbolSize:8,itemStyle:{color,borderColor:'#e4fffa',borderWidth:1.5,shadowColor:color,shadowBlur:15},silent:true,tooltip:{show:false},z:5}:undefined;
 const options:EChartsOption={tooltip:{trigger:'axis',valueFormatter:v=>v==null?'数据不可用':`${Number(v).toLocaleString('zh-CN')} ${unit}`},legend:second?{top:0,right:0,icon:'roundRect',itemWidth:13,itemHeight:3,textStyle:{color:'#9db3be',fontFamily:font}}:undefined,grid:{left:metric==='flow'?78:55,right:23,top:second?38:30,bottom:zoom?53:30},xAxis:{type:'time',min:live?samples[0]?.time:undefined,max:live?samples[samples.length-1]?.time:undefined,axisLabel:{formatter:v=>timeLabel(Number(v),live&&samples.length>0&&samples[samples.length-1].time-samples[0].time<=5*60000),hideOverlap:true,color:'#8ca3ae'},axisLine:{lineStyle:{color:'#29434f'}},splitLine:{show:false}},yAxis:{type:'value',name:unit,nameLocation:'end',nameTextStyle:{align:'right',padding:[0,0,0,12],color:'#8ca3ae'},scale:true,splitNumber:3,axisLabel:{formatter:v=>Number(v).toLocaleString('zh-CN'),color:'#8ca3ae'},splitLine:{lineStyle:{color:'#203945',type:'dashed'}}},dataZoom:zoom?[{type:'inside'},{type:'slider',height:13,bottom:7,showDetail:false,borderColor:'#1d3540',fillerColor:'rgba(80,200,255,.18)',handleSize:'80%',backgroundColor:'#0b1b24'}]:undefined,series:second?[primary,series(second.samples,second.label,'#9aacc0')]:head?[primary,head]:[primary]};
 return <Chart option={options} live={live} height={height} label={`${metric==='pressure'?'压力':'标准状态体积流量'}趋势曲线，单位 ${unit}，横轴为模拟时间`}/>;
}
type BarChartProps={labels:string[];values:number[];label:string;color?:string;height?:number};
const sameItems=<T,>(a:T[],b:T[])=>a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));

// History receives telemetry context ticks, but identical statistics must not restart ECharts.
export const BarChart=memo(function BarChart({labels,values,label,color='#44d9b8',height=245}:BarChartProps) {
 return <Chart label={label} height={height} option={{
  grid:{left:40,right:20,top:26,bottom:40},tooltip:{trigger:'axis'},
  xAxis:{type:'category',data:labels,axisLine:{lineStyle:{color:'#29434f'}},axisTick:{show:false},axisLabel:{interval:'auto',hideOverlap:true,color:'#8ca3ae'}},
  yAxis:{type:'value',minInterval:1,name:'条',nameTextStyle:{color:'#8ca3ae'},axisLabel:{color:'#8ca3ae'},splitLine:{lineStyle:{type:'dashed',color:'#203945'}}},
  series:[{id:'historical-counts',type:'bar',data:values,barMaxWidth:28,itemStyle:{color,borderRadius:[5,5,0,0],shadowColor:`${color}55`,shadowBlur:10}}],
 }}/>;
},(previous,next)=>previous.label===next.label&&previous.color===next.color&&previous.height===next.height&&sameItems(previous.labels,next.labels)&&sameItems(previous.values,next.values));
