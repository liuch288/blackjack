import { Action, Hand } from '@/types';

// ====== 爆牌概率计算 ======

/** 玩家要牌爆牌概率（无限牌靴） */
export function getPlayerBustProb(hand: Hand): number {
  // 软手要牌不会爆（A 可从 11 变 1）
  if (hand.type === 'Soft') return 0;
  // 低于 12 不会爆
  if (hand.total < 12) return 0;
  // >= 21 已经爆了
  if (hand.total >= 21) return 1;
  // 会爆的牌张数 / 13（每张牌等概率）
  const bustCount = (hand.total - 8); // e.g. 12→4张(10/J/Q/K), 16→8张(6-K)
  return Math.min(bustCount, 12) / 13;
}

/** 庄家爆牌概率（无限牌靴，S17/H17） */
export function getDealerBustProb(upCard: number, s17: boolean): number {
  // 基于无限牌靴模型的近似值
  const bustProbsS17: Record<number, number> = {
    1: 0.116,  // A
    2: 0.354,
    3: 0.374,
    4: 0.395,
    5: 0.417,
    6: 0.422,
    7: 0.262,
    8: 0.245,
    9: 0.229,
    10: 0.214,
  };
  const bustProbsH17: Record<number, number> = {
    1: 0.131,  // H17 on soft 17, slightly higher bust rate
    2: 0.354,
    3: 0.374,
    4: 0.395,
    5: 0.417,
    6: 0.423,  // H17: dealer hits soft 17 vs 6
    7: 0.262,
    8: 0.245,
    9: 0.229,
    10: 0.214,
  };
  const v = upCard === 1 ? 1 : Math.min(upCard, 10);
  return s17 ? bustProbsS17[v] : bustProbsH17[v];
}

interface ExplanationTemplate {
  condition: (hand: Hand, dealerUp: number, correctAction: Action) => boolean;
  text: (hand: Hand, dealerUpValue: number) => string;
}

function dealerUpLabel(v: number): string {
  if (v === 1) return 'A';
  if (v > 10) return '10';
  return String(v);
}

function handTotalLabel(hand: Hand): string {
  if (hand.type === 'Soft') {
    const nonAceCards = hand.cards.filter(c => !c.isAce);
    const nonAceTotal = nonAceCards.reduce((s, c) => s + c.value, 0);
    return `软 ${hand.total}（A+${nonAceTotal}）`;
  }
  if (hand.type === 'Pair') {
    return `对子 ${hand.cards[0].rank}${hand.cards[1].rank}（合计 ${hand.total}）`;
  }
  return `硬 ${hand.total}`;
}

function isStrongDealer(v: number): boolean {
  return v >= 7 || v === 1;
}

function isWeakDealer(v: number): boolean {
  return v >= 2 && v <= 6;
}

