type Vec=[number,number,number];
const add=(a:Vec,b:Vec):Vec=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:Vec,b:Vec):Vec=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const scale=(a:Vec,s:number):Vec=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a:Vec,b:Vec)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec,b:Vec):Vec=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=(a:Vec)=>scale(a,1/(Math.hypot(...a)||1));
const mix=(a:Vec,b:Vec,t:number)=>add(scale(a,1-t),scale(b,t));
const metal:Vec=[.3,.45,.5],rim:Vec=[.44,.63,.65],dark:Vec=[.08,.17,.22];

class Geometry {
 values:number[]=[];
 vertex(p:Vec,n:Vec,c:Vec,glow=0){this.values.push(...p,...n,...c,glow);}
 triangle(a:Vec,b:Vec,c:Vec,na:Vec,nb:Vec,nc:Vec,color:Vec,glow=0){this.vertex(a,na,color,glow);this.vertex(b,nb,color,glow);this.vertex(c,nc,color,glow);}
 tube(points:Vec[],radius:number,color:Vec,segments=24,cutaway=false,glow=0){
  const rings=points.map((p,i)=>{
   const axis=norm(sub(points[Math.min(i+1,points.length-1)],points[Math.max(i-1,0)]));
   const u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=norm(cross(u,axis));
   return Array.from({length:segments+1},(_,j)=>{const angle=j/segments*Math.PI*2,n=add(scale(u,Math.sin(angle)),scale(v,Math.cos(angle)));return {p:add(p,scale(n,radius)),n};});
  });
  for(let i=0;i<points.length-1;i++)for(let j=0;j<segments;j++){
   // An exposed inspection section reveals the flowing core without making the steel transparent.
   if(cutaway&&points[i][0]>-4&&points[i][0]<4&&Math.abs(points[i][2]-1)<.5&&Math.cos((j+.5)/segments*Math.PI*2)>.3)continue;
   const a=rings[i][j],b=rings[i+1][j],c=rings[i+1][j+1],d=rings[i][j+1];
   this.triangle(a.p,b.p,c.p,a.n,b.n,c.n,color,glow);this.triangle(a.p,c.p,d.p,a.n,c.n,d.n,color,glow);
  }
 }
 ring(center:Vec,axis:Vec,radius:number,thickness:number,color:Vec,glow=0){
  const u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=norm(cross(axis,u));
  const points=Array.from({length:33},(_,i)=>add(center,add(scale(u,Math.cos(i/32*Math.PI*2)*radius),scale(v,Math.sin(i/32*Math.PI*2)*radius))));
  this.tube(points,thickness,color,8,false,glow);
 }
 bolt(center:Vec,radius:number,color:Vec){
  const axes:Vec[]=[[radius,0,0],[-radius,0,0],[0,radius,0],[0,-radius,0],[0,0,radius],[0,0,-radius]];
  for(const [a,b,c] of [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]]){
   const pa=add(center,axes[a]),pb=add(center,axes[b]),pc=add(center,axes[c]),n=norm(cross(sub(pb,pa),sub(pc,pa)));
   this.triangle(pa,pb,pc,n,n,n,color);
  }
 }
}

function roundedRoute(corners:Vec[]) {
 const points:Vec[]=[corners[0]];
 for(let i=1;i<corners.length-1;i++){
  const corner=corners[i],a=add(corner,scale(norm(sub(corners[i-1],corner)),2.4)),b=add(corner,scale(norm(sub(corners[i+1],corner)),2.4));
  const start=points.at(-1)!;
  for(let j=1;j<=10;j++)points.push(mix(start,a,j/10));
  for(let j=1;j<=12;j++){const t=j/12;points.push(add(add(scale(a,(1-t)*(1-t)),scale(corner,2*t*(1-t))),scale(b,t*t)));}
 }
 const last=points.at(-1)!;
 for(let i=1;i<=12;i++)points.push(mix(last,corners.at(-1)!,i/12));
 return points;
}

function viewProjection(eye:Vec,target:Vec,aspect:number){
 const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);
 const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
 const f=1/Math.tan(.36),near=.1,far=180;
 const projection=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
 const result=new Float32Array(16);
 for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)result[col*4+row]+=projection[k*4+row]*view[col*4+k];
 // Compose the installation toward the visible page header and right margin.
 for(let col=0;col<4;col++){result[col*4]+=.3*result[col*4+3];result[col*4+1]+=.58*result[col*4+3];}
 return result;
}

const vertexShader=`
 precision mediump float;
 attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor; attribute float aGlow;
 uniform mat4 uMatrix; uniform vec3 uEye; uniform float uPixelRatio;
 varying vec3 vPosition; varying vec3 vNormal; varying vec3 vColor; varying float vGlow;
 void main(){vPosition=aPosition;vNormal=aNormal;vColor=aColor;vGlow=aGlow;
 gl_Position=uMatrix*vec4(aPosition,1.0);gl_PointSize=clamp(480.0*uPixelRatio/(length(uEye-aPosition)+1.0),4.0,18.0);}`;
