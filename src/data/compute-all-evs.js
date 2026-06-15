/**
 * Blackjack EV 多规则计算器 — 动态规划精确计算
 * 一次性生成所有 6 套预设的 EV 数据
 *
 * 用法: node src/data/compute-all-evs.cjs
 *
 * 算法: 无限牌靴模型下，对庄家分布、玩家 Hit/Stand/Double/Split 做递归 DP
 *       （记忆化搜索），无随机抽样，结果为该模型的精确期望值。
 *
 * 所有预设均为 S17 → 庄家分布相同，Hit/Stand 基础 EV 相同
 * 差异在于：投降/DAS/加倍限制/再分牌
 */
const fs = require('fs');
const path = require('path');

// ==================== 基础概率（复用） ====================
const RAW = {
  1: 1/13, 2: 1/13, 3: 1/13, 4: 1/13, 5: 1/13,
  6: 1/13, 7: 1/13, 8: 1/13, 9: 1/13, 10: 4/13,
};

function condProbs(dealerUp) {
  if (dealerUp === 1) { const p = {}; for (const [cv, raw] of Object.entries(RAW)) p[parseInt(cv)] = cv === '10' ? 0 : raw / (9/13); return p; }
  if (dealerUp === 10) { const p = {}; for (const [cv, raw] of Object.entries(RAW)) p[parseInt(cv)] = cv === '1' ? 0 : raw / (12/13); return p; }
  const p = {}; for (const [cv, raw] of Object.entries(RAW)) p[parseInt(cv)] = raw; return p;
}

// ==================== 庄家分布 S17 ====================
const dealerDrawMemo = {};
function makeDist(obj) { return { bust: obj.bust || 0, 17: obj[17] || 0, 18: obj[18] || 0, 19: obj[19] || 0, 20: obj[20] || 0, 21: obj[21] || 0 }; }

function dealerDraw(total, soft) {
  const key = `${total},${soft}`;
  if (dealerDrawMemo[key]) return dealerDrawMemo[key];
  if (total >= 17) {
    if (total > 21) {
      if (soft) return dealerDraw(total - 10, false);
      return (dealerDrawMemo[key] = makeDist({ bust: 1 }));
    }
    return (dealerDrawMemo[key] = makeDist({ [total]: 1 }));
  }
  const dist = makeDist({});
  for (const [cv, p] of Object.entries(RAW)) {
    const card = parseInt(cv);
    let newTotal = total + card, newSoft = soft;
    if (card === 1 && total < 11 && !soft) { newTotal = total + 11; newSoft = true; }
    const sub = dealerDraw(newTotal, newSoft);
    for (const [k, v] of Object.entries(sub)) dist[k] += v * p;
  }
  return (dealerDrawMemo[key] = dist);
}

const dealerMap = {};
for (const up of [1,2,3,4,5,6,7,8,9,10]) {
  const total = up === 1 ? 11 : up, soft = up === 1;
  const holeProbs = condProbs(up), dist = makeDist({});
  for (const [cv, p] of Object.entries(holeProbs)) {
    const holeVal = parseInt(cv);
    let t = total + holeVal, s = soft || (holeVal === 1);
    if (holeVal === 1 && total + 11 <= 21 && !soft) { t = total + 11; s = true; }
    const sub = dealerDraw(t, s);
    for (const [k, v] of Object.entries(sub)) dist[k] += v * p;
  }
  dealerMap[up] = dist;
}

// ==================== 玩家基础 EV ====================
function standEV(pt, du) {
  if (pt > 21) return -1;
  const dd = dealerMap[du]; let ev = 0;
  for (const [o, p] of Object.entries(dd)) {
    if (o === 'bust') ev += p * 1;
    else if (!(o === '21' && pt === 21)) {
      const dt = parseInt(o);
      ev += pt > dt ? p : pt < dt ? -p : 0;
    }
  }
  return ev;
}

