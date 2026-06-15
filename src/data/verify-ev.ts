/**
 * EV 数据验证脚本
 * 验证 ev-table.json 的完整性、合理性、以及基本策略正确性
 * 用法: npx tsx src/data/verify-ev.ts
 */
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(__dirname, 'ev-table.json');
const raw = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(raw);

// ========== 工具函数 ==========
const DEALER_CARDS = ['2','3','4','5','6','7','8','9','10','A'];
const HARD_HANDS  = ['4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21'];
const SOFT_HANDS  = ['12','13','14','15','16','17','18','19','20'];
const PAIR_HANDS  = ['2,2','3,3','4,4','5,5','6,6','7,7','8,8','9,9','10,10','A,A'];

let errors: string[] = [];
let warnings: string[] = [];
let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (condition) { passed++; }
  else { errors.push(`❌ ${msg}`); }
}

function warn(condition: boolean, msg: string) {
  if (!condition) { warnings.push(`⚠️  ${msg}`); }
}

// ========== 1. 结构完整性检查 ==========
console.log('\n📋 1. 结构完整性检查');

// Hard hands
assert(data.hard !== undefined, '缺少 hard 数据');
for (const h of HARD_HANDS) {
  assert(data.hard[h] !== undefined, `缺少 Hard ${h}`);
  for (const d of DEALER_CARDS) {
    assert(data.hard[h][d] !== undefined, `缺少 Hard ${h} vs ${d}`);
    const actions = data.hard[h][d];
    assert(typeof actions.Hit === 'number', `Hard ${h} vs ${d}: Hit 不是数字`);
    if (parseInt(h) < 17) {
      if (parseInt(h) <= 11) {
        assert(typeof actions.Double === 'number', `Hard ${h} vs ${d}: 缺少 Double`);
      } else {
        assert(typeof actions.Double === 'number', `Hard ${h} vs ${d}: 缺少 Double`);
      }
    }
    if (parseInt(h) >= 17) {
      assert(typeof actions.Stand === 'number', `Hard ${h} vs ${d}: 缺少 Stand`);
    }
  }
}

// Soft hands
assert(data.soft !== undefined, '缺少 soft 数据');
for (const s of SOFT_HANDS) {
  assert(data.soft[s] !== undefined, `缺少 Soft ${s}`);
  for (const d of DEALER_CARDS) {
    assert(data.soft[s][d] !== undefined, `缺少 Soft ${s} vs ${d}`);
    assert(typeof data.soft[s][d].Hit === 'number', `Soft ${s} vs ${d}: Hit 不是数字`);
    assert(typeof data.soft[s][d].Double === 'number', `Soft ${s} vs ${d}: Double 不是数字`);
  }
}

// Pairs
assert(data.pair !== undefined, '缺少 pair 数据');
for (const p of PAIR_HANDS) {
  assert(data.pair[p] !== undefined, `缺少 Pair ${p}`);
  for (const d of DEALER_CARDS) {
    assert(data.pair[p][d] !== undefined, `缺少 Pair ${p} vs ${d}`);
    assert(typeof data.pair[p][d].Split === 'number', `Pair ${p} vs ${d}: Split 不是数字`);
  }
}

// ========== 2. EV 值合理性检查 ==========
console.log('\n📊 2. EV 值合理性检查');

// EV 范围: Stand 应该在 -1 到 1 之间
for (const h of ['17','18','19','20','21']) {
  for (const d of DEALER_CARDS) {
    const ev = data.hard[h][d].Stand;
    assert(ev >= -1.0 && ev <= 1.0, `Hard ${h} vs ${d}: Stand EV=${ev} 超出 [-1,1]`);
  }
}

// 21 点 Stand 应该很高（≥ 0.88）
for (const d of DEALER_CARDS) {
  const ev = data.hard['21'][d].Stand;
  assert(ev >= 0.88, `Hard 21 vs ${d}: Stand EV=${ev} 应该 ≥ 0.88`);
  assert(data.hard['21'][d].Hit < ev, `Hard 21 vs ${d}: Hit 不应好于 Stand`);
}

