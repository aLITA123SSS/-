const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const mock = {
  stage1: {
    projectName: "基于机器学习的宏观经济政策仿真研究",
    researchType: "pure-theory",
    budget: 12.5,
    thresholdMedian: 5.0,
    thresholdRatio: 2.0,
  },
  stage2: {
    claimNo: "TR-20261025-0817",
    amount: 12580,
    route: "北京 → 西安",
    hotel: { city: "西安", time: "2026-10-21 22:10" },
    access: { city: "北京", time: "2026-10-21 22:16" },
    gapMinutes: 6,
    sources: 5,
  },
  stage3: {
    totalTrips: 34,
    lastMonthTrips: 8,
    lastMonthAmount: 86420,
    outputCount: 0,
    outlierScore: 0.97,
    months: ["12月", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月"],
    cities: [
      ["北京", [2, 3, 2, 4, 3, 5, 4, 6, 5, 9]],
      ["上海", [1, 2, 3, 2, 4, 3, 5, 4, 3, 8]],
      ["西安", [0, 1, 0, 1, 2, 1, 0, 2, 2, 10]],
      ["深圳", [1, 0, 2, 1, 1, 2, 2, 3, 2, 7]],
      ["广州", [0, 1, 1, 0, 2, 1, 1, 2, 1, 6]],
    ],
  },
};

const stageMeta = {
  stage1: { index: "01", name: "立项风险预审" },
  stage2: { index: "02", name: "执行动态监控" },
  stage3: { index: "03", name: "结题合规终审" },
};

const state = {
  currentStage: null,
  lastResults: {},
  processing: false,
  processingTimers: [],
};

const processingOverlay = $("#processingOverlay");
const resultOverlay = $("#resultOverlay");
const resultCard = $("#resultCard");
const evidenceDrawer = $("#evidenceDrawer");
const drawerBackdrop = $("#drawerBackdrop");
const toast = $("#toast");

function showView(viewName, updateHash = true) {
  $$(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${viewName}`);
  });
  $$(".nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === viewName);
  });
  if (updateHash) {
    history.replaceState(null, "", `#${viewName}`);
  }
  $(".main").scrollTo({ top: 0, behavior: "smooth" });
}

function setStageStatus(stage, status, text) {
  state.lastResults[stage] = status;

  const navState = $(`[data-state-for="${stage}"]`);
  if (navState) {
    navState.classList.remove("is-warning", "is-pass");
    navState.classList.add(status === "warning" ? "is-warning" : "is-pass");
    navState.textContent = text;
  }

  const cardState = $(`[data-card-state="${stage}"]`);
  if (cardState) {
    cardState.classList.remove("is-warning", "is-pass");
    cardState.classList.add(status === "warning" ? "is-warning" : "is-pass");
    cardState.textContent = text;
  }

  const completed = Object.keys(state.lastResults).length;
  $("#progressLabel").textContent = `${completed} / 3`;
  $("#progressBar").style.width = `${(completed / 3) * 100}%`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2100);
}

function buildProcessingSteps(labels) {
  const root = $("#processingSteps");
  root.innerHTML = labels
    .map(
      (label, index) =>
        `<div class="processing-step${index === 0 ? " is-active" : ""}">${label}</div>`,
    )
    .join("");
}

function setProcessingStep(index) {
  $$(".processing-step").forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === index);
  });
}

