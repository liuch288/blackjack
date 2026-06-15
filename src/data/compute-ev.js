/**
 * Blackjack EV 计算器 — 无限牌靴模型动态规划精确计算
 * 模型: 庄家已 Peek 无 BJ，S17
 * 与 Wizard of Odds Appendix 1 逐项对比
 *
 * 算法: 递归 DP + 记忆化，无随机抽样，结果为模型精确期望值
 * 用法: node src/data/compute-ev.cjs
 */
const fs = require('fs');
const path = require('path');

// ==================== 基础概率 ====================
// 原始概率 (A=1, 10=10/J/Q/K)
const RAW = {
  1: 1/13, 2: 1/13, 3: 1/13, 4: 1/13, 5: 1/13,
  6: 1/13, 7: 1/13, 8: 1/13, 9: 1/13, 10: 4/13,
};

// 条件概率（庄家 Peek 无 BJ 后）
// - 庄 A: 底牌不能是 10 → 9 种可能牌各 1/9
// - 庄 10: 底牌不能是 A → 9 种可能牌，其中 10 概率 = 3/12 = 1/4... 
//   等等，无 BJ 条件后: P(10|10up) = (4/13 * 3/12?)。无限牌靴简化:
//   10 排除了 A 1/13, 剩余 12/13, 其中 10 占 4/13 → 4/12... 
// - 庄 2-9: 无条件（BJ 不可能）

function condProbs(dealerUp) {
  if (dealerUp === 1) {
    // A up, condition on NO 10 hole card
    const noBJ = 1 - 4/13; // P(no BJ) = 9/13
    const p = {};
    for (const [cv, raw] of Object.entries(RAW)) {
      p[parseInt(cv)] = cv === '10' ? 0 : raw / noBJ;
    }
    return p;
  }
  if (dealerUp === 10) {
    // 10 up, condition on NO A hole card
    const noBJ = 1 - 1/13; // P(no BJ) = 12/13
    const p = {};
    for (const [cv, raw] of Object.entries(RAW)) {
      p[parseInt(cv)] = cv === '1' ? 0 : raw / noBJ;
    }
    return p;
  }
  // 2-9: unconditional
  const p = {};
  for (const [cv, raw] of Object.entries(RAW)) p[parseInt(cv)] = raw;
  return p;
}

// ==================== 庄家分布 (S17, 已 peeks 无 BJ) ====================

// Phase 2 分布：从已有两张牌后，用 RAW 概率抽牌
const dealerDrawMemo = {};

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
    let newTotal = total + card;
    let newSoft = soft;
    if (card === 1 && total < 11 && !soft) {
      newTotal = total + 11;
      newSoft = true;
    }
    const sub = dealerDraw(newTotal, newSoft);
    for (const [k, v] of Object.entries(sub)) {
      dist[k] += v * p;
    }
  }
  return (dealerDrawMemo[key] = dist);
}

// Phase 1: upCard + 条件底牌 → 初始两张牌，然后用 RAW 继续
const dealerMap = {};

function makeDist(obj) {
  return {
    bust: obj.bust || 0, 17: obj[17] || 0, 18: obj[18] || 0,
    19: obj[19] || 0, 20: obj[20] || 0, 21: obj[21] || 0
  };
}

for (const up of [1,2,3,4,5,6,7,8,9,10]) {
  const upVal = up === 1 ? 11 : up;
  const upSoft = up === 1;
  const holeProbs = condProbs(up); // 条件底牌分布
  const dist = makeDist({});

  for (const [cv, p] of Object.entries(holeProbs)) {
    const holeVal = parseInt(cv);
    let total = upVal + holeVal;
    let soft = upSoft || (holeVal === 1);

    if (holeVal === 1 && upVal + 11 <= 21 && !upSoft) {
      total = upVal + 11;
      soft = true;
    }

    // 从两张牌开始，用 RAW 概率继续抽牌
    const sub = dealerDraw(total, soft);
    for (const [k, v] of Object.entries(sub)) {
      dist[k] += v * p;
    }
  }

  dealerMap[up] = dist;
}

// 验证
console.log('\n🏠 庄家分布 (已 Peek 无 BJ, S17):');
for (const up of [1,2,3,4,5,6,7,8,9,10]) {
  const d = dealerMap[up];
  const sum = d.bust + d[17] + d[18] + d[19] + d[20] + d[21];
  const lbl = up === 1 ? 'A' : String(up);
  console.log(`   庄${lbl}: BUST=${(d.bust*100).toFixed(1)}%  17=${(d[17]*100).toFixed(1)}%  18=${(d[18]*100).toFixed(1)}%  19=${(d[19]*100).toFixed(1)}%  20=${(d[20]*100).toFixed(1)}%  21=${(d[21]*100).toFixed(1)}%  Σ=${sum.toFixed(6)}`);
}

