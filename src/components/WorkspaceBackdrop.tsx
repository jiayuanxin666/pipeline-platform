import { memo, useEffect, useRef, useState } from 'react';
import { createPipelineScene } from './pipelineScene';

/** A real 3D installation, rendered independently of telemetry and capped at 30 fps. */
export const WorkspaceBackdrop=memo(function WorkspaceBackdrop({paused}:{paused:boolean}) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const scene=useRef<ReturnType<typeof createPipelineScene>|null>(null);
 const [available,setAvailable]=useState(true);
 useEffect(()=>{
  if(!canvas.current)return;
  try{scene.current=createPipelineScene(canvas.current);scene.current.setPaused(paused);delete canvas.current.dataset.sceneError;setAvailable(true);}
  catch(error){canvas.current.dataset.sceneError=String(error);setAvailable(false);}
  return()=>{scene.current?.dispose();scene.current=null;};
 },[]);
 useEffect(()=>{scene.current?.setPaused(paused);},[paused]);
 return <div className={`workspace-backdrop workspace-industrial ${paused?'is-static':''} ${available?'':'scene-unavailable'}`} aria-hidden="true">
  <div className="workspace-atmosphere"/>
  <canvas ref={canvas} className="workspace-scene"/>
  <div className="workspace-scene-shade"/>
  <div className="workspace-edge-light"/>
 </div>;
});