function stageOneVisual() {
  return `
    <div class="process-graph">
      <svg viewBox="0 0 760 245" role="img" aria-label="知识图谱关联匹配动画">
        <line class="graph-link" x1="380" y1="123" x2="150" y2="48"/>
        <line class="graph-link" x1="380" y1="123" x2="606" y2="48"/>
        <line class="graph-link" x1="380" y1="123" x2="126" y2="174"/>
        <line class="graph-link" x1="380" y1="123" x2="636" y2="177"/>
        <line class="graph-link" x1="380" y1="123" x2="350" y2="214"/>
        <line class="graph-link" x1="150" y1="48" x2="606" y2="48"/>
        <line class="graph-link" x1="126" y1="174" x2="636" y2="177"/>
        <circle class="graph-node-circle" cx="150" cy="48" r="23"/>
        <circle class="graph-node-circle" cx="606" cy="48" r="24"/>
        <circle class="graph-node-circle" cx="126" cy="174" r="23"/>
        <circle class="graph-node-circle" cx="636" cy="177" r="24"/>
        <circle class="graph-node-circle" cx="350" cy="214" r="21"/>
        <circle class="graph-node-core" cx="380" cy="123" r="48"/>
        <text class="graph-label" x="150" y="48">项目属性</text>
        <text class="graph-label" x="606" y="48">研究类型</text>
        <text class="graph-label" x="126" y="174">同类课题</text>
        <text class="graph-label" x="636" y="177">预算阈值</text>
        <text class="graph-label" x="350" y="214">审计规则</text>
        <text class="graph-label core" x="380" y="123">立项风险</text>
      </svg>
    </div>`;
}

function stageTwoVisual(anomaly = true) {
  return `
    <div class="process-doc-grid">
      <div class="scan-card">
        <h3>OCR + RPA · 票据与流水核验</h3>
        <div class="scan-document">
          <i>OCR</i><div><b>航空运输电子客票</b><span>北京 → 西安 · ¥1,420.00</span></div><em>识别完成</em>
        </div>
        <div class="scan-document">
          <i>票验</i><div><b>西安酒店电子发票</b><span>开票主体、金额与日期匹配</span></div><em>真伪通过</em>
        </div>
        <div class="scan-document">
          <i>RPA</i><div><b>银行支付流水</b><span>付款方与报销人一致</span></div><em>金额一致</em>
        </div>
      </div>
      <div class="timeline-card">
        <h3>RNN · 人员时空序列对齐</h3>
        <div class="process-timeline">
          <div class="rnn-step"><i>1</i><b>出差审批</b><span>西安</span></div>
          <div class="rnn-step"><i>2</i><b>航空出行</b><span>10.20</span></div>
          <div class="rnn-step is-warning"><i>3</i><b>酒店住宿</b><span>10.21 22:10</span></div>
          <div class="rnn-step ${anomaly ? "is-danger" : ""}"><i>${anomaly ? "!" : "✓"}</i><b>${anomaly ? "本部门禁" : "轨迹核对"}</b><span>${anomaly ? "10.21 22:16" : "未发现冲突"}</span></div>
        </div>
        <div class="result-evidence" style="margin-top:20px;color:#ffd8d3;background:rgba(157,42,37,.16)">
          ${anomaly ? "时序对齐发现：西安酒店入住与北京本部实验室门禁在 6 分钟内同时发生。" : "当前模拟数据未出现同日异地记录，票据、流水与人员轨迹可以相互印证。"}
        </div>
      </div>
    </div>`;
}

function buildHeatmapCells(container, hotLastColumn) {
  const html = [];
  html.push('<div class="process-hm-label"></div>');
  mock.stage3.months.forEach((month) => {
    html.push(`<div class="process-hm-label">${month}</div>`);
  });

  mock.stage3.cities.forEach(([city, values], rowIndex) => {
    const adjusted = values.map((value, columnIndex) => {
      if (!hotLastColumn && columnIndex === values.length - 1) {
        return Math.min(value, 4);
      }
      return value;
    });
    html.push(`<div class="process-hm-label">${city}</div>`);
    adjusted.forEach((value, columnIndex) => {
      const hot = hotLastColumn && columnIndex === adjusted.length - 1 && value >= 6;
      const heat = Math.min(0.12 + value * 0.052, 0.86);
      html.push(
        `<div class="process-hm-cell${hot ? " hot" : ""}" style="--heat:${heat};--delay:${(rowIndex * 10 + columnIndex) * 25}ms"></div>`,
      );
    });
  });
  container.innerHTML = html.join("");
}