// ==================== 玩家 EV ====================

// 抽牌概率：玩家抽牌也是从"无限牌靴 + 已知庄家牌"中抽
// 简化：玩家抽牌用 RAW 概率（无限牌靴假设牌无限多，不影响）
// 实际上这会有微小偏差，但 Wizard of Odds Appendix 1 也是如此

function standEV(playerTotal, dealerUp) {
  if (playerTotal > 21) return -1;
  const dd = dealerMap[dealerUp];
  let ev = 0;
  for (const [outcome, p] of Object.entries(dd)) {
    if (outcome === 'bust') {
      ev += p * 1;
    } else {
      const dt = parseInt(outcome);
      if (playerTotal > dt)      ev += p * 1;
      else if (playerTotal < dt) ev += p * -1;
      // push: ev += 0
    }
  }
  return ev;
}

const playerMemo = {};

function hitEV(playerTotal, playerSoft, dealerUp) {
  const key = `H:${playerTotal},${playerSoft},${dealerUp}`;
  if (playerMemo[key] !== undefined) return playerMemo[key];

  if (playerTotal > 21) {
    if (playerSoft) return hitEV(playerTotal - 10, false, dealerUp);
    return (playerMemo[key] = -1);
  }

  let ev = 0;
  for (const [cv, p] of Object.entries(RAW)) {
    const card = parseInt(cv);
    let newTotal, newSoft;

    if (card === 1) {
      if (playerTotal + 11 <= 21 && !playerSoft) {
        newTotal = playerTotal + 11; newSoft = true;
      } else {
        newTotal = playerTotal + 1; newSoft = playerSoft;
      }
    } else {
      newTotal = playerTotal + card; newSoft = playerSoft;
    }
    if (newTotal > 21 && newSoft) { newTotal -= 10; newSoft = false; }

    ev += p * Math.max(standEV(newTotal, dealerUp), hitEV(newTotal, newSoft, dealerUp));
  }
  return (playerMemo[key] = ev);
}

function doubleEV(playerTotal, playerSoft, dealerUp) {
  if (playerTotal > 21) {
    if (playerSoft) return doubleEV(playerTotal - 10, false, dealerUp);
    return -2;
  }
  let ev = 0;
  for (const [cv, p] of Object.entries(RAW)) {
    const card = parseInt(cv);
    let newTotal, newSoft;
    if (card === 1) {
      if (playerTotal + 11 <= 21 && !playerSoft) {
        newTotal = playerTotal + 11; newSoft = true;
      } else {
        newTotal = playerTotal + 1; newSoft = playerSoft;
      }
    } else {
      newTotal = playerTotal + card; newSoft = playerSoft;
    }
    if (newTotal > 21 && newSoft) { newTotal -= 10; newSoft = false; }
    ev += p * standEV(newTotal, dealerUp) * 2;
  }
  return ev;
}

// maxSplits: 总计可分的次数（默认 3 = 最多 4 手）
function splitEV(cardVal, dealerUp, maxSplits = 3) {
  if (cardVal === 1) {
    let single = 0;
    for (const [cv, p] of Object.entries(RAW)) {
      single += p * standEV(11 + parseInt(cv), dealerUp);
    }
    return single * 2;
  }

  // 单手的期望
  function singleHandEV(remainingSplits) {
    let ev = 0;
    for (const [cv, p] of Object.entries(RAW)) {
      const card = parseInt(cv);
      let total, soft;

      if (card === 1 && cardVal + 11 <= 21) {
        total = cardVal + 11;
        soft = true;
      } else {
        total = cardVal + card;
        soft = false;
      }
      if (total > 21 && soft) { total -= 10; soft = false; }

      let best = Math.max(
        standEV(total, dealerUp),
        hitEV(total, soft, dealerUp),
        doubleEV(total, soft, dealerUp)
      );

      // 再分：如果抽到同样牌面且还有再分次数
      if (card === cardVal && remainingSplits > 0) {
        const resplitSingle = singleHandEV(remainingSplits - 1);
        best = Math.max(best, resplitSingle);
      }

      ev += p * best;
    }
    return ev;
  }

  return singleHandEV(maxSplits) * 2;
}