const playerMemo = {};
function hitEV(pt, soft, du) {
  const key = `H:${pt},${soft},${du}`;
  if (playerMemo[key] !== undefined) return playerMemo[key];
  if (pt > 21) { if (soft) return hitEV(pt - 10, false, du); return (playerMemo[key] = -1); }
  let ev = 0;
  for (const [cv, p] of Object.entries(RAW)) {
    const card = parseInt(cv); let nt, ns;
    if (card === 1) {
      if (pt + 11 <= 21 && !soft) { nt = pt + 11; ns = true; }
      else { nt = pt + 1; ns = soft; }
    } else { nt = pt + card; ns = soft; }
    if (nt > 21 && ns) { nt -= 10; ns = false; }
    ev += p * Math.max(standEV(nt, du), hitEV(nt, ns, du));
  }
  return (playerMemo[key] = ev);
}

function doubleEV(pt, soft, du) {
  if (pt > 21) { if (soft) return doubleEV(pt - 10, false, du); return -2; }
  let ev = 0;
  for (const [cv, p] of Object.entries(RAW)) {
    const card = parseInt(cv); let nt, ns;
    if (card === 1) {
      if (pt + 11 <= 21 && !soft) { nt = pt + 11; ns = true; }
      else { nt = pt + 1; ns = soft; }
    } else { nt = pt + card; ns = soft; }
    if (nt > 21 && ns) { nt -= 10; ns = false; }
    ev += p * standEV(nt, du) * 2;
  }
  return ev;
}

// ==================== 规则参数化 Split EV ====================
function calcSplitEV(cardVal, du, { das, resplits }) {
  if (cardVal === 1) { let s = 0; for (const [cv, p] of Object.entries(RAW)) s += p * standEV(11 + parseInt(cv), du); return s * 2; }

  function singleEV(remaining) {
    let ev = 0;
    for (const [cv, p] of Object.entries(RAW)) {
      const card = parseInt(cv); let total, soft;
      if (card === 1 && cardVal + 11 <= 21) { total = cardVal + 11; soft = true; }
      else { total = cardVal + card; soft = false; }
      if (total > 21 && soft) { total -= 10; soft = false; }

      let best = Math.max(standEV(total, du), hitEV(total, soft, du));
      if (das) best = Math.max(best, doubleEV(total, soft, du));
      if (card === cardVal && remaining > 0) best = Math.max(best, singleEV(remaining - 1));
      ev += p * best;
    }
    return ev;
  }
  return singleEV(resplits) * 2;
}

// ==================== 生成全量 EV 表 ====================
function r4(v) { return Math.round(v * 10000) / 10000; }
const UPCARDS = [2,3,4,5,6,7,8,9,10,1];
function lbl(c) { return c === 1 ? 'A' : String(c); }
const PAIRS = ['2,2','3,3','4,4','5,5','6,6','7,7','8,8','9,9','10,10','A,A'];
const PVALS = [2,3,4,5,6,7,8,9,10,1];

// 预计算基础值（不随规则变的）
const baseHard = {}, baseSoft = {};
for (let t = 4; t <= 21; t++) {
  baseHard[String(t)] = {};
  for (const d of UPCARDS) {
    baseHard[String(t)][lbl(d)] = {
      Hit: r4(hitEV(t, false, d)), Stand: r4(standEV(t, d)),
      Double: r4(doubleEV(t, false, d)),
    };
  }
}
for (let st = 13; st <= 20; st++) {
  baseSoft[String(st)] = {};
  for (const d of UPCARDS) {
    baseSoft[String(st)][lbl(d)] = {
      Hit: r4(hitEV(st, true, d)), Double: r4(doubleEV(st, true, d)),
    };
  }
}