function stageThreeVisual() {
  return `
    <div class="process-heatmap" id="processHeatmap"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">
      <div class="processing-step"><b>论文与专利</b>产出关联正常</div>
      <div class="processing-step"><b>外场试验报告</b>未发现对应记录</div>
      <div class="processing-step is-active"><b>孤立森林</b>离群分数 0.97</div>
    </div>`;
}

function runAnalysis(stage, callback) {
  if (state.processing) return;
  state.processing = true;

  const content = {
    stage1: {
      title: "知识图谱关联匹配中...",
      subtitle: "正在识别项目属性，并比对同类课题预算与历史审计规则",
      duration: 2900,
      steps: [
        "<b>01 · 已完成</b>研究属性识别",
        "<b>02 · 进行中</b>知识图谱穿透",
        "<b>03 · 待执行</b>预算阈值比对",
      ],
      visual: stageOneVisual,
    },
    stage2: {
      title: "差旅凭证与时空轨迹核验中...",
      subtitle: "正在完成票据识别、发票真伪查验与多源时间序列对齐",
      duration: 3500,
      steps: [
        "<b>01 · 已完成</b>OCR 字段提取",
        "<b>02 · 进行中</b>发票与流水核对",
        "<b>03 · 待执行</b>RNN 时空冲突检测",
      ],
      visual: () => stageTwoVisual($("#stage2Anomaly").checked),
    },
    stage3: {
      title: "全周期成果与经费交叉印证中...",
      subtitle: "正在生成时空热力图，并计算差旅频次与科研产出的关联强度",
      duration: 3800,
      steps: [
        "<b>01 · 已完成</b>全周期数据归集",
        "<b>02 · 进行中</b>成果与支出关联",
        "<b>03 · 待执行</b>孤立森林离群检测",
      ],
      visual: stageThreeVisual,
    },
  }[stage];

  $("#processingTitle").textContent = content.title;
  $("#processingSubtitle").textContent = content.subtitle;
  $("#processingVisual").innerHTML = content.visual();
  buildProcessingSteps(content.steps);
  if (stage === "stage3") {
    buildHeatmapCells($("#processHeatmap"), $("#stage3Anomaly").checked);
  }

  processingOverlay.classList.add("is-visible");
  processingOverlay.setAttribute("aria-hidden", "false");

  state.processingTimers = [
    window.setTimeout(() => setProcessingStep(1), content.duration * 0.32),
    window.setTimeout(() => setProcessingStep(2), content.duration * 0.64),
    window.setTimeout(() => {
      processingOverlay.classList.remove("is-visible");
      processingOverlay.setAttribute("aria-hidden", "true");
      state.processing = false;
      callback();
    }, content.duration),
  ];
}

function renderResult({
  stage,
  passed,
  title,
  subtitle,
  copy,
  metrics,
  evidence,
  statusText,
}) {
  state.currentStage = stage;
  resultCard.classList.toggle("is-warning", !passed);
  resultCard.classList.toggle("is-pass", passed);
  $("#resultIcon").textContent = passed ? "✓" : "!";
  $("#resultKicker").textContent = passed ? "智能审计检查通过" : "智能审计风险预警";
  $("#resultTitle").textContent = title;
  $("#resultSubtitle").textContent = subtitle;
  $("#resultCopy").textContent = copy;
  $("#resultMetrics").innerHTML = metrics
    .map(
      ([label, value, highlight = false]) =>
        `<div class="result-metric"><span>${label}</span><b style="${highlight ? "color:#c3342b" : ""}">${value}</b></div>`,
    )
    .join("");
  $("#resultEvidence").innerHTML = `<b>判断摘要：</b>${evidence}`;
  $("#resultNext").textContent =
    stage === "stage3" ? "返回项目总览 →" : `进入${stage === "stage1" ? "第二" : "第三"}阶段 →`;

  setStageStatus(stage, passed ? "pass" : "warning", passed ? "通过" : "预警");
  resultOverlay.classList.add("is-visible");
  resultOverlay.setAttribute("aria-hidden", "false");
}