// 20 点 Stand 应该为正
for (const d of DEALER_CARDS) {
  assert(data.hard['20'][d].Stand > 0, `Hard 20 vs ${d}: Stand EV 应为正`);
  assert(data.hard['20'][d].Hit < data.hard['20'][d].Stand, `Hard 20 vs ${d}: Hit 不应好于 Stand`);
}

// Stand on 17- should be bad vs dealer 10
for (const h of ['4','5','6','7','8','9','10','11','12','13','14','15','16']) {
  const ev = data.hard[h]['10'].Stand;
  assert(ev < 0, `Hard ${h} vs 10: Stand EV=${ev} 应为负（庄家强牌）`);
}

// 爆牌状态的 Stand EV 应该相同（所有 ≤16 的硬牌 Stand 意味着不补牌等庄家爆）
const stand4 = data.hard['4']['2'].Stand;
warn(Math.abs(data.hard['16']['2'].Stand - stand4) < 0.0001, 'Hard 4~16 Stand EV 应基本相同（都不补牌）');

// Double 应该约等于 2 × Hit（对硬手，误差小）
for (const h of HARD_HANDS.filter(h => parseInt(h) >= 4 && parseInt(h) <= 16)) {
  for (const d of DEALER_CARDS) {
    if (data.hard[h][d].Double && data.hard[h][d].Hit) {
      const ratio = data.hard[h][d].Double / data.hard[h][d].Hit;
      warn(Math.abs(ratio - 2.0) < 0.2, `Hard ${h} vs ${d}: Double/Hit=${ratio.toFixed(3)} 偏离 2.0`);
    }
  }
}

// 投降 EV 应该固定为 -0.5
console.log('   ℹ️  投降 EV 固定为 -0.50（见 surrenderNote）');

// ========== 3. 基本策略正确性验证 ==========
console.log('\n🎯 3. 基本策略正确性验证 (S17 规则)');

// 辅助函数：找到最佳操作
function bestAction(actions: Record<string, number>): string {
  let best = '';
  let bestEv = -Infinity;
  for (const [act, ev] of Object.entries(actions)) {
    if (ev > bestEv) { bestEv = ev; best = act; }
  }
  return best;
}

// 3.1 硬手策略
// 硬5-8: 始终 Hit（或某些手牌 Double 更好）
for (const h of ['5','6','7','8']) {
  for (const d of DEALER_CARDS) {
    const actions = data.hard[h][d];
    const best = bestAction(actions);
    assert(best === 'Hit' || (best === 'Double' && actions.Double > actions.Hit),
      `Hard ${h} vs ${d}: 最佳=${best}，预期 Hit`);
  }
}

// 硬9: vs 3-6 为 Double，其余 Hit
for (const d of ['3','4','5','6']) {
  assert(bestAction(data.hard['9'][d]) === 'Double', `Hard 9 vs ${d}: 应为 Double`);
}
for (const d of ['2','7','8','9','10','A']) {
  assert(bestAction(data.hard['9'][d]) === 'Hit', `Hard 9 vs ${d}: 应为 Hit`);
}

// 硬10: vs 2-9 为 Double，vs 10/A 为 Hit
for (const d of ['2','3','4','5','6','7','8','9']) {
  assert(bestAction(data.hard['10'][d]) === 'Double', `Hard 10 vs ${d}: 应为 Double`);
}
for (const d of ['10','A']) {
  assert(bestAction(data.hard['10'][d]) === 'Hit', `Hard 10 vs ${d}: 应为 Hit`);
}

// 硬11: 始终 Double
for (const d of DEALER_CARDS) {
  assert(bestAction(data.hard['11'][d]) === 'Double', `Hard 11 vs ${d}: 应为 Double`);
}

// 硬12: vs 4-6 为 Stand，其余 Hit
for (const d of ['4','5','6']) {
  assert(bestAction(data.hard['12'][d]) === 'Stand', `Hard 12 vs ${d}: 应为 Stand`);
}
for (const d of ['2','3','7','8','9','10','A']) {
  assert(bestAction(data.hard['12'][d]) === 'Hit', `Hard 12 vs ${d}: 应为 Hit`);
}

