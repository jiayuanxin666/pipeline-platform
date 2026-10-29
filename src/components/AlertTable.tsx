import { useEffect, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { fullTime } from '../data/mockApi';
import { Badge, Empty } from './UI';
import type { Alert } from '../domain/types';
export function AlertTable({alerts,onOpen,filtered=false}:{alerts:Alert[];onOpen:(id:string)=>void;filtered?:boolean}) {
 const [page,setPage]=useState(1),[sort,setSort]=useState<'time'|'priority'>('priority'),[descending,setDescending]=useState(true);const size=6;
 const fingerprint=alerts.map(a=>a.id).join(',');useEffect(()=>setPage(1),[fingerprint]);
 const priority={高:3,中:2,低:1};const sorted=[...alerts].sort((a,b)=>(descending?-1:1)*(sort==='time'?a.at-b.at:priority[a.priority]-priority[b.priority]||a.at-b.at));
 const pages=Math.max(1,Math.ceil(alerts.length/size));
 const toggle=(key:'time'|'priority')=>{setSort(key);setDescending(sort===key?!descending:true);setPage(1);};
 return <><div className="table-wrap"><table><thead><tr><th>告警编号 / 类型</th><th aria-sort={sort==='priority'?(descending?'descending':'ascending'):'none'}><button className="sort-button" onClick={()=>toggle('priority')}>优先级 <ArrowUpDown size={12}/></button></th><th>管线 / 位置</th><th aria-sort={sort==='time'?(descending?'descending':'ascending'):'none'}><button className="sort-button" onClick={()=>toggle('time')}>发现时间 <ArrowUpDown size={12}/></button></th><th>当前状态</th><th>负责人</th><th>操作</th></tr></thead><tbody>{sorted.slice((page-1)*size,page*size).map(a=><tr key={a.id}><td><strong className="cell-id">{a.id}</strong><small>{a.type}</small></td><td><Badge>{a.priority}</Badge></td><td><strong>示例管线 {a.pipeline} · {a.segment}</strong><small>{a.location}</small></td><td className="mono">{fullTime(a.at)}</td><td><Badge>{a.status}</Badge>{a.resolution&&<small>{a.resolution}</small>}</td><td>{a.owner}</td><td><button className="text-button" onClick={()=>onOpen(a.id)}>查看详情 <ChevronRight size={13}/></button></td></tr>)}</tbody></table></div>{!alerts.length&&<Empty title={filtered?'筛选条件下没有结果':'没有告警'} description={filtered?'调整关键词或筛选条件后重试。':'当前场景尚未产生告警。'}/>}<div className="pagination"><span>共 {alerts.length} 条记录 · 每页 {size} 条</span><div><button aria-label="上一页" className="icon-button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button><span>{page} / {pages}</span><button aria-label="下一页" className="icon-button" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button></div></div></>;
}