function closeResult() {
  resultOverlay.classList.remove("is-visible");
  resultOverlay.setAttribute("aria-hidden", "true");
}

function handleStageOne(event) {
  event.preventDefault();
  const type = $("#researchType").value;
  const budget = Number($("#travelBudget").value || 0);
  const isWarning = type === "pure-theory" && budget > mock.stage1.thresholdMedian * mock.stage1.thresholdRatio;
  const ratio = (budget / mock.stage1.thresholdMedian).toFixed(1);

  runAnalysis("stage1", () => {
    if (isWarning) {
      renderResult({
        stage: "stage1",
        passed: false,
        title: "智能预审发现高风险事项",
        subtitle: "规则命中：纯理论研究差旅预算显著偏高",
        copy: `⚠️ 预警提示：该课题属于纯理论研究，无外场实验需求，高频外地差旅预算偏高（超同类课题阈值），建议复核或核减。`,
        metrics: [
          ["研究类型", "纯理论数学研究"],
          ["申报预算", `${budget.toFixed(1)} 万元`, true],
          ["同类中位值", `${mock.stage1.thresholdMedian.toFixed(1)} 万元`],
        ],
        evidence: `该项目未配置外场实验任务，申报差旅预算是同类课题中位值的 ${ratio} 倍，已触发预算显著偏离规则。`,
        statusText: "预警",
      });
    } else {
      renderResult({
        stage: "stage1",
        passed: true,
        title: "立项预审通过",
        subtitle: "研究属性与预算结构未发现显著异常",
        copy: "系统未发现研究类型与预算结构之间的显著冲突，可进入专家确认与立项流程。",
        metrics: [
          ["研究类型", type === "pure-theory" ? "纯理论数学研究" : "非纯理论研究"],
          ["申报预算", `${budget.toFixed(1)} 万元`],
          ["规则命中", "0 项"],
        ],
        evidence: "差旅预算未超过当前纯理论研究课题的重点复核阈值，建议保留常规抽查。",
        statusText: "通过",
      });
    }
  });
}

function handleStageTwo() {
  const anomaly = $("#stage2Anomaly").checked;
  runAnalysis("stage2", () => {
    if (anomaly) {
      renderResult({
        stage: "stage2",
        passed: false,
        title: "异常预警 · 暂停支付",
        subtitle: "多源时间序列冲突 · 规则置信度 98.6%",
        copy: "系统检测到异常：报销记录显示当日在西安酒店住宿，但人力系统门禁数据显示当日本人在北京本部实验室，涉嫌时空冲突，暂停支付并推送人工复核。",
        metrics: [
          ["报销金额", "¥12,580"],
          ["时空冲突", "1 项", true],
          ["对齐数据源", "5 个"],
        ],
        evidence: "西安酒店入住时间 22:10，北京实验室门禁时间 22:16，两地记录仅相隔 6 分钟，人工核验前不建议继续支付。",
        statusText: "预警",
      });
    } else {
      renderResult({
        stage: "stage2",
        passed: true,
        title: "票据与时空一致性检查通过",
        subtitle: "4 张票据与 5 个数据源未发现冲突",
        copy: "发票、银行流水、出差审批与人员轨迹能够相互印证，报销申请可进入正常支付流程。",
        metrics: [
          ["报销金额", "¥12,580"],
          ["票据一致", "4 / 4"],
          ["时空冲突", "0 项"],
        ],
        evidence: "关闭模拟异常后，系统未检测到同日异地冲突，资金与票据信息保持一致。",
        statusText: "通过",
      });
    }
  });
}