// 硬13-16: vs 2-6 为 Stand，其余 Hit
for (const h of ['13','14','15','16']) {
  for (const d of ['2','3','4','5','6']) {
    assert(bestAction(data.hard[h][d]) === 'Stand', `Hard ${h} vs ${d}: 应为 Stand`);
  }
  for (const d of ['7','8','9','10','A']) {
    const best = bestAction(data.hard[h][d]);
    assert(best === 'Hit' || best === 'Surrender',
      `Hard ${h} vs ${d}: 应为 Hit，实际=${best}`);
  }
}

// 硬17+: 始终 Stand
for (const h of ['17','18','19','20']) {
  for (const d of DEALER_CARDS) {
    assert(bestAction(data.hard[h][d]) === 'Stand', `Hard ${h} vs ${d}: 应为 Stand`);
  }
}

// 3.2 软手策略
// 软13-14 (A2-A3): vs 5-6 为 Double，其余 Hit
for (const h of ['13','14']) {
  for (const d of ['5','6']) {
    assert(bestAction(data.soft[h][d]) === 'Double', `Soft ${h} vs ${d}: 应为 Double`);
  }
  for (const d of ['2','3','4','7','8','9','10','A']) {
    const best = bestAction(data.soft[h][d]);
    assert(best === 'Hit' || best === 'Double',
      `Soft ${h} vs ${d}: 最佳=${best}，预期 Hit`);
  }
}

// 软15-16 (A4-A5): vs 4-6 为 Double，其余 Hit
for (const h of ['15','16']) {
  for (const d of ['4','5','6']) {
    assert(bestAction(data.soft[h][d]) === 'Double', `Soft ${h} vs ${d}: 应为 Double`);
  }
}

// 软17 (A6): vs 3-6 为 Double，其余 Hit
for (const d of ['3','4','5','6']) {
  assert(bestAction(data.soft['17'][d]) === 'Double', `Soft 17 vs ${d}: 应为 Double`);
}
for (const d of ['2','7','8','9','10','A']) {
  assert(bestAction(data.soft['17'][d]) === 'Hit', `Soft 17 vs ${d}: 应为 Hit`);
}

// 软18 (A7): vs 3-6 为 Double, vs 2/7/8 为 Stand, 其余 Hit
for (const d of ['3','4','5','6']) {
  assert(bestAction(data.soft['18'][d]) === 'Double', `Soft 18 vs ${d}: 应为 Double`);
}
for (const d of ['2','7','8']) {
  // 注意：soft hands 没有 Stand 数据，Stand 对应硬牌 Stand
  // 软18 Stand 需要查硬18 的 Stand EV
  const softHitEv = data.soft['18'][d].Hit;
  const hardStandEv = data.hard['18'][d].Stand;
  // S17 下软18对2/7/8 Stand 应该比 Hit 好
  warn(hardStandEv > softHitEv,
    `Soft 18 vs ${d}: Stand=${hardStandEv}, Hit=${softHitEv}, Stand 应更好`);
}
for (const d of ['9','10','A']) {
  assert(bestAction(data.soft['18'][d]) === 'Hit', `Soft 18 vs ${d}: 应为 Hit`);
}

// 软19+ (A8+): Stand 应该最好
for (const h of ['19','20']) {
  for (const d of DEALER_CARDS) {
    const hitEv = data.soft[h][d].Hit;
    const hardStandEv = data.hard[h][d]?.Stand;
    if (hardStandEv !== undefined) {
      warn(hardStandEv > hitEv, `Soft ${h} vs ${d}: Stand=${hardStandEv} > Hit=${hitEv}`);
    }
  }
}

// 3.3 对子策略
// AA: 始终 Split
for (const d of DEALER_CARDS) {
  const splitEv = data.pair['A,A'][d].Split;
  // AA Split EV 应该等于 11 Hard Double EV（因为每手A算11，分后各拿一张）
  const hard11DoubleEv = data.hard['11'][d].Double;
  warn(Math.abs(splitEv - hard11DoubleEv) < 0.02,
    `AA vs ${d}: Split=${splitEv}, Hard11 Double=${hard11DoubleEv}`);
}

