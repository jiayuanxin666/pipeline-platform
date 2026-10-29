import { useState } from 'react';
import { ArrowDown, ArrowRight, Activity, ClipboardCheck, Radio, ShieldCheck, Waves } from 'lucide-react';

const workflowSteps = [
  {
    number: '01', title: '监测发现', short: '运行数据汇聚', icon: Radio, label: '系统自动识别',
    headline: '从管段和监测点发现异常信号',
    description: '管段拓扑汇集压力、标准状态体积流量与设备在线状态；模拟规则触发后，事件进入待核查队列。',
    evidence: '运行拓扑、实时曲线、设备状态',
    action: '识别异常并标出疑似位置',
    result: '生成带编号和优先级的待核查告警',
  },
  {
    number: '02', title: '告警研判', short: '证据辅助核查', icon: Activity, label: '值班员确认',
    headline: '把定位结果和诊断证据放在一起',
    description: '值班员查看触发规则、上下游压力与流量曲线、设备心跳，再填写核查说明，确认异常或说明误报原因。',
    evidence: '疑似区间、规则证据、上下游曲线',
    action: '人工确认异常或判定误报',
    result: '留下可追溯的核查结论与时间线',
  },
  {
    number: '03', title: '工单处置', short: '现场任务执行', icon: ClipboardCheck, label: '负责人处理',
    headline: '确认后的异常进入现场处置',
    description: '值班员创建关联工单并指派负责人；负责人领取任务，记录检查过程、处理措施和现场结果。',
    evidence: '关联告警、任务描述、处理记录',
    action: '派单、开始处理、提交现场结果',
    result: '工单进入待复核状态',
  },
  {
    number: '04', title: '复核归档', short: '告警工单同步', icon: ShieldCheck, label: '复核员把关',
    headline: '复核通过，闭环才算完成',
    description: '复核员检查现场处理说明；通过后工单与关联告警同步关闭，未通过则退回继续处理。',
    evidence: '现场结果、复核说明、操作时间线',
    action: '复核通过或退回补充处理',
    result: '形成完整、可回看的事件处置记录',
  },
];