const fragmentShader=`
 precision mediump float;
 uniform vec3 uEye;uniform float uTime;uniform float uParticle;
 varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;varying float vGlow;
 void main(){
 if(uParticle>0.5){float r=length(gl_PointCoord-vec2(.5))*2.0;if(r>1.0)discard;
 gl_FragColor=vec4(vColor*(1.1+pow(1.0-r,3.0)*2.0),pow(1.0-r,2.0)*.85);return;}
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 vec3 view=normalize(uEye-vPosition),light=normalize(vec3(-.4,.9,.6));
 float diffuse=max(dot(n,light),0.0),specular=pow(max(dot(reflect(-light,n),view),0.0),34.0);
 float fresnel=pow(1.0-max(dot(n,view),0.0),3.0);
 vec3 color=vColor*(.24+diffuse*.86)+vec3(.44,.73,.79)*specular*.8+vec3(.025,.12,.15)*fresnel;
 float sweep=pow(max(0.0,1.0-abs(vPosition.x-mod(uTime*3.2+20.0,45.0)+22.5)/1.6),3.0);
 color+=vec3(.04,.3,.28)*sweep*.6+vColor*vGlow;
 float fog=clamp((length(uEye-vPosition)-22.0)/95.0,0.0,.7);
 gl_FragColor=vec4(mix(color,vec3(.018,.044,.063),fog),1.0);}`;

