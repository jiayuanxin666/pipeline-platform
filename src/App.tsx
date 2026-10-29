import { lazy, Suspense, useEffect, useState } from 'react';
import { Activity, AlertTriangle, Bell, Check, ChevronDown, ClipboardList, Clock3, Gauge, History, Menu, Pause, Play, RotateCcw, Waves, Home, ChevronRight, X, Sparkles } from 'lucide-react';
const Overview = lazy(() => import('./pages/Overview'));
const Monitor = lazy(() => import('./pages/Monitor'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Diagnostic = lazy(() => import('./pages/Diagnostic'));
const WorkOrders = lazy(() => import('./pages/WorkOrders'));
const HistoryPage = lazy(() => import('./pages/History'));
import Cover from './pages/Cover';
import { WorkspaceBackdrop } from './components/WorkspaceBackdrop';
import { Badge, Modal, Timeline } from './components/UI';
import { useStore } from './state/Store';
import { pipelines, fullTime } from './data/mockApi';
import type { Scenario } from './domain/types';
import { statistics } from './domain/business';

const routes = [
  { path: '/overview', title: '监测总览', icon: Gauge },
  { path: '/monitor', title: '实时监测', icon: Activity },
  { path: '/alerts', title: '告警中心', icon: Bell },
  { path: '/works', title: '处置工单', icon: ClipboardList },
  { path: '/history', title: '历史分析', icon: History },
];
function readPath() { return window.location.hash.slice(1) || '/'; }
export default function App() {
  const { state, setPipeline, togglePause, reset, toast, message, storageWarning } = useStore();
  const [url, setUrl] = useState(readPath), [helpOpen, setHelpOpen] = useState(false), [mobileNav, setMobileNav] = useState(false);
  const [backgroundMotion,setBackgroundMotion]=useState(()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
    try{return localStorage.getItem('pipeline-background-motion')!=='off';}catch{return true;}
  });
  useEffect(()=>{try{localStorage.setItem('pipeline-background-motion',backgroundMotion?'on':'off');}catch{/* Background preference remains available for this session. */}},[backgroundMotion]);
  useEffect(() => { const pop = () => { setUrl(readPath()); setMobileNav(false); }; window.addEventListener('hashchange', pop); return () => window.removeEventListener('hashchange', pop); }, []);
  useEffect(() => { if (!mobileNav) return; const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNav(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [mobileNav]);
  const go = (path: string) => { window.history.pushState({}, '', `#${path}`); setUrl(readPath()); setMobileNav(false); window.scrollTo(0, 0); };
  const changeScenario = (scenario: Scenario) => {
    const label = scenario === 'normal' ? '正常运行' : scenario === 'leak' ? '疑似泄漏' : '设备离线';
    if (scenario === state.scenario) return;
    if (window.confirm(`切换到“${label}”将清除当前演示操作与临时工单，并恢复该场景的初始事件。确认继续？`)) { reset(scenario); go('/overview'); }
  };
  const resetDemo = () => { if (window.confirm('重置演示将清除本地核查记录和临时工单，并恢复初始模拟数据。此操作不可撤销，是否继续？')) { reset(state.scenario); go('/overview'); } };
  const rootPath = url.split('?')[0], isDetail = rootPath.startsWith('/alerts/'), query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  let eventId = ''; try { if (isDetail) eventId = decodeURIComponent(rootPath.slice('/alerts/'.length)); } catch { /* Invalid URL uses missing-event screen. */ }
  const currentRoute = routes.find(r => rootPath === r.path || rootPath.startsWith(r.path + '/'));
  if (rootPath === '/') return <Cover onEnter={() => go('/overview')} />;
  const page = isDetail ? <Diagnostic key={eventId} id={eventId} go={go}/> : rootPath === '/monitor' ? <Monitor query={query} go={go}/> : rootPath === '/alerts' ? <Alerts query={query} go={go}/> : rootPath === '/works' ? <WorkOrders query={query} go={go}/> : rootPath === '/history' ? <HistoryPage go={go}/> : rootPath === '/overview' ? <Overview go={go}/> : <section className="empty"><strong>页面不存在</strong><button className="button primary" onClick={() => go('/overview')}>返回监测总览</button></section>;
  const totals = statistics(state), scenarioName = state.scenario === 'normal' ? '正常运行' : state.scenario === 'leak' ? '疑似泄漏' : '设备离线';
  return <div className="app-shell">
    <WorkspaceBackdrop paused={!backgroundMotion}/>
    <a className="skip-link" href="#workspace-content">跳转到主要内容</a><header className="topbar">
      <button className="mobile-menu icon-button" aria-label={mobileNav ? '关闭导航' : '打开导航'} aria-expanded={mobileNav} aria-controls="workspace-navigation" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X size={19}/> : <Menu size={19}/>}</button>
      <button className="brand brand-home" aria-label="返回平台封面" onClick={() => go('/')}><div className="brand-mark"><Waves size={20}/></div><div><strong>管脉</strong><span>油气管道泄漏检测智能平台</span></div></button>
      <div className="topbar-context"><label>当前管线<select aria-label="当前管线" value={state.pipeline} onChange={e => setPipeline(e.target.value as 'A' | 'B' | 'all')}><option value="all">全部管线</option>{pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><span className="top-clock"><Clock3 size={15}/>{fullTime(state.clock)}</span></div>
      <div className="topbar-actions"><Badge tone="blue">教学演示 · 模拟数据</Badge><span className="role-chip">值班员 <b>陈晨</b></span></div>
    </header>
    <button className={`nav-backdrop ${mobileNav ? 'show' : ''}`} aria-label="收起侧边导航" tabIndex={mobileNav ? 0 : -1} onClick={() => setMobileNav(false)}/><aside id="workspace-navigation" className={`sidebar ${mobileNav ? 'show' : ''}`}><div className="side-label">OPERATIONS / 工作台</div><nav aria-label="工作台导航">{routes.map(item => { const active = rootPath === item.path || rootPath.startsWith(`${item.path}/`); return <button key={item.path} aria-current={active ? 'page' : undefined} className={`nav-item ${active ? 'active' : ''}`} onClick={() => go(item.path)}><item.icon size={18}/><span>{item.title}</span>{item.path === '/alerts' && totals.pending > 0 && <b className="nav-count">{totals.pending}</b>}</button>; })}</nav><div className="sidebar-spacer"/><div className="demo-card"><div className="demo-card-title"><span className={state.paused ? 'paused-dot' : 'live-dot'}/>{state.paused ? '演示已暂停' : '演示场景'}</div><label>场景模式<select value={state.scenario} onChange={e => changeScenario(e.target.value as Scenario)}><option value="leak">疑似泄漏</option><option value="normal">正常运行</option><option value="offline">设备离线</option></select></label><div className="demo-control-row"><button className="demo-control" onClick={togglePause} aria-label={state.paused ? '继续模拟更新' : '暂停模拟更新'}>{state.paused ? <Play size={15}/> : <Pause size={15}/>} {state.paused ? '继续更新' : '暂停更新'}</button><button className="demo-control" onClick={resetDemo}><RotateCcw size={15}/>重置</button></div><button className="demo-help" onClick={() => setHelpOpen(true)}>查看演示流程 <span>→</span></button><small>模拟时钟：{fullTime(state.clock)}</small></div><button className="sidebar-home" onClick={() => go('/')}><Home size={14}/>返回平台封面</button><div className="sidebar-foot"><span className="secure-dot"/> 本地演示环境 <small>v1.0 · SIM</small></div></aside>
    <main id="workspace-content" tabIndex={-1} className="main-content"><div className="workspace-context"><div><button onClick={() => go('/overview')}>工作台</button><ChevronRight size={12}/><span>{currentRoute?.title || '未知页面'}</span></div><div className="workspace-context-controls"><button className="workspace-motion-control" aria-label={backgroundMotion?'暂停背景动画':'开启背景动画'} title={backgroundMotion?'暂停背景动画':'开启背景动画'} aria-pressed={backgroundMotion} onClick={()=>setBackgroundMotion(value=>!value)}><Sparkles size={12}/><span>动态背景{backgroundMotion?'已开启':'已暂停'}</span></button><span className="workspace-live"><i className={state.paused ? 'paused-dot' : 'secure-dot'}/>{scenarioName} · {state.paused ? '已暂停' : '模拟更新中'}</span></div></div><Suspense fallback={<div className="page-loading" role="status"><Activity size={24}/><strong>正在加载工作台</strong><p>准备管线数据与监测视图…</p></div>}>{page}</Suspense><footer className="app-footer"><span>管脉 · 教学演示 · 模拟数据</span><span>所有数据均为固定种子模拟数据，不代表真实管线运行状况</span></footer></main>
    {message && <div role="status" className="toast"><Check size={16}/>{message}</div>}{storageWarning && <div role="alert" className="storage-warning"><AlertTriangle size={16}/>浏览器本地存储不可用，本次操作不会在刷新后保留。</div>}
    {helpOpen && <Modal title="主演示流程" onClose={() => setHelpOpen(false)}><div className="modal-body"><p>沿着告警核查和工单闭环展示平台的主要业务：</p><ol className="demo-steps"><li>监测总览查看疑似异常管段与设备状态</li><li>打开告警详情，查看定位区间、规则和压力／流量证据</li><li>填写人工核查说明并确认异常</li><li>创建工单、指派负责人并开始处理</li><li>提交现场结果，由复核员通过后关闭工单</li><li>返回总览查看告警、工单和设备统计同步变化</li></ol><div className="info-banner">当前场景：{scenarioName} · 可随时暂停模拟时钟。刷新后操作记录保存在此浏览器。</div><button className="button primary full" onClick={() => setHelpOpen(false)}>开始演示</button></div></Modal>}
  </div>;
}