export default function Cover({ onEnter }: { onEnter: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = workflowSteps[activeStep];
  const CurrentIcon = currentStep.icon;
  return <div className="cover-page">
    <div className="cover-grid" aria-hidden="true" />
    <header className="cover-nav">
      <a className="cover-brand" href="#top" aria-label="管脉首页">
        <span className="cover-brand-mark"><Waves size={21}/></span>
        <span><strong>管脉</strong><small>SMART PIPELINE · LEAK DETECTION</small></span>
      </a>
      <nav aria-label="封面导航" className="cover-links">
        <a href="#capabilities">平台能力</a><a href="#workflow">业务流程</a><a href="#about">关于平台</a>
      </nav>
      <button className="cover-enter cover-enter-small" onClick={onEnter}>进入平台 <ArrowRight size={15}/></button>
    </header>

    <main id="top">
      <section className="cover-hero">
        <div className="cover-fullscreen-effects" aria-hidden="true">
          <div className="cover-ambient-orb orb-a"/><div className="cover-ambient-orb orb-b"/>
          <svg viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice">
            <path className="full-route-rail" d="M-90 702C132 553 244 679 414 562S690 478 850 348s286-31 423-170 197-105 280-177"/>
            <path className="full-route-light" d="M-90 702C132 553 244 679 414 562S690 478 850 348s286-31 423-170 197-105 280-177"/>
            <path className="full-route-branch" d="M356 603c97 107 207 113 321 73s148-137 269-145 234 49 413-12"/>
            <circle className="full-route-pulse pulse-a" r="6"><animateMotion dur="8s" repeatCount="indefinite" path="M-90 702C132 553 244 679 414 562S690 478 850 348s286-31 423-170 197-105 280-177"/></circle>
            <circle className="full-route-pulse pulse-b" r="4"><animateMotion dur="11s" begin="-4s" repeatCount="indefinite" path="M-90 702C132 553 244 679 414 562S690 478 850 348s286-31 423-170 197-105 280-177"/></circle>
            <g className="full-route-node" transform="translate(414 562)"><circle r="13"/><circle r="3"/></g>
            <g className="full-route-node" transform="translate(850 348)"><circle r="13"/><circle r="3"/></g>
            <g className="full-route-node node-alert" transform="translate(1273 178)"><circle className="full-node-ring" r="21"/><circle r="12"/><circle r="3"/></g>
          </svg>
          <div className="cover-screen-scan"/>
        </div>
        <div className="cover-copy">
          <div className="cover-kicker"><i/> PIPELINE INTELLIGENCE <span>/</span> 管道安全感知</div>
          <div className="cover-product-name">油气管道泄漏检测智能平台</div>
          <h1>让每一段管线<br/><em>都处于可感知状态</em></h1>
          <p className="cover-intro">融合实时监测、智能研判与闭环处置，构建从异常发现到现场响应的管道安全运营工作台。</p>
          <div className="cover-actions">
            <button className="cover-enter" onClick={onEnter}>进入监测平台 <ArrowRight size={17}/></button>
            <a className="cover-learn" href="#workflow">了解业务流程 <ArrowDown size={15}/></a>
          </div>
          <div className="cover-live"><span className="cover-live-dot"/> 演示环境已就绪 <b>SIMULATION MODE</b></div>
          <ol className="cover-principles" aria-label="平台核心能力">
            <li><span>01</span><strong>实时感知</strong><small>压力 · 流量 · 设备</small></li>
            <li><span>02</span><strong>异常研判</strong><small>定位 · 证据 · 核查</small></li>
            <li><span>03</span><strong>处置闭环</strong><small>派单 · 处理 · 复核</small></li>
          </ol>
        </div>

        <div className="cover-visual" aria-label="油气管道、阀门与监测设备动态示意图" role="img">
          <div className="cover-halo cover-halo-one"/><div className="cover-halo cover-halo-two"/>
          <div className="cover-visual-caption"><span><b>01 /</b> 油气输送主干线 · K12 段</span><small>管道监测示意</small></div>
          <svg className="cover-map" viewBox="35 85 700 420" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="cover-pipe-steel" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#78a9af"/><stop offset=".18" stopColor="#3d7480"/><stop offset=".48" stopColor="#214d5c"/><stop offset=".78" stopColor="#102f3d"/><stop offset="1" stopColor="#0b2431"/></linearGradient>
              <linearGradient id="cover-pipe-sheen" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a4d7d2" stopOpacity=".52"/><stop offset=".58" stopColor="#65bec0" stopOpacity=".08"/><stop offset="1" stopColor="#0c3441" stopOpacity=".4"/></linearGradient>
              <radialGradient id="cover-core"><stop stopColor="#54e2d1" stopOpacity=".26"/><stop offset="1" stopColor="#54e2d1" stopOpacity="0"/></radialGradient>
              <radialGradient id="cover-scan"><stop stopColor="#71f4dc" stopOpacity=".2"/><stop offset=".62" stopColor="#50d9cf" stopOpacity=".1"/><stop offset="1" stopColor="#50d9cf" stopOpacity="0"/></radialGradient>
            </defs>
            <circle cx="396" cy="284" r="192" fill="url(#cover-core)"/>
            <path className="cover-scan-beam" d="M396 284 396 83A201 201 0 0 1 538 142Z" fill="url(#cover-scan)"/>
            <path className="cover-scan-spoke" d="M396 284 396 83"/>
            <circle className="cover-radar" cx="396" cy="284" r="201"/>
            <circle className="cover-radar cover-radar-two" cx="396" cy="284" r="150"/>
            <path className="cover-contour" d="M63 417c79-63 101-34 164-87 69-58 108-42 168-93 64-54 111-26 170-84 36-35 72-52 132-59"/>
            <path className="cover-contour contour-two" d="M79 483c76-36 111-27 174-68 88-58 124-34 192-88 58-46 98-39 155-86 44-36 83-46 121-48"/>
            <path className="cover-route-shadow" d="M92 402 206 346 307 372 414 282 512 306 654 194"/>
            <path className="cover-route" d="M92 402 206 346 307 372 414 282 512 306 654 194"/>
            <path className="cover-route-sheen" d="M92 402 206 346 307 372 414 282 512 306 654 194"/>
            <path className="cover-route-rim" d="M92 402 206 346 307 372 414 282 512 306 654 194" transform="translate(0 -19)"/>
            <path className="cover-route-flow" d="M92 402 206 346 307 372 414 282 512 306 654 194"/>
            <g className="cover-pipe-flange" transform="translate(205 346) rotate(-27)"><rect x="-10" y="-52" width="20" height="104" rx="4"/><path d="M-5-47v94M5-47v94"/><circle cx="0" cy="-43" r="3"/><circle cx="0" cy="43" r="3"/></g>
            <g className="cover-pipe-flange" transform="translate(513 306) rotate(14)"><rect x="-10" y="-52" width="20" height="104" rx="4"/><path d="M-5-47v94M5-47v94"/><circle cx="0" cy="-43" r="3"/><circle cx="0" cy="43" r="3"/></g>
            <g className="cover-pipe-mouth" transform="translate(654 194) rotate(-39)"><ellipse rx="20" ry="44"/><ellipse rx="13" ry="34"/><path d="M-6-23v46"/></g>
            <g className="cover-valve" transform="translate(414 282)"><path className="cover-valve-stem" d="M0-27v-68"/><path className="cover-valve-body" d="M-34-20 0-38 34-20 34 20 0 38-34 20Z"/><path className="cover-valve-center" d="M-20-13 0-22 20-13v26L0 22-20 13Z"/><circle className="cover-valve-wheel" cx="0" cy="-118" r="25"/><path className="cover-valve-spokes" d="M-25-118h50M0-143v50M-18-136l36 36M18-136l-36 36"/><circle className="cover-valve-hub" cx="0" cy="-118" r="6"/></g>
            <path className="cover-branch" d="m307 372 17 93 86 47m4-230-8-105-82-53m188 182 53 57 86 8"/>
            <g className="cover-node" transform="translate(92 402)"><circle r="14"/><circle r="4"/><text x="-28" y="31">站场 01</text></g>
            <g className="cover-node" transform="translate(206 346)"><circle r="11"/><circle r="3"/><text x="-28" y="30">监测点 05</text></g>
            <g className="cover-node cover-node-alert" transform="translate(307 372)"><circle className="cover-pulse" r="20"/><circle r="12"/><circle r="4"/><text x="-30" y="31">监测点 12</text></g>
            <g className="cover-node cover-valve-label" transform="translate(414 282)"><text x="-25" y="61">阀室 03</text></g>
            <g className="cover-node" transform="translate(512 306)"><circle r="11"/><circle r="3"/><text x="-30" y="30">监测点 20</text></g>
            <g className="cover-node" transform="translate(654 194)"><circle r="14"/><circle r="4"/><text x="-28" y="31">站场 02</text></g>
            <g className="cover-alert-tag" transform="translate(329 411)"><rect width="142" height="44" rx="8"/><circle cx="15" cy="16" r="3"/><text x="26" y="19">异常信号已定位</text><text className="cover-tag-sub" x="12" y="34">K12+200 — K12+600</text></g>
            <circle className="cover-particle particle-one" r="5" fill="#f2fff9"><animateMotion dur="3.8s" repeatCount="indefinite" path="M92 402 206 346 307 372 414 282 512 306 654 194"/></circle>
            <circle className="cover-particle particle-two" r="3.5" fill="#91faff"><animateMotion dur="4.8s" begin="-1.7s" repeatCount="indefinite" path="M92 402 206 346 307 372 414 282 512 306 654 194"/></circle>
          </svg>
          <div className="cover-scanline" aria-hidden="true"/>
          <div className="cover-instruments">
            <div className="cover-telemetry"><div className="cover-instrument-label"><span>PRESSURE</span><small>压力样例</small></div><b>5.42 <small>MPa</small></b><svg className="cover-sparkline" viewBox="0 0 180 24" aria-hidden="true"><path d="M0 18H180"/><polyline points="0,15 14,15 22,11 32,13 43,8 53,10 65,7 78,10 91,9 104,11 117,7 130,9 143,6 156,8 170,5 180,7"/></svg></div>
            <div className="cover-telemetry"><div className="cover-instrument-label"><span>FLOW RATE</span><small>流量样例</small></div><b>12,684 <small>Nm³/h</small></b><svg className="cover-sparkline" viewBox="0 0 180 24" aria-hidden="true"><path d="M0 18H180"/><polyline points="0,7 15,9 29,7 42,11 55,9 68,13 82,10 94,14 106,11 120,15 134,12 148,16 162,13 180,14"/></svg></div>
          </div>
          <div className="cover-visual-foot"><span><i/> 管线状态可视化</span><span>示意数据 <b>SIMULATED</b></span></div>
        </div>
        <div className="cover-scroll"><span>SCROLL TO EXPLORE</span><i/></div>
      </section>

      <section id="capabilities" className="cover-capabilities">
        <div className="cover-section-title"><span>PLATFORM CAPABILITIES</span><h2>三层能力，支撑一条处置链</h2><p>把散落在管段、设备和人员之间的信息，收束到同一条业务线上。</p></div>
        <div className="cover-capability-grid">
          <article><span className="capability-icon"><Radio size={19}/></span><small>01 / SENSE</small><h3>看见运行状态</h3><p>沿管线拓扑查看监测点、采集设备与压力、流量趋势，快速发现异常位置。</p><div className="cover-cap-tags"><span>管段拓扑</span><span>实时曲线</span><span>设备心跳</span></div></article>
          <article><span className="capability-icon"><Activity size={19}/></span><small>02 / ANALYZE</small><h3>看懂异常证据</h3><p>将疑似区间、触发规则和上下游曲线关联呈现，支持人工确认或判定误报。</p><div className="cover-cap-tags"><span>规则证据</span><span>区间定位</span><span>人工核查</span></div></article>
          <article><span className="capability-icon"><ShieldCheck size={19}/></span><small>03 / RESPOND</small><h3>推动处置闭环</h3><p>从派单、现场处理到复核关闭，工单与告警状态联动，过程全程留痕。</p><div className="cover-cap-tags"><span>关联工单</span><span>复核退回</span><span>历史追溯</span></div></article>
        </div>
      </section>
      <section id="workflow" className="cover-workflow">
        <div className="cover-section-title"><span>OPERATION LOOP</span><h2>一条异常，如何完成处置闭环</h2><p>点击步骤，查看每个阶段的证据、操作和结果记录。</p></div>
        <div className="cover-flow-layout">
          <div className="cover-flow-steps" aria-label="业务流程步骤">
            {workflowSteps.map((step, index) => <button key={step.number} className={`cover-flow-step ${activeStep === index ? 'active' : ''}`} aria-pressed={activeStep === index} onClick={() => setActiveStep(index)}>
              <span className="cover-flow-index">{step.number}</span><span className="cover-flow-step-copy"><strong>{step.title}</strong><small>{step.short}</small></span><ArrowRight size={16}/>
            </button>)}
          </div>
          <article className="cover-flow-detail" aria-live="polite" key={currentStep.number}>
            <div className="cover-flow-detail-top"><span className="cover-flow-detail-icon"><CurrentIcon size={21}/></span><span>STEP {currentStep.number} / 04</span><b>{currentStep.label}</b></div>
            <h3>{currentStep.headline}</h3><p>{currentStep.description}</p>
            <div className="cover-flow-facts"><div><small>核对内容</small><strong>{currentStep.evidence}</strong></div><div><small>执行动作</small><strong>{currentStep.action}</strong></div></div>
            <div className="cover-flow-result"><span>阶段结果</span><strong>{currentStep.result}</strong><ArrowRight size={16}/></div>
          </article>
        </div>
        <div className="cover-flow-note"><span>流程分支</span><p>若核查判定为误报，需填写原因并保留原始证据；若工单复核未通过，则退回处理中继续补充现场结果。</p></div>
        <div className="cover-flow-cta"><div><span>READY TO EXPLORE</span><h3>在模拟场景中走完这条流程</h3><p>从疑似泄漏告警开始，查看证据、派发工单，再复核关闭。</p></div><button className="cover-enter" onClick={onEnter}>进入平台演示 <ArrowRight size={17}/></button></div>
      </section>
      <footer id="about" className="cover-footer"><span>管脉 · 油气管道泄漏检测智能平台</span><span>教学演示 · 固定种子模拟数据</span></footer>
    </main>
  </div>;
}