function handleStageThree() {
  const anomaly = $("#stage3Anomaly").checked;
  runAnalysis("stage3", () => {
    if (anomaly) {
      renderResult({
        stage: "stage3",
        passed: false,
        title: "结题终审异常 · 离群点警报",
        subtitle: "时空热力异常 · 成果关联显著偏低",
        copy: "图表显示该项目在结题前最后一个月发生突击大额密集出差，且差旅频次与技术转化成果关联度低，触发离群点挖掘（孤立森林算法）警报。",
        metrics: [
          ["最后一个月出差", "8 次", true],
          ["对应支出", "¥86,420", true],
          ["相关成果", "0 项"],
        ],
        evidence: "末月差旅支出形成孤立尖峰，且没有外场试验报告或技术转化成果能够解释该支出结构，离群分数为 0.97。",
        statusText: "预警",
      });
    } else {
      renderResult({
        stage: "stage3",
        passed: true,
        title: "结题终审通过",
        subtitle: "差旅轨迹与科研产出能够合理关联",
        copy: "全周期差旅支出结构平稳，异地差旅能够与科研产出和外场记录交叉印证，未触发离群点警报。",
        metrics: [
          ["差旅记录", "26 次"],
          ["外场报告", "3 份"],
          ["离群点", "0 项"],
        ],
        evidence: "关闭模拟突击出差后，末月支出与成果关联恢复正常，当前数据未形成显著离群点。",
        statusText: "通过",
      });
    }
  });
}

function buildDrawerContent(stage, passed) {
  if (stage === "stage1") {
    const type = $("#researchType").value;
    const budget = Number($("#travelBudget").value || 0);
    return `
      <div class="evidence-section">
        <h3>关键数据</h3>
        <div class="evidence-kv"><span>项目名称</span><b>${$("#projectName").value}</b></div>
        <div class="evidence-kv"><span>研究类型</span><b>${type === "pure-theory" ? "纯理论数学研究" : type === "field" ? "外场应用研究" : "应用基础研究"}</b></div>
        <div class="evidence-kv"><span>差旅预算</span><b>${budget.toFixed(1)} 万元</b></div>
        <div class="evidence-kv"><span>同类中位值</span><b>5.0 万元</b></div>
      </div>
      <div class="evidence-section">
        <h3>判断链</h3>
        <div class="evidence-chain">
          <div class="evidence-chain-item">项目属性显示为${type === "pure-theory" ? "纯理论研究，通常不存在外场实验需求" : "需要结合科研任务核实外场支出"}。</div>
          <div class="evidence-chain-item">差旅预算与同类课题历史中位值进行交叉比较。</div>
          <div class="evidence-chain-item">${passed ? "预算未达到重点复核阈值，进入常规抽查。" : "预算偏离超过阈值，触发人工复核或核减。"}</div>
        </div>
      </div>
      <div class="evidence-section">
        <h3>审计留痕</h3>
        <div class="evidence-kv"><span>规则版本</span><b>R-Audit 2026.10</b></div>
        <div class="evidence-kv"><span>执行节点</span><b>立项预审</b></div>
        <div class="evidence-kv"><span>处理状态</span><b>${passed ? "通过 / 待专家确认" : "预警 / 待人工复核"}</b></div>
      </div>`;
  }

  if (stage === "stage2") {
    return `
      <div class="evidence-section">
        <h3>多源数据核对</h3>
        <div class="evidence-kv"><span>航空行程</span><b>北京 → 西安</b></div>
        <div class="evidence-kv"><span>酒店入住</span><b>西安 · 10-21 22:10</b></div>
        <div class="evidence-kv"><span>实验室门禁</span><b>北京 · ${$("#stage2Anomaly").checked ? "10-21 22:16" : "未出现同日记录"}</b></div>
        <div class="evidence-kv"><span>银行流水</span><b>付款人与报销人一致</b></div>
      </div>
      <div class="evidence-section">
        <h3>判断链</h3>
        <div class="evidence-chain">
          <div class="evidence-chain-item">OCR 提取机票、酒店和支付信息，并完成发票真伪与金额核验。</div>
          <div class="evidence-chain-item">RPA 核对银行流水中的收款方、金额和交易时间。</div>
          <div class="evidence-chain-item">${passed ? "RNN 未发现行程、住宿和门禁记录之间的显著冲突。" : "RNN 识别到西安与北京同日异地记录，时间差仅 6 分钟。"}</div>
        </div>
      </div>
      <div class="evidence-section">
        <h3>处理建议</h3>
        <div class="evidence-kv"><span>当前动作</span><b>${passed ? "允许进入支付流程" : "暂停支付并人工复核"}</b></div>
        <div class="evidence-kv"><span>复核重点</span><b>${passed ? "保留常规抽凭" : "门禁代刷、虚假住宿或票据借用"}</b></div>
      </div>`;
  }

  return `
    <div class="evidence-section">
      <h3>全周期归集结果</h3>
      <div class="evidence-kv"><span>差旅记录</span><b>${$("#stage3Anomaly").checked ? "34 笔" : "26 次"}</b></div>
      <div class="evidence-kv"><span>最后一个月出差</span><b>${$("#stage3Anomaly").checked ? "8 次" : "2 次"}</b></div>
      <div class="evidence-kv"><span>末月支出</span><b>${$("#stage3Anomaly").checked ? "¥86,420" : "¥12,600"}</b></div>
      <div class="evidence-kv"><span>外场报告</span><b>${$("#stage3Anomaly").checked ? "0 份" : "3 份"}</b></div>
    </div>
    <div class="evidence-section">
      <h3>判断链</h3>
      <div class="evidence-chain">
        <div class="evidence-chain-item">按城市和月份生成经费支出时空热力图。</div>
        <div class="evidence-chain-item">将高差旅频次与论文、专利、外场报告进行关联。</div>
        <div class="evidence-chain-item">${passed ? "末月支出未形成异常尖峰，成果关联处于合理区间。" : "末月支出形成显著尖峰，且缺少相关外场与转化成果支撑。"}</div>
      </div>
    </div>
    <div class="evidence-section">
      <h3>算法结论</h3>
      <div class="evidence-kv"><span>异常检测</span><b>Isolation Forest</b></div>
      <div class="evidence-kv"><span>离群分数</span><b>${passed ? "0.28 / 未触发" : "0.97 / 显著离群"}</b></div>
      <div class="evidence-kv"><span>处理建议</span><b>${passed ? "正常归档" : "转专家复核并核查外场必要性"}</b></div>
    </div>`;
}

