import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { initialState } from '../data/mockApi';
import { startTelemetryScheduler, type TelemetryFrame } from '../domain/telemetryScheduler';
import { decodeState, execute, STORAGE_KEY } from '../domain/business';
import type { Command, DemoState, PipelineId, Scenario } from '../domain/types';
interface Store { state:DemoState; telemetry:TelemetryFrame|null; act:(command:Command)=>boolean; setPipeline:(id:PipelineId|'all')=>void; togglePause:()=>void; reset:(scenario:Scenario)=>void; toast:(message:string)=>void; message:string; storageWarning:boolean }
const Context=createContext<Store|null>(null);
export function StoreProvider({children}:{children:ReactNode}) {
 const [state,setState]=useState(()=>{try{return decodeState(localStorage.getItem(STORAGE_KEY));}catch{return initialState();}});
 const latest=useRef(state);latest.current=state;
 const [clockEpoch,setClockEpoch]=useState(0);
 const [telemetry,setTelemetry]=useState<TelemetryFrame|null>(null);
 const [message,setMessage]=useState(''),[storageWarning,setStorageWarning]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const toast=(text:string)=>{setMessage(text);clearTimeout(timer.current);timer.current=setTimeout(()=>setMessage(''),4000);};
 const persist=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(latest.current));}catch{setStorageWarning(true);}};
 // Save business edits immediately; keep synchronous storage writes out of the sampling hot path.
 useEffect(persist,[state.alerts,state.works,state.pipeline,state.paused,state.scenario]);
 useEffect(()=>{const id=setInterval(persist,5000);window.addEventListener('pagehide',persist);return()=>{clearInterval(id);window.removeEventListener('pagehide',persist);persist();};},[]);
 useEffect(()=>{
  if(state.paused)return;
  return startTelemetryScheduler(latest.current.clock,packet=>{setTelemetry(packet);setState(s=>s.paused?s:{...s,clock:packet.clock});});
 },[state.paused,state.scenario,clockEpoch]);
 const act=(command:Command)=>{try{const next=execute(latest.current,command);latest.current=next;setState(next);toast('操作已保存，关联状态已同步');return true;}catch(err){toast((err as Error).message);return false;}};
 const reset=(scenario:Scenario)=>{setState(initialState(scenario));setClockEpoch(value=>value+1);setTelemetry(null);toast('演示场景已重置，历史样例保留');};
 return <Context.Provider value={{state,telemetry,act,reset,setPipeline:id=>setState(s=>({...s,pipeline:id})),togglePause:()=>setState(s=>({...s,paused:!s.paused})),toast,message,storageWarning}}>{children}</Context.Provider>;
}
export function useStore(){const store=useContext(Context);if(!store)throw new Error('Store missing');return store;}