// ==================== 生成 & 对比 ====================
function r4(v) { return Math.round(v * 10000) / 10000; }
const UPCARDS = [2,3,4,5,6,7,8,9,10,1];
function lbl(c) { return c === 1 ? 'A' : String(c); }

// Hard
const hardResult = {};
for (let t = 4; t <= 21; t++) {
  hardResult[String(t)] = {};
  for (const d of UPCARDS) {
    hardResult[String(t)][lbl(d)] = {
      Hit: r4(hitEV(t, false, d)), Stand: r4(standEV(t, d)), Double: r4(doubleEV(t, false, d))
    };
  }
}
// Soft
const softResult = {};
for (let st = 13; st <= 20; st++) {
  softResult[String(st)] = {};
  for (const d of UPCARDS) {
    softResult[String(st)][lbl(d)] = {
      Hit: r4(hitEV(st, true, d)), Double: r4(doubleEV(st, true, d))
    };
  }
}
// Pair
const PAIRS = ['2,2','3,3','4,4','5,5','6,6','7,7','8,8','9,9','10,10','A,A'];
const PVALS  = [2,3,4,5,6,7,8,9,10,1];
const pairResult = {};
for (let i = 0; i < PAIRS.length; i++) {
  pairResult[PAIRS[i]] = {};
  for (const d of UPCARDS) {
    pairResult[PAIRS[i]][lbl(d)] = { Split: r4(splitEV(PVALS[i], d)) };
  }
}

// 对比
const existing = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'ev-table.json'), 'utf-8'));
let diffs = [], ok = 0, total = 0;
const MAX_OK = 0.003;

function cmp(label, a, b) {
  total++;
  const diff = Math.abs(a - b);
  if (diff <= MAX_OK) { ok++; return; }
  diffs.push({ type: diff < 0.01 ? 'warn' : 'error', label, computed: a, existing: b, diff });
}

for (const h of Object.keys(hardResult)) {
  for (const d of UPCARDS) {
    const dl = lbl(d);
    ['Hit','Stand','Double'].forEach(act => {
      const c = hardResult[h]?.[dl]?.[act], e = existing.hard[h]?.[dl]?.[act];
      if (c !== undefined && e !== undefined) cmp(`H${h} vs ${dl} ${act}`, c, e);
    });
  }
}
for (const s of Object.keys(softResult)) {
  for (const d of UPCARDS) {
    const dl = lbl(d);
    ['Hit','Double'].forEach(act => {
      const c = softResult[s]?.[dl]?.[act], e = existing.soft[s]?.[dl]?.[act];
      if (c !== undefined && e !== undefined) cmp(`S${s} vs ${dl} ${act}`, c, e);
    });
  }
}
for (let i = 0; i < PAIRS.length; i++) {
  for (const d of UPCARDS) {
    const dl = lbl(d);
    const c = pairResult[PAIRS[i]]?.[dl]?.Split, e = existing.pair[PAIRS[i]]?.[dl]?.Split;
    if (c !== undefined && e !== undefined) cmp(`P${PAIRS[i]} vs ${dl}`, c, e);
  }
}

// 输出
console.log('\n' + '='.repeat(60));
console.log('  自算 EV vs Wizard of Odds Appendix 1');
console.log(`  规则: 无限牌靴, S17, 庄家 Peek 无 BJ`);
console.log('='.repeat(60));
console.log(`\n📊 对比: ${total} 项  |  匹配(≤${MAX_OK}): ${ok}  |  偏差: ${diffs.length}`);
const errs = diffs.filter(d=>d.type==='error');
console.log(`   ⚠️ 小偏差 (<0.01): ${diffs.length - errs.length}  |  ❌ 较大偏差: ${errs.length}`);

if (diffs.length > 0) {
  console.log(`\n   偏差列表 (前 25, 最差优先):`);
  diffs.sort((a,b) => b.diff - a.diff).slice(0,25).forEach(d => {
    const icon = d.type==='error'?'❌':'⚠️';
    console.log(`   ${icon} ${d.label}  自算=${d.computed.toFixed(4)}  附录=${d.existing.toFixed(4)}  差=${d.diff.toFixed(4)}`);
  });
}

fs.writeFileSync(path.resolve(__dirname, 'ev-computed.json'), JSON.stringify({ hard: hardResult, soft: softResult, pair: pairResult }, null, 2));

if (errs.length === 0) console.log('\n🎉 高度一致！');
else { console.log(`\n⚠️  ${errs.length} 个较大偏差`); process.exit(1); }