function openEvidence() {
  const stage = state.currentStage;
  if (!stage) return;
  const passed = state.lastResults[stage] === "pass";
  $("#drawerContent").innerHTML = buildDrawerContent(stage, passed);
  evidenceDrawer.classList.add("is-open");
  drawerBackdrop.classList.add("is-visible");
  evidenceDrawer.setAttribute("aria-hidden", "false");
}

function closeEvidence() {
  evidenceDrawer.classList.remove("is-open");
  drawerBackdrop.classList.remove("is-visible");
  evidenceDrawer.setAttribute("aria-hidden", "true");
}

function renderOverviewHeatmap() {
  const container = $("#overviewHeatmap");
  const showSpike = $("#stage3Anomaly").checked;
  const html = [];
  html.push('<div class="heatmap-label"></div>');
  mock.stage3.months.forEach((month) => html.push(`<div class="heatmap-label month">${month}</div>`));

  mock.stage3.cities.forEach(([city, values]) => {
    html.push(`<div class="heatmap-label">${city}</div>`);
    values.forEach((original, columnIndex) => {
      const value = showSpike ? original : Math.min(original, 4);
      const hot = showSpike && columnIndex === values.length - 1 && value >= 6;
      const heat = Math.min(0.12 + value * 0.052, 0.86);
      html.push(`<div class="heat-cell${hot ? " is-hot" : ""}" style="--heat:${heat}"></div>`);
    });
  });
  container.innerHTML = html.join("");
}