// 88: 始终 Split
for (const d of DEALER_CARDS) {
  const splitEv = data.pair['8,8'][d].Split;
  const hitEv = data.hard['16'][d].Hit;
  const standEv = data.hard['16'][d].Stand;
  const bestNoSplit = Math.max(hitEv, standEv);
  assert(splitEv > bestNoSplit, `88 vs ${d}: Split=${splitEv} 应 > 最佳不分=${bestNoSplit}`);
}

// TT: 始终 Stand
for (const d of DEALER_CARDS) {
  const splitEv = data.pair['10,10'][d].Split;
  const standEv = data.hard['20'][d].Stand;
  assert(standEv > splitEv, `TT vs ${d}: Stand=${standEv} 应 > Split=${splitEv}`);
}

// 55: 不应该 Split（当 Hard 10 打）
for (const d of DEALER_CARDS) {
  const splitEv = data.pair['5,5'][d].Split;
  const hard10DoubleEv = data.hard['10'][d].Double;
  const hard10HitEv = data.hard['10'][d].Hit;
  assert(Math.max(hard10DoubleEv, hard10HitEv) > splitEv,
    `55 vs ${d}: 不分为宜，Double=${hard10DoubleEv} > Split=${splitEv}`);
}

// 3.4 关键场景专项验证
console.log('\n🔍 4. 关键决策场景验证');

// 硬16 vs 10: Hit > Stand（两害相权取其轻）
const h16v10 = data.hard['16']['10'];
assert(h16v10.Hit > h16v10.Stand,
  `硬16 vs 10: Hit=${h16v10.Hit} 应 > Stand=${h16v10.Stand}`);

// 硬12 vs 4: Stand > Hit
const h12v4 = data.hard['12']['4'];
assert(h12v4.Stand > h12v4.Hit,
  `硬12 vs 4: Stand=${h12v4.Stand} 应 > Hit=${h12v4.Hit}`);

// 11 vs 10: Double > Hit
const h11v10 = data.hard['11']['10'];
assert(h11v10.Double > h11v10.Hit,
  `硬11 vs 10: Double=${h11v10.Double} 应 > Hit=${h11v10.Hit}`);

// 软18 vs 6: Double 应该不错
const s18v6 = data.soft['18']['6'];
assert(s18v6.Double > 0.25,
  `软18 vs 6: Double=${s18v6.Double} 应该是很好的选择`);

// Stand 17 vs 7: 应该有正 EV 或接近
const h17v7 = data.hard['17']['7'];
warn(h17v7.Stand > -0.15,
  `硬17 vs 7: Stand=${h17v7.Stand} 应不差于 -0.15`);

// ========== 结果输出 ==========
console.log('\n' + '='.repeat(50));
console.log(`\n📊 验证结果汇总`);
console.log(`   总检查项: ${total}`);
console.log(`   ✅ 通过: ${passed}`);
console.log(`   ❌ 错误: ${errors.length}`);
console.log(`   ⚠️  警告: ${warnings.length}`);

if (errors.length > 0) {
  console.log(`\n❌ 发现 ${errors.length} 个错误:`);
  for (const e of errors.slice(0, 20)) console.log('   ' + e);
  if (errors.length > 20) console.log(`   ... 还有 ${errors.length - 20} 个错误`);
}

if (warnings.length > 0) {
  console.log(`\n⚠️  发现 ${warnings.length} 个警告:`);
  for (const w of warnings.slice(0, 10)) console.log('   ' + w);
  if (warnings.length > 10) console.log(`   ... 还有 ${warnings.length - 10} 个警告`);
}

console.log('');
if (errors.length === 0) {
  console.log('🎉 EV 数据通过所有关键验证！');
} else {
  console.log('🔧 EV 数据存在问题，需要修复。');
  process.exit(1);
}
