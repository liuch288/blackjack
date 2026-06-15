import { Action, Card, DEFAULT_RULES, GameRules, Hand, Scenario } from '@/types';
import { createCard, randomRank, rankValue } from './card';
import { computeHand } from './hand';
import { getOptimalAction } from './strategy';

// 按真实概率加权的场景生成器

type ScenarioPool = {
  type: 'Hard' | 'Soft' | 'Pair';
  ranks: string[];
  weight: number;
}[];

const HARD_SCENARIOS: { ranks: string[]; weight: number }[] = [
  { ranks: ['2', '3'], weight: 8 },   // 5
  { ranks: ['2', '4'], weight: 8 },   // 6
  { ranks: ['3', '4'], weight: 8 },   // 7
  { ranks: ['2', '6'], weight: 8 },   // 8
  { ranks: ['3', '6'], weight: 8 },   // 9
  { ranks: ['4', '6'], weight: 8 },   // 10
  { ranks: ['5', '6'], weight: 8 },   // 11
  { ranks: ['6', '6'], weight: 8 },   // 12
  { ranks: ['7', '6'], weight: 8 },   // 13
  { ranks: ['8', '6'], weight: 8 },   // 14
  { ranks: ['9', '6'], weight: 8 },   // 15
  { ranks: ['10', '6'], weight: 12 }, // 16 - common bust threshold
  // For hard totals 12-16, also generate with 10-value cards
  { ranks: ['10', '2'], weight: 12 },  // 12
  { ranks: ['10', '3'], weight: 12 },  // 13
  { ranks: ['10', '4'], weight: 12 },  // 14
  { ranks: ['10', '5'], weight: 10 },  // 15
  { ranks: ['10', '6'], weight: 10 },  // 16
  { ranks: ['10', '7'], weight: 8 },   // 17
  { ranks: ['9', '2'], weight: 6 },    // 11
  { ranks: ['8', '3'], weight: 6 },    // 11
  { ranks: ['7', '4'], weight: 6 },    // 11
];

const SOFT_SCENARIOS: { ranks: string[]; weight: number }[] = [
  { ranks: ['A', '2'], weight: 3 },   // A2 (13)
  { ranks: ['A', '3'], weight: 3 },   // A3 (14)
  { ranks: ['A', '4'], weight: 3 },   // A4 (15)
  { ranks: ['A', '5'], weight: 3 },   // A5 (16)
  { ranks: ['A', '6'], weight: 3 },   // A6 (17)
  { ranks: ['A', '7'], weight: 3 },   // A7 (18)
  { ranks: ['A', '8'], weight: 2 },   // A8 (19)
  { ranks: ['A', '9'], weight: 2 },   // A9 (20)
];

const PAIR_SCENARIOS: { ranks: string[]; weight: number }[] = [
  { ranks: ['A', 'A'], weight: 3 },
  { ranks: ['2', '2'], weight: 3 },
  { ranks: ['3', '3'], weight: 3 },
  { ranks: ['4', '4'], weight: 3 },
  { ranks: ['5', '5'], weight: 3 },
  { ranks: ['6', '6'], weight: 3 },
  { ranks: ['7', '7'], weight: 3 },
  { ranks: ['8', '8'], weight: 3 },
  { ranks: ['9', '9'], weight: 3 },
  { ranks: ['10', '10'], weight: 4 },
  { ranks: ['J', 'J'], weight: 2 },
  { ranks: ['Q', 'Q'], weight: 2 },
  { ranks: ['K', 'K'], weight: 2 },
];

function weightedRandom(weight: number): boolean {
  return Math.random() < weight;
}

export function generateScenario(rules: GameRules, history?: { handType: string; isCorrect: boolean }[]): Scenario {
  // 如果有历史记录，对易错类型增加权重
  let hardWeight = 0.4;
  let softWeight = 0.3;
  let pairWeight = 0.3;

  if (history && history.length > 0) {
    const hardTotal = history.filter(h => h.handType === 'Hard').length;
    const softTotal = history.filter(h => h.handType === 'Soft').length;
    const pairTotal = history.filter(h => h.handType === 'Pair').length;
    const hardWrong = history.filter(h => h.handType === 'Hard' && !h.isCorrect).length;
    const softWrong = history.filter(h => h.handType === 'Soft' && !h.isCorrect).length;
    const pairWrong = history.filter(h => h.handType === 'Pair' && !h.isCorrect).length;

    const hardRate = hardTotal > 0 ? hardWrong / hardTotal : 0.5;
    const softRate = softTotal > 0 ? softWrong / softTotal : 0.5;
    const pairRate = pairTotal > 0 ? pairWrong / pairTotal : 0.5;

    const avgRate = (hardRate + softRate + pairRate) / 3 || 0.5;
    hardWeight = 0.4 + (hardRate - avgRate) * 0.5;
    softWeight = 0.3 + (softRate - avgRate) * 0.5;
    pairWeight = 0.3 + (pairRate - avgRate) * 0.5;

    const totalW = hardWeight + softWeight + pairWeight;
    hardWeight /= totalW;
    softWeight /= totalW;
    pairWeight /= totalW;
  }

  const r = Math.random();
  let handType: 'Hard' | 'Soft' | 'Pair';
  let pool: { ranks: string[]; weight: number }[];

  if (r < hardWeight) {
    handType = 'Hard';
    pool = HARD_SCENARIOS;
  } else if (r < hardWeight + softWeight) {
    handType = 'Soft';
    pool = SOFT_SCENARIOS;
  } else {
    handType = 'Pair';
    pool = PAIR_SCENARIOS;
  }

  // 加权采样
  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * totalWeight;
  let chosen = pool[0];
  for (const p of pool) {
    roll -= p.weight;
    if (roll <= 0) {
      chosen = p;
      break;
    }
  }

  const suits: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
  const playerCards: Card[] = chosen.ranks.map(r => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return createCard(r as any, suit);
  });

  // Dealer up card - random rank 2-A (weighted by probability: 10 is 4x)
  const dealerRank = randomRank();
  const dealerSuit = suits[Math.floor(Math.random() * suits.length)];
  const dealerCard = createCard(dealerRank, dealerSuit);

  const hand = computeHand(playerCards);
  const dealerUpValue = rankValue(dealerRank);

  // 需要确保场景有至少一个有效决策
  const result = getOptimalAction(hand, dealerUpValue, rules);
  const availableActions = Object.keys(result.evMap).filter(
    k => result.evMap[k as Action] !== undefined
  ) as Action[];

  // 如果没有有效操作，重新生成
  if (availableActions.length === 0) {
    return generateScenario(rules, history);
  }

  return {
    dealerUpCard: dealerCard,
    playerHand: hand,
    availableActions,
  };
}
