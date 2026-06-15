// ====== 核心类型定义 ======

export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type HandType = 'Hard' | 'Soft' | 'Pair';
export type Action = 'Hit' | 'Stand' | 'Double' | 'Split' | 'Surrender';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  altValue?: number;
  isAce: boolean;
  isTen: boolean;
}

export interface Hand {
  cards: Card[];
  total: number;
  totals: number[];
  type: HandType;
  isBusted: boolean;
  isBlackjack: boolean;
  canSplit: boolean;
  canDouble: boolean;
  canSurrender: boolean;
}

export interface Scenario {
  dealerUpCard: Card;
  playerHand: Hand;
  availableActions: Action[];
}

export interface StrategyResult {
  correctAction: Action | null;
  evMap: Partial<Record<Action, number>>;
  handType: HandType;
}

export interface AnswerRecord {
  scenario: Scenario;
  userAction: Action;
  isCorrect: boolean;
  userEv: number;
  correctAction: Action;
  correctEv: number;
  evDiff: number;
  explanation: string;
  timestamp: number;
}

export interface PracticeRecord {
  id?: number;
  dealerUp: string;
  playerHand: string;
  handType: HandType;
  correctAction: Action;
  correctEv: number;
  userAction: Action;
  userEv: number;
  isCorrect: boolean;
  evDiff: number;
  explanation: string;
  createdAt: Date;
  rulesLabel: string;
}

export interface GameRules {
  deckCount: 1 | 2 | 4 | 6 | 8;
  dealerStandSoft17: boolean;
  surrender: boolean;
  doubleRule: 'any' | '9-11' | '10-11';
  doubleAfterSplit: boolean;
  resplit: boolean;
  hitSplitAces: boolean;
}

export const DEFAULT_RULES: GameRules = {
  deckCount: 6,
  dealerStandSoft17: true,
  surrender: true,
  doubleRule: 'any',
  doubleAfterSplit: true,
  resplit: true,
  hitSplitAces: true,
};

export interface PresetInfo {
  id: string;
  name: string;
  desc: string;
  rules: GameRules;
}

export const PRESETS: PresetInfo[] = [
  {
    id: 'basic',
    name: '基础训练',
    desc: '6D, S17, DAS, LS',
    rules: { ...DEFAULT_RULES },
  },
  {
    id: 'vegas',
    name: '拉斯维加斯标准',
    desc: '6D, S17, DAS, LS',
    rules: { ...DEFAULT_RULES },
  },
  {
    id: 'atlantic',
    name: '大西洋城',
    desc: '8D, S17, DAS, LS',
    rules: { ...DEFAULT_RULES, deckCount: 8 },
  },
  {
    id: 'macau',
    name: '澳门标准',
    desc: '6D, S17, DAS, 无投降',
    rules: { ...DEFAULT_RULES, surrender: false },
  },
  {
    id: 'europe',
    name: '欧洲规则',
    desc: '6D, S17, nDAS, 9-11加倍, 无投降',
    rules: {
      ...DEFAULT_RULES,
      surrender: false,
      doubleAfterSplit: false,
      doubleRule: '9-11',
      resplit: false,
    },
  },
  {
    id: 'doubledeck',
    name: '双副桌面',
    desc: '2D, S17, DAS, LS',
    rules: { ...DEFAULT_RULES, deckCount: 2 },
  },
];