const TEMPLATES: ExplanationTemplate[] = [
  // Hard hands: Stand against weak dealer
  {
    condition: (h, d, c) => h.type === 'Hard' && h.total >= 12 && h.total <= 16 && isWeakDealer(d) && c === 'Stand',
    text: (h, d) => {
      const playerBust = Math.round(getPlayerBustProb(h) * 100);
      const dealerBust = Math.round(getDealerBustProb(d, true) * 100);
      return `你是 ${handTotalLabel(h)}，庄家明牌是 ${dealerUpLabel(d)}。` +
        `庄家 ${dealerUpLabel(d)} 爆牌概率高达 ${dealerBust}%，是弱牌。` +
        `而你要牌有 ${playerBust}% 的概率爆牌——` +
        `风险远高于让庄家自己爆，所以你应该停牌。`;
    },
  },
  // Hard hands: Hit against strong dealer
  {
    condition: (h, d, c) => h.type === 'Hard' && h.total >= 12 && h.total <= 16 && isStrongDealer(d) && c === 'Hit',
    text: (h, d) => {
      const playerBust = Math.round(getPlayerBustProb(h) * 100);
      const dealerBust = Math.round(getDealerBustProb(d, true) * 100);
      return `你是 ${handTotalLabel(h)}，庄家明牌是强牌 ${dealerUpLabel(d)}（爆牌概率仅 ${dealerBust}%）。` +
        `停牌几乎必输，虽然要牌有 ${playerBust}% 概率爆牌，` +
        `但这是"两害相权取其轻"——不拿牌等死，拿牌还有翻盘机会。`;
    },
  },
  // Hard 12 vs 2/3
  {
    condition: (h, d, c) => h.type === 'Hard' && h.total === 12 && (d === 2 || d === 3) && c === 'Hit',
    text: (h, d) => {
      const playerBust = Math.round(getPlayerBustProb(h) * 100);
      const dealerBust = Math.round(getDealerBustProb(d, true) * 100);
      return `你是硬 12，庄家 ${dealerUpLabel(d)}（爆牌率 ${dealerBust}%）。` +
        `硬 12 要牌爆牌风险 ${playerBust}%，两者 EV 差距很小。` +
        `但庄家 2/3 不像 4-6 那么弱，所以要牌改善手牌略优。`;
    },
  },
  // Hard 8 and below
  {
    condition: (h, d, c) => h.type === 'Hard' && h.total <= 8 && c === 'Hit',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，庄家 ${dealerUpLabel(d)}。` +
      `你点数很低，要牌绝对不会爆（最多拿到 21），所以一定要继续要牌来改善手牌。停牌则几乎不可能赢。`,
  },
  // Hard 11: Double
  {
    condition: (h, d, c) => h.type === 'Hard' && h.total === 11 && c === 'Double',
    text: (h, d) => {
      const weak = isWeakDealer(d);
      return `你是硬 11——这是最强的手牌之一。` +
        (weak
          ? `庄家 ${dealerUpLabel(d)} 是弱牌，爆牌概率高，你加倍可以最大化收益。`
          : `即使庄家 ${dealerUpLabel(d)} 也不差，你拿 10 点牌就能到 21，加倍期望收益最高。`);
    },
  },
  // Hard 10: Double vs 2-9
  {
    condition: (h, d, c) => h.type === 'Hard' && h.total === 10 && c === 'Double',
    text: (h, d) =>
      `你是硬 10，庄家 ${dealerUpLabel(d)}。硬 10 加倍是基本策略中的强打法，` +
      `因为你抽到 10/J/Q/K/A（合计超 50% 概率）可以到 20 或 21，` +
      `此时庄家 ${dealerUpLabel(d)} 相对不利，加倍可以放大收益。`,
  },
  // Hard 9: Double vs 3-6
  {
    condition: (h, d, c) => h.type === 'Hard' && h.total === 9 && c === 'Double',
    text: (h, d) =>
      `你是硬 9，庄家 ${dealerUpLabel(d)} 是弱牌。` +
      `你拿 10 点牌的概率很高（约 38%），到 19 足以对抗庄家弱牌。加倍可以在对庄家有利时最大化利润。`,
  },
  // Hard 17+: Stand
  {
    condition: (h, d, c) => h.type === 'Hard' && h.total >= 17 && c === 'Stand',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，要牌爆牌风险极高（${Math.round(getPlayerBustProb(h) * 100)}%），` +
      `即使庄家 ${dealerUpLabel(d)} 很强，也应该停牌等庄家自己成牌或爆牌。`,
  },
  // Soft 13-17: Double vs weak dealer
  {
    condition: (h, d, c) => h.type === 'Soft' && h.total >= 13 && h.total <= 17 && isWeakDealer(d) && c === 'Double',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，庄家 ${dealerUpLabel(d)} 是弱牌。` +
      `软牌的特性是你可以放心要牌而不会爆（A可以从11变1），所以加倍可以最大化收益。` +
      `即使抽到不太理想的牌，你仍可以通过软牌特性继续改善。`,
  },
  // Soft 18 vs 9-10-A
  {
    condition: (h, d, c) => h.type === 'Soft' && h.total === 18 && isStrongDealer(d) && c === 'Hit',
    text: (h, d) =>
      `你是软 18（A+7），庄家 ${dealerUpLabel(d)} 很强。` +
      `软 18 虽然看着不错，但面对庄家强牌 9/10/A 并不占优。` +
      `要牌不会爆（软牌特性），你有可能抽到小牌改善成软 19-21，或维持不爆。所以应该要牌。`,
  },
  // Soft 18 vs 2-6
  {
    condition: (h, d, c) => h.type === 'Soft' && h.total === 18 && isWeakDealer(d) && c === 'Double',
    text: (h, d) =>
      `你是软 18（A+7），庄家 ${dealerUpLabel(d)} 是弱牌。` +
      `面对庄家弱牌，软 18 加倍是最优选择，可以最大化收益。因为软牌不会爆，` +
      `且庄家弱牌爆牌率高，你的期望收益很高。`,
  },
  // Soft 19+
  {
    condition: (h, d, c) => h.type === 'Soft' && h.total >= 19 && c === 'Stand',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，已经是很好的手牌。` +
      `软 19 以上停牌是最优策略——手牌已经够强，不需要再冒险要牌。`,
  },
  // Pair AA: always split
  {
    condition: (h, d, c) => h.type === 'Pair' && h.cards[0].isAce && c === 'Split',
    text: (h, d) =>
      `你有一对 A！ 对子 A 合计只能算 2 或 12，都是较差的手牌。` +
      `但分开后每手牌以 A（11 点）为起点，可以轻松改善成强手牌。A 分牌是基本策略中最重要的操作之一。`,
  },
  // Pair 88: always split
  {
    condition: (h, d, c) => h.type === 'Pair' && h.total === 16 && h.cards[0].rank === '8' && c === 'Split',
    text: (h, d) =>
      `你有一对 8，合计 16 是 Blackjack 中最差的手牌之一。` +
      (isStrongDealer(d)
        ? `面对庄家强牌 ${dealerUpLabel(d)}，16 停牌几乎必输，要牌也容易爆。分牌后每手 8 可以期待改善，整体期望远高于不分的任何操作。`
        : `即使庄家 ${dealerUpLabel(d)} 不算强，16 也非常脆弱。分牌后可以改善为更好的手牌。`) +
      `"永远分 8"是基本策略中最著名的规则。`,
  },
  // Pair 99 vs 7
  {
    condition: (h, d, c) => h.type === 'Pair' && h.cards[0].rank === '9' && d === 7 && c === 'Stand',
    text: (h, d) =>
      `你有一对 9，合计 18 面对庄家 7。` +
      `18 对抗庄家 7 已经占优，庄家 7 下面很可能是 17（约 37%），此时你 18 胜出。` +
      `所以应该停牌保持这手已占优的手牌，而不是冒险分开。`,
  },
  // Pair 99 vs 2-6
  {
    condition: (h, d, c) => h.type === 'Pair' && h.cards[0].rank === '9' && isWeakDealer(d) && c === 'Split',
    text: (h, d) =>
      `你有一对 9，合计 18 面对庄家弱牌 ${dealerUpLabel(d)}。` +
      `庄家 ${dealerUpLabel(d)} 爆牌概率高，分牌后每手 9 可以改善（拿 10 到 19，拿 A 到 20），` +
      `加倍赢面——分牌比停牌更有利。`,
  },
  // Pair 10,10: always stand
  {
    condition: (h, d, c) => h.type === 'Pair' && h.cards[0].isTen && h.cards[1].isTen && c === 'Stand',
    text: (h, d) =>
      `你有一对 10 值牌（合计 20），这是极好的手牌！` +
      `20 是对抗任何庄家牌的最大优势手牌之一。分开会破坏这种优势，` +
      `所以绝不分开 10 值对子，直接停牌等赢。`,
  },
  // Surrender
  {
    condition: (_h, _d, c) => c === 'Surrender',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，庄家 ${dealerUpLabel(d)}。` +
      `这种情况下你的期望亏损超过投入的一半，投降可以止损——只输一半赌注（EV = -0.50），` +
      `而继续打可能输得更多。这是基本策略中的防守性操作。`,
  },
  // Default: Double when available
  {
    condition: (_h, _d, c) => c === 'Double',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，庄家 ${dealerUpLabel(d)}。` +
      `当前情况下加倍的期望收益最高，因为你处在优势地位。加倍只在首两张牌时可用，` +
      `虽然只能再拿一张牌，但潜在收益翻倍，值得冒险。`,
  },
  // Default: Stand
  {
    condition: (_h, _d, c) => c === 'Stand',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，庄家 ${dealerUpLabel(d)}。` +
      `当前情况下停牌是最优选择。要么庄家容易爆牌，要么你的手牌已经足够好不需要冒险。`,
  },
  // Default: Hit
  {
    condition: (_h, _d, c) => c === 'Hit',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，庄家 ${dealerUpLabel(d)}。` +
      `当前情况下要牌是最优选择。你的手牌需要改善才能对抗庄家，或者目前点数太低必须拿牌。`,
  },
  // Default: Split
  {
    condition: (_h, _d, c) => c === 'Split',
    text: (h, d) =>
      `你是 ${handTotalLabel(h)}，庄家 ${dealerUpLabel(d)}。` +
      `分牌可以将一手差牌变成两手有潜力的牌。当前场景下，分牌的总体期望高于不分牌的任何操作。`,
  },
];

export function generateExplanation(
  hand: Hand,
  dealerUpValue: number,
  correctAction: Action,
): string {
  for (const template of TEMPLATES) {
    if (template.condition(hand, dealerUpValue, correctAction)) {
      return template.text(hand, dealerUpValue);
    }
  }
  return `你是 ${handTotalLabel(hand)}，庄家明牌是 ${dealerUpLabel(dealerUpValue)}。根据基本策略表，${actionLabel(correctAction)} 是当前规则下期望值最高的操作。`;
}

export function actionLabel(action: Action): string {
  const map: Record<Action, string> = {
    Hit: '要牌 (Hit)',
    Stand: '停牌 (Stand)',
    Double: '加倍 (Double)',
    Split: '分牌 (Split)',
    Surrender: '投降 (Surrender)',
  };
  return map[action] || action;
}

export function actionShortLabel(action: Action): string {
  const map: Record<Action, string> = {
    Hit: '要牌',
    Stand: '停牌',
    Double: '加倍',
    Split: '分牌',
    Surrender: '投降',
  };
  return map[action] || action;
}

export function evColorClass(ev: number): string {
  if (ev > 0) return 'text-green-400';
  if (ev < -0.3) return 'text-red-400';
  return 'text-yellow-400';
}