export function createPipelineScene(canvas:HTMLCanvasElement){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false});
 if(!gl)throw new Error('WebGL is unavailable');
 const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(message||'Unable to compile background');}return shader;};
 const vs=compile(gl.VERTEX_SHADER,vertexShader),fs=compile(gl.FRAGMENT_SHADER,fragmentShader),program=gl.createProgram()!;
 gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Unable to link background');
 gl.useProgram(program);
 const matrixLocation=gl.getUniformLocation(program,'uMatrix'),eyeLocation=gl.getUniformLocation(program,'uEye'),timeLocation=gl.getUniformLocation(program,'uTime'),particleLocation=gl.getUniformLocation(program,'uParticle');
 const ratioLocation=gl.getUniformLocation(program,'uPixelRatio');
 const attributes=['aPosition','aNormal','aColor','aGlow'].map(name=>gl.getAttribLocation(program,name));
 const bind=(buffer:WebGLBuffer)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);[3,3,3,1].forEach((size,i)=>{gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],size,gl.FLOAT,false,40,[0,12,24,36][i]);});};
 const upload=(values:number[])=>{const buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);return {buffer,count:values.length/10};};

 const route=roundedRoute([[-25,0,-9],[-7,0,-9],[-7,0,1],[6,0,1],[6,0,12],[25,0,12]]);
 const geometry=new Geometry();
 geometry.tube(route,1.06,metal,28,true);
 geometry.tube(route,.92,dark,24,true);
 geometry.tube(route,.15,[.035,.4,.38],12,false,1.2);
 const branch=roundedRoute([[-24,-.35,9],[-13,-.35,9],[-13,-.35,17],[28,-.35,17]]);
 geometry.tube(branch,.48,[.12,.24,.31],18);
 const flanges:[Vec,Vec][]=[[[-17,0,-9],[1,0,0]],[[-7,0,-4],[0,0,1]],[[3,0,1],[1,0,0]],[[6,0,8],[0,0,1]],[[16,0,12],[1,0,0]],[[24.9,0,12],[1,0,0]]];
 for(const [center,axis] of flanges){
  geometry.ring(center,axis,1.15,.16,rim);
  geometry.ring(add(center,scale(axis,.28)),axis,1.15,.16,[.2,.35,.4]);
  const u=norm(cross(axis,[0,1,0])),v:Vec=[0,1,0];
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;geometry.bolt(add(center,add(scale(u,Math.sin(a)*1.27),scale(v,Math.cos(a)*1.27))),.11,[.48,.63,.65]);}
 }
 // Gate valve, hand wheel, stem, and braces form recognizable industrial equipment.
 geometry.tube([[6,.6,7],[6,2.2,7]],.62,[.16,.38,.41],20);
 geometry.tube([[6,2.1,7],[6,4.2,7]],.13,rim,12);
 geometry.ring([6,4.2,7],[0,1,0],1.35,.12,[.28,.54,.54]);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;geometry.tube([[6,4.2,7],[6+Math.cos(a)*1.35,4.2,7+Math.sin(a)*1.35]],.06,rim,8);}
 geometry.ring([6,1.6,7],[0,1,0],.71,.14,rim);
 for(const x of [-17,-4,8,18]){
  const z=x<0?-9:12;
  geometry.tube([[x,-1.25,z],[x,-2.8,z]],.24,[.06,.15,.2],8);
 }
 const mesh=upload(geometry.values);
 const grid=new Geometry();
 for(let i=-50;i<=50;i+=2){grid.vertex([i,-2.9,-50],[0,1,0],[.025,.075,.1]);grid.vertex([i,-2.9,50],[0,1,0],[.025,.075,.1]);grid.vertex([-50,-2.9,i],[0,1,0],[.025,.075,.1]);grid.vertex([50,-2.9,i],[0,1,0],[.025,.075,.1]);}
 const floor=upload(grid.values);
 const accents=new Geometry();
 for(const [center,axis] of flanges)accents.ring(add(center,scale(axis,-.2)),axis,1.08,.028,[.04,.6,.55],1.7);
 const lights=upload(accents.values);
 const particleBuffer=gl.createBuffer()!,particles=new Float32Array(80*10);
 const lengths=[0];for(let i=1;i<route.length;i++)lengths.push(lengths.at(-1)!+Math.hypot(...sub(route[i],route[i-1])));
 const total=lengths.at(-1)!;
 const positionAt=(distance:number)=>{let i=1;while(i<lengths.length-1&&lengths[i]<distance)i++;return mix(route[i-1],route[i],(distance-lengths[i-1])/(lengths[i]-lengths[i-1]));};
 let paused=false,disposed=false,frame:number|undefined,lastDraw=-100,elapsed=0,lastTime=performance.now(),pointerX=0,pointerY=0,currentX=0,currentY=0;
 const draw=()=>{
  if(disposed||gl.isContextLost())return;
  const width=canvas.clientWidth,height=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,1.25,1600/Math.max(width,1));
  const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);gl.clearColor(.018,.044,.063,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  currentX+=(pointerX-currentX)*.06;currentY+=(pointerY-currentY)*.06;
  const mobile=width<720;
  const eye:Vec=[26+Math.sin(elapsed*.11)*.65+currentX*.7,25+currentY*.5,34+Math.cos(elapsed*.09)*.5];
  gl.uniformMatrix4fv(matrixLocation,false,viewProjection(eye,mobile?[2,-1,2]:[0,-1,2],mobile?Math.max(.75,w/h):w/h));
  gl.uniform3fv(eyeLocation,eye);gl.uniform1f(timeLocation,elapsed);gl.uniform1f(ratioLocation,ratio);gl.uniform1f(particleLocation,0);
  bind(floor.buffer);gl.drawArrays(gl.LINES,0,floor.count);
  bind(mesh.buffer);gl.drawArrays(gl.TRIANGLES,0,mesh.count);
  bind(lights.buffer);gl.drawArrays(gl.TRIANGLES,0,lights.count);
  for(let i=0;i<80;i++){
   const d=(elapsed*4.2+i*total/80)%total,p=positionAt(d),angle=d*.8+elapsed*.8;
   p[1]+=Math.cos(angle)*1.12;p[0]+=Math.sin(angle)*.7;
   particles.set([...p,0,1,0,.24,.88,.84,1],i*10);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);gl.bufferData(gl.ARRAY_BUFFER,particles,gl.DYNAMIC_DRAW);bind(particleBuffer);
  gl.uniform1f(particleLocation,1);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,80);gl.depthMask(true);gl.disable(gl.BLEND);
 };
 const loop=(now:number)=>{
  frame=undefined;if(disposed||paused||document.hidden)return;
  elapsed+=Math.min((now-lastTime)/1000,.1);lastTime=now;
  if(now-lastDraw>=32){lastDraw=now;draw();}
  frame=requestAnimationFrame(loop);
 };
 const start=()=>{if(!paused&&!disposed&&!document.hidden&&frame===undefined){lastTime=performance.now();frame=requestAnimationFrame(loop);}};
 const onPointer=(event:PointerEvent)=>{pointerX=event.clientX/innerWidth*2-1;pointerY=event.clientY/innerHeight*2-1;};
 const onVisibility=()=>{if(document.hidden){if(frame!==undefined)cancelAnimationFrame(frame);frame=undefined;}else start();};
 const resize=new ResizeObserver(draw);resize.observe(canvas);
 window.addEventListener('pointermove',onPointer,{passive:true});document.addEventListener('visibilitychange',onVisibility);
 draw();start();
 return {
  setPaused(value:boolean){paused=value;if(value&&frame!==undefined){cancelAnimationFrame(frame);frame=undefined;draw();}else start();},
  dispose(){disposed=true;if(frame!==undefined)cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('pointermove',onPointer);document.removeEventListener('visibilitychange',onVisibility);for(const buffer of [mesh.buffer,floor.buffer,lights.buffer,particleBuffer])gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);},
 };
}
