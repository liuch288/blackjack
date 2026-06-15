/**
 * 生成 EV 可视化页面：将所有预设 EV 数据嵌入 HTML
 */
const fs = require('fs');
const path = require('path');

const presets = {
  basic:    { name:'基础训练',       short:'6D S17 DAS LS' },
  vegas:    { name:'拉斯维加斯',     short:'6D S17 DAS LS' },
  atlantic: { name:'大西洋城',       short:'8D S17 DAS LS' },
  macau:    { name:'澳门标准',       short:'6D S17 DAS' },
  europe:   { name:'欧洲规则',       short:'6D S17 nDAS' },
  doubledeck:{ name:'双副桌面',       short:'2D S17 DAS LS' },
};

// 读取所有数据
const data = {};
for (const key of Object.keys(presets)) {
  data[key] = JSON.parse(fs.readFileSync(path.resolve(__dirname, `ev-${key}.json`), 'utf-8'));
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blackjack EV 策略表</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0d5e2e; color:#fff; min-height:100vh; }
.header { background:rgba(0,0,0,.3); padding:16px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.header h1 { font-size:22px; }
.header .preset-tabs { display:flex; gap:4px; flex-wrap:wrap; }
.header .preset-tab { padding:6px 14px; border-radius:6px; border:1px solid rgba(255,255,255,.25); background:transparent; color:#fff; cursor:pointer; font-size:13px; transition:.15s; }
.header .preset-tab:hover { background:rgba(255,255,255,.1); }
.header .preset-tab.active { background:#ffd700; color:#111; border-color:#ffd700; font-weight:bold; }
.mode-tabs { display:flex; gap:6px; padding:12px 24px; background:rgba(0,0,0,.15); }
.mode-tab { padding:8px 20px; border-radius:8px; border:none; cursor:pointer; font-size:14px; font-weight:600; transition:.15s; background:rgba(255,255,255,.1); color:rgba(255,255,255,.7); }
.mode-tab:hover { background:rgba(255,255,255,.2); color:#fff; }
.mode-tab.active { background:#fff; color:#111; }
.content { padding:16px 24px 40px; overflow-x:auto; }
table { border-collapse:collapse; width:100%; min-width:700px; }
th, td { border:1px solid rgba(255,255,255,.15); padding:10px 6px; text-align:center; font-size:13px; min-width:60px; }
th { background:rgba(0,0,0,.4); font-weight:600; position:sticky; top:0; }
td:first-child, th:first-child { font-weight:700; background:rgba(0,0,0,.3); position:sticky; left:0; }
.cell { position:relative; cursor:default; transition:.1s; }
.cell:hover { transform:scale(1.05); z-index:1; box-shadow:0 0 12px rgba(0,0,0,.5); }
.cell-hit  { background:rgba(59,130,246,.35); }  /* blue */
.cell-stand { background:rgba(34,197,94,.35); }  /* green */
.cell-double { background:rgba(251,191,36,.4); } /* gold */
.cell-split { background:rgba(168,85,247,.35); } /* purple */
.cell-surrender { background:rgba(251,113,133,.35); } /* pink */
.action-label { font-weight:700; font-size:15px; display:block; }
.ev-value { font-size:11px; opacity:.85; margin-top:2px; }
.diff-bar { display:flex; gap:12px; align-items:center; padding:4px 24px; font-size:13px; }
.diff-toggle { padding:6px 14px; border-radius:6px; border:1px solid rgba(255,255,255,.3); background:transparent; color:#fff; cursor:pointer; font-size:13px; }
.diff-toggle.active { background:#ff4444; border-color:#ff4444; color:#fff; font-weight:bold; }
.diff-hint { font-size:12px; opacity:.6; }
.cell-diff { outline:2px solid #ff4444 !important; outline-offset:-2px; }
.cell-diff::after { content:'⚠'; position:absolute; top:2px; right:4px; font-size:10px; }
.legend { display:flex; gap:16px; padding:8px 24px; flex-wrap:wrap; font-size:12px; }
.legend-item { display:flex; align-items:center; gap:6px; }
.legend-swatch { width:14px; height:14px; border-radius:3px; }
.legend-swatch.hit { background:rgba(59,130,246,.6); }
.legend-swatch.stand { background:rgba(34,197,94,.6); }
.legend-swatch.double { background:rgba(251,191,36,.6); }
.legend-swatch.split { background:rgba(168,85,247,.6); }
.legend-swatch.surrender { background:rgba(251,113,133,.6); }
.footer { text-align:center; padding:20px; font-size:12px; opacity:.5; }
.ev-negative { color:rgba(255,255,255,.55); }
.ev-positive { color:#ffd700; }
.soft-tag { font-size:10px; opacity:.7; }
.info-bar { padding:8px 24px; font-size:13px; opacity:.7; background:rgba(0,0,0,.1); }
</style>
</head>
<body>
<div class="header">
  <h1>🃏 Blackjack EV 策略表</h1>
  <div class="preset-tabs" id="presetTabs"></div>
</div>
<div class="info-bar" id="infoBar"></div>
<div class="mode-tabs">
  <button class="mode-tab active" data-mode="hard">硬手 (Hard)</button>
  <button class="mode-tab" data-mode="soft">软手 (Soft)</button>
  <button class="mode-tab" data-mode="pair">对子 (Pair)</button>
</div>
<div class="diff-bar">
  <button class="diff-toggle" id="diffToggle">🔍 对比基准 (差异高亮)</button>
  <span class="diff-hint">选中后对比当前规则与基础训练的差异</span>
</div>
<div class="legend">
  <div class="legend-item"><div class="legend-swatch hit"></div>要牌 Hit</div>
  <div class="legend-item"><div class="legend-swatch stand"></div>停牌 Stand</div>
  <div class="legend-item"><div class="legend-swatch double"></div>加倍 Double</div>
  <div class="legend-item"><div class="legend-swatch split"></div>分牌 Split</div>
  <div class="legend-item"><div class="legend-swatch surrender"></div>投降 Surr</div>
  <div class="legend-item" style="margin-left:16px;"><div class="legend-swatch" style="background:transparent;border:2px solid #ff4444;"></div>策略变化</div>
</div>
<div class="content" id="content"></div>
<div class="footer">数据来源: 无限牌靴模型 · S17 · 自算验证</div>

<script>
const DATA = ${JSON.stringify(data)};
const PRESETS = ${JSON.stringify(presets)};
const UPCARDS = ['2','3','4','5','6','7','8','9','10','A'];

let currentPreset = 'basic';
let currentMode = 'hard';
let diffMode = false;

function actionLabel(act) {
  const map = { Hit:'要牌', Stand:'停牌', Double:'加倍', Split:'分牌', Surrender:'投降' };
  return map[act] || act;
}
function cellClass(act) {
  const map = { Hit:'hit', Stand:'stand', Double:'double', Split:'split', Surrender:'surrender' };
  return map[act] || '';
}
function evClass(v) { return v >= 0 ? 'ev-positive' : 'ev-negative'; }

function bestAction(actions) {
  let best='', bestEV=-Infinity;
  for(const [act,ev] of Object.entries(actions)) {
    if(ev > bestEV && ev > -Infinity) { bestEV=ev; best=act; }
  }
  return best;
}

function render() {
  const d = DATA[currentPreset];
  const info = document.getElementById('infoBar');
  info.textContent = '📋 ' + PRESETS[currentPreset].name + ' · ' + PRESETS[currentPreset].short;
  
  const div = document.getElementById('content');
  let html = '<table><thead><tr><th>手牌</th>';
  for(const u of UPCARDS) html += '<th>庄 ' + u + '</th>';
  html += '</tr></thead><tbody>';
  
  if(currentMode === 'hard') {
    // 仅显示可决策的手牌 (4-17)
    // 硬手从5开始：4=(2,2)在对子表，A+3=软14在软手表
    const hands = ['5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'];
    for(const h of hands) {
      html += '<tr><td>' + h + '</td>';
      for(const u of UPCARDS) {
        const acts = d.hard[h] ? d.hard[h][u] : null;
        if(!acts) { html += '<td></td>'; continue; }
        const best = bestAction(acts);
        let diffClass = '';
        if(diffMode && currentPreset!=='basic') {
          const bActs = DATA['basic'].hard[h]?.[u];
          if(bActs && bestAction(bActs) !== best) diffClass = ' cell-diff';
        }
        html += '<td class="cell cell-' + cellClass(best) + diffClass + '">'
          + '<span class="action-label">' + actionLabel(best) + '</span>'
          + '<span class="ev-value ' + evClass(acts[best]) + '">' + acts[best].toFixed(3) + '</span>'
          + '</td>';
      }
      html += '</tr>';
    }
  } else if(currentMode === 'soft') {
    const hands = ['13','14','15','16','17','18','19','20'];
    for(const h of hands) {
      const softLabels = {13:'A2',14:'A3',15:'A4',16:'A5',17:'A6',18:'A7',19:'A8',20:'A9'};
      html += '<tr><td>' + softLabels[h] + ' <span class="soft-tag">(' + h + ')</span></td>';
      for(const u of UPCARDS) {
        const acts = d.soft[h] ? d.soft[h][u] : null;
        if(!acts) { html += '<td></td>'; continue; }
        const best = bestAction(acts);
        let diffClass = '';
        if(diffMode && currentPreset!=='basic') {
          const bActs = DATA['basic'].soft[h]?.[u];
          if(bActs && bestAction(bActs) !== best) diffClass = ' cell-diff';
        }
        html += '<td class="cell cell-' + cellClass(best) + diffClass + '">'
          + '<span class="action-label">' + actionLabel(best) + '</span>'
          + '<span class="ev-value ' + evClass(acts[best]) + '">' + acts[best].toFixed(3) + '</span>'
          + '</td>';
      }
      html += '</tr>';
    }
  } else {
    const pairs = ['2,2','3,3','4,4','5,5','6,6','7,7','8,8','9,9','10,10','A,A'];
    for(const p of pairs) {
      html += '<tr><td>' + p + '</td>';
      for(const u of UPCARDS) {
        const acts = d.pair[p] ? d.pair[p][u] : null;
        // 对子需要同时看不分牌的操作
        const cardVal = p === 'A,A' ? 1 : parseInt(p.split(',')[0]);
        const hardTotal = p === 'A,A' ? 12 : cardVal * 2;
        const nonSplit = d.hard[String(hardTotal)] ? d.hard[String(hardTotal)][u] : {};
        const all = {...nonSplit, ...(acts || {})};
        if(!all.Hit && !all.Stand && !all.Split) { html += '<td></td>'; continue; }
        const best = bestAction(all);
        let diffClass = '';
        if(diffMode && currentPreset!=='basic') {
          const basicNonSplit = DATA['basic'].hard[String(hardTotal)]?.[u] || {};
          const basicActs = DATA['basic'].pair[p]?.[u] || {};
          const basicAll = {...basicNonSplit, ...basicActs};
          if(bestAction(basicAll) !== best) diffClass = ' cell-diff';
        }
        html += '<td class="cell cell-' + cellClass(best) + diffClass + '">'
          + '<span class="action-label">' + actionLabel(best) + '</span>'
          + '<span class="ev-value ' + evClass(all[best]) + '">' + all[best].toFixed(3) + '</span>'
          + '</td>';
      }
      html += '</tr>';
    }
  }
  html += '</tbody></table>';
  div.innerHTML = html;
}

// 预设切换
const tabsDiv = document.getElementById('presetTabs');
for(const [key, info] of Object.entries(PRESETS)) {
  const btn = document.createElement('button');
  btn.className = 'preset-tab' + (key===currentPreset?' active':'');
  btn.textContent = info.name;
  btn.onclick = () => {
    currentPreset = key;
    document.querySelectorAll('.preset-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    render();
  };
  tabsDiv.appendChild(btn);
}

// 模式切换
document.querySelectorAll('.mode-tab').forEach(btn => {
  btn.onclick = () => {
    currentMode = btn.dataset.mode;
    document.querySelectorAll('.mode-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    render();
  };
});

// 对比模式切换
document.getElementById('diffToggle').onclick = function() {
  diffMode = !diffMode;
  this.classList.toggle('active', diffMode);
  this.textContent = diffMode ? '🔍 对比中 (点击关闭)' : '🔍 对比基准 (差异高亮)';
  render();
};

render();
</script>
</body>
</html>`;

fs.writeFileSync(path.resolve(__dirname, '..', '..', 'ev-viewer.html'), html);
console.log('✅ 已生成: ev-viewer.html');
console.log('   路径: ' + path.resolve(__dirname, '..', '..', 'ev-viewer.html'));