// 预设定义
const PRESETS = {
  basic:     { name: '基础训练',       desc: '6D, S17, DAS, LS, 最多3次分牌',              surrender: true,  das: true,  doubleRule: 'any',  resplits: 3 },
  vegas:     { name: '拉斯维加斯标准', desc: '6D, S17, DAS, LS, 最多3次分牌',              surrender: true,  das: true,  doubleRule: 'any',  resplits: 3 },
  atlantic:  { name: '大西洋城',       desc: '8D, S17, DAS, LS, 最多3次分牌',              surrender: true,  das: true,  doubleRule: 'any',  resplits: 3 },
  macau:     { name: '澳门标准',       desc: '6D, S17, DAS, 无投降, 最多3次分牌',          surrender: false, das: true,  doubleRule: 'any',  resplits: 3 },
  europe:    { name: '欧洲规则',       desc: '6D, S17, nDAS, 9-11加倍, 无投降, 无再分牌',  surrender: false, das: false, doubleRule: '9-11', resplits: 0 },
  doubledeck:{ name: '双副桌面',       desc: '2D, S17, DAS, LS, 最多3次分牌',              surrender: true,  das: true,  doubleRule: 'any',  resplits: 3 },
};

function canDouble(total, soft, rule) {
  if (rule === 'any') return true;
  if (rule === '9-11') {
    const t = soft ? total : total; // 软手也算总点数
    return t >= 9 && t <= 11;
  }
  if (rule === '10-11') {
    const t = soft ? total : total;
    return t === 10 || t === 11;
  }
  return true;
}

function generateTables(rules) {
  const hard = {}, soft = {}, pair = {};

  // Hard — 从基础值裁剪
  for (const h of Object.keys(baseHard)) {
    hard[h] = {};
    const hi = parseInt(h);
    for (const d of UPCARDS) {
      const dl = lbl(d);
      const entry = { ...baseHard[h][dl] };
      // 投降
      if (rules.surrender && hi >= 15 && hi <= 17) entry.Surrender = -0.5;
      // 加倍限制
      if (!canDouble(hi, false, rules.doubleRule) || hi >= 17) delete entry.Double;
      // 硬手可用的 Double 仅在首两张
      if (hi <= 16 && rules.doubleRule !== 'any') {
        // 检测并移除不适用的情况（实际上 hitEV 已按 full 计算，这里保留 Double 仅当规则允许）
        if (!canDouble(hi, false, rules.doubleRule)) delete entry.Double;
      }
      hard[h][dl] = entry;
    }
  }

  // Soft
  for (const s of Object.keys(baseSoft)) {
    soft[s] = {};
    const si = parseInt(s);
    for (const d of UPCARDS) {
      const dl = lbl(d);
      const entry = { ...baseSoft[s][dl] };
      if (rules.surrender && si >= 15 && si <= 17) entry.Surrender = -0.5;
      if (!canDouble(si, true, rules.doubleRule)) delete entry.Double;
      soft[s][dl] = entry;
    }
  }

  // Pairs — 计算
  for (let i = 0; i < PAIRS.length; i++) {
    pair[PAIRS[i]] = {};
    const cv = PVALS[i];
    for (const d of UPCARDS) {
      const dl = lbl(d);
      pair[PAIRS[i]][dl] = {
        Split: r4(calcSplitEV(cv, d, { das: rules.das, resplits: rules.resplits })),
      };
    }
  }

  return { hard, soft, pair };
}

// ==================== 生成 6 套并保存 ====================
const dataDir = path.resolve(__dirname);
const outputFiles = {};

for (const [key, rules] of Object.entries(PRESETS)) {
  const tables = generateTables(rules);
  const outPath = path.join(dataDir, `ev-${key}.json`);
  const metadata = {
    _meta: {
      source: '自算 — 无限牌靴模型动态规划精确计算',
      model: '无限牌靴, S17, Peek无BJ',
      rules: rules,
      computed: new Date().toISOString(),
    },
    ...tables,
  };
  fs.writeFileSync(outPath, JSON.stringify(metadata, null, 2));
  outputFiles[key] = { name: rules.name, path: outPath, size: (JSON.stringify(metadata).length / 1024).toFixed(1) + 'KB' };
  console.log(`  ✅ ${rules.name}: ev-${key}.json`);
}

// ==================== 汇总 ====================
console.log('\n📊 生成的 EV 数据文件:');
let totalSize = 0;
for (const [key, info] of Object.entries(outputFiles)) {
  console.log(`   ${info.name.padEnd(14)} → ev-${key}.json  (${info.size})`);
}
console.log(`\n   🎉 所有 ${Object.keys(PRESETS).length} 套预设 EV 表已生成`);