function updateStageThreeNumbers() {
  const anomaly = $("#stage3Anomaly").checked;
  $("#closingTrips").textContent = anomaly ? "34 笔" : "26 次";
  $("#closingAmount").textContent = anomaly ? "¥286,400" : "¥221,800";
  $("#closingReports").textContent = anomaly ? "0 份" : "3 份";
  $("#fieldReportState").textContent = anomaly ? "未发现" : "已关联";
  $("#conversionState").textContent = anomaly ? "关联度低" : "关联合理";
}

function resetDemo() {
  $("#projectName").value = mock.stage1.projectName;
  $("#researchType").value = mock.stage1.researchType;
  $("#travelBudget").value = mock.stage1.budget;
  $("#stage2Anomaly").checked = true;
  $("#stage3Anomaly").checked = true;
  state.lastResults = {};
  state.currentStage = null;
  $$("[data-state-for]").forEach((item) => {
    item.textContent = "待演示";
    item.classList.remove("is-warning", "is-pass");
  });
  $$("[data-card-state]").forEach((item) => {
    item.textContent = "待演示";
    item.classList.remove("is-warning", "is-pass");
  });
  $("#progressLabel").textContent = "0 / 3";
  $("#progressBar").style.width = "0%";
  renderOverviewHeatmap();
  closeResult();
  closeEvidence();
  showView("overview");
  showToast("演示数据已重置");
}

document.addEventListener("click", (event) => {
  const goButton = event.target.closest("[data-go]");
  if (goButton) {
    showView(goButton.dataset.go);
    return;
  }

  const nav = event.target.closest("[data-view]");
  if (nav) {
    showView(nav.dataset.view);
  }
});

$("#formStage1").addEventListener("submit", handleStageOne);
$("#formStage2").addEventListener("submit", (event) => {
  event.preventDefault();
  handleStageTwo();
});
$("#startStage3").addEventListener("click", handleStageThree);

$("[data-preset='stage1-warning']").addEventListener("click", () => {
  $("#researchType").value = "pure-theory";
  $("#travelBudget").value = "12.5";
  showToast("已恢复“纯理论研究 + 12.5 万元”异常样例");
});

$$(".document-row").forEach((row) => {
  row.addEventListener("click", () => {
    $$(".document-row").forEach((item) => item.classList.remove("is-selected"));
    row.classList.add("is-selected");
    const details = {
      air: ["航空运输电子客票", "出发地：北京｜目的地：西安｜金额：¥1,420.00｜状态：字段已提取"],
      hotel: ["西安酒店电子发票", "入住：10.20—10.22｜金额：¥2,680.00｜状态：发票校验通过"],
      bank: ["银行支付流水", "付款方：项目组｜金额：¥12,580.00｜状态：主体与金额一致"],
    }[row.dataset.doc];
    $("#documentPreview").innerHTML = `
      <div class="preview-label">当前查看：${details[0]}</div>
      <div class="preview-fields">${details[1]
        .split("｜")
        .map((item) => `<span>${item}</span>`)
        .join("")}</div>`;
  });
});

$("#stage3Anomaly").addEventListener("change", renderOverviewHeatmap);
$("#stage3Anomaly").addEventListener("change", updateStageThreeNumbers);
$("#resetDemo").addEventListener("click", resetDemo);
$("#resultClose").addEventListener("click", closeResult);
$("#evidenceButton").addEventListener("click", openEvidence);
$("#drawerClose").addEventListener("click", closeEvidence);
$("#drawerBackdrop").addEventListener("click", closeEvidence);

$("#resultNext").addEventListener("click", () => {
  const nextView =
    state.currentStage === "stage1"
      ? "stage2"
      : state.currentStage === "stage2"
        ? "stage3"
        : "overview";
  closeResult();
  closeEvidence();
  showView(nextView);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeEvidence();
  if (!state.processing) closeResult();
});

const initialView = location.hash.replace("#", "") || "overview";
const validView = ["overview", "stage1", "stage2", "stage3"].includes(initialView)
  ? initialView
  : "overview";
showView(validView, false);
renderOverviewHeatmap();
updateStageThreeNumbers();

if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Offline caching is optional and does not affect the interactive demo.
    });
  });
}
