import { Action, GameRules, Hand, HandType, PRESETS, StrategyResult } from '@/types';
import evData from '@/data/ev-table.json';

type EvTable = {
  hard: Record<string, Record<string, Record<string, number>>>;
  soft: Record<string, Record<string, Record<string, number>>>;
  pair: Record<string, Record<string, Record<string, number>>>;
};

const table = evData as EvTable;

/** Normalize rank to table key: J/Q/K → '10' */
function rankToTableKey(rank: string): string {
  if (['J', 'Q', 'K'].includes(rank)) return '10';
  return rank;
}

export function getEv(
  handType: HandType,
  handKey: string,
  dealerUp: string,
): Record<string, number> {
  if (handType === 'Hard') {
    return table.hard?.[handKey]?.[dealerUp] ?? {};
  }
  if (handType === 'Soft') {
    return table.soft?.[handKey]?.[dealerUp] ?? {};
  }
  // Pair: return split EVs only
  return table.pair?.[handKey]?.[dealerUp] ?? {};
}

function getAllPossibleActions(
  handType: HandType,
  handKey: string,
  dealerUp: string,
  hand: Hand,
  rules: GameRules,
): Record<string, number> {
  const evs: Record<string, number> = {};

  let data: Record<string, number> | undefined;
  let hardData: Record<string, number> | undefined;

  if (handType === 'Pair') {
    data = table.pair?.[handKey]?.[dealerUp];
    // For non-split actions on pairs, use hard table (convert pair key to hard total)
    const hardKey = String(hand.total);
    hardData = table.hard?.[hardKey]?.[dealerUp];
  } else if (handType === 'Soft') {
    data = table.soft?.[handKey]?.[dealerUp];
    // Soft → hard fallback for Stand/Surrender
    hardData = table.hard?.[handKey]?.[dealerUp];
  } else {
    data = table.hard?.[handKey]?.[dealerUp];
  }

  if (!data && !hardData) return {};

  // Hit
  if (data?.Hit !== undefined) evs.Hit = data.Hit;
  else if (hardData?.Hit !== undefined) evs.Hit = hardData.Hit;

  // Stand
  if (data?.Stand !== undefined) evs.Stand = data.Stand;
  else if (hardData?.Stand !== undefined) evs.Stand = hardData.Stand;

  // Double: check rules
  const doubleEv = data?.Double ?? hardData?.Double;
  if (doubleEv !== undefined && hand.canDouble) {
    const canDoubleByRule =
      rules.doubleRule === 'any' ||
      (rules.doubleRule === '9-11' && hand.total >= 9 && hand.total <= 11) ||
      (rules.doubleRule === '10-11' && hand.total >= 10 && hand.total <= 11);
    if (canDoubleByRule) evs.Double = doubleEv;
  }

  // Split: only from pair table
  if (handType === 'Pair' && data?.Split !== undefined) {
    evs.Split = data.Split;
  }

  // Surrender: check rules
  const surrEv = data?.Surrender ?? hardData?.Surrender;
  if (surrEv !== undefined && hand.canSurrender) {
    const canSurrender =
      rules.surrender === 'ls' ||
      (rules.surrender === 'no-ace' && dealerUp !== 'A');
    if (canSurrender) evs.Surrender = surrEv;
  }

  return evs;
}

export function getOptimalAction(
  hand: Hand,
  dealerUpValue: number,
  rules: GameRules,
): StrategyResult {
  const dealerUpKey = dealerUpValue === 1 ? 'A' : String(Math.min(dealerUpValue, 10));
  let handKey: string;

  if (hand.type === 'Pair') {
    const rank0 = rankToTableKey(hand.cards[0].rank);
    const rank1 = rankToTableKey(hand.cards[1].rank);
    if (rank0 === rank1) {
      handKey = `${rank0},${rank1}`;
    } else {
      handKey = String(hand.total);
    }
  } else {
    handKey = String(hand.total);
  }

  const evs = getAllPossibleActions(hand.type, handKey, dealerUpKey, hand, rules);

  if (Object.keys(evs).length === 0) {
    return {
      correctAction: null,
      evMap: {},
      handType: hand.type,
    };
  }

  let bestAction: Action | null = null;
  let bestEv = -Infinity;
  for (const [action, ev] of Object.entries(evs)) {
    if (ev > bestEv) {
      bestEv = ev;
      bestAction = action as Action;
    }
  }

  return {
    correctAction: bestAction,
    evMap: evs as Partial<Record<Action, number>>,
    handType: hand.type,
  };
}

export function getAvailableActions(
  hand: Hand,
  dealerUpValue: number,
  rules: GameRules,
): Action[] {
  const result = getOptimalAction(hand, dealerUpValue, rules);
  return Object.keys(result.evMap).filter(k => result.evMap[k as Action] !== undefined) as Action[];
}

export function getAllEvsFlat(
  hand: Hand,
  dealerUpValue: number,
): Record<string, number> {
  const dealerUpKey = dealerUpValue === 1 ? 'A' : String(Math.min(dealerUpValue, 10));
  let handKey: string;

  if (hand.type === 'Pair') {
    handKey = `${rankToTableKey(hand.cards[0].rank)},${rankToTableKey(hand.cards[1].rank)}`;
  } else {
    handKey = String(hand.total);
  }

  if (hand.type === 'Hard') {
    return table.hard?.[handKey]?.[dealerUpKey] ?? {};
  }
  if (hand.type === 'Soft') {
    return table.soft?.[handKey]?.[dealerUpKey] ?? {};
  }
  return table.pair?.[handKey]?.[dealerUpKey] ?? {};
}

export function getPresetLabel(presetId: string): string {
  const preset = PRESETS.find(p => p.id === presetId);
  return preset ? `${preset.name} (${preset.desc})` : '自定义';
}

export function rulesLabel(rules: GameRules): string {
  const parts: string[] = [];
  parts.push(`${rules.deckCount}D`);
  parts.push(rules.dealerStandSoft17 ? 'S17' : 'H17');
  if (rules.surrender === 'ls') parts.push('LS');
  else if (rules.surrender === 'no-ace') parts.push('LS(NoA)');
  if (rules.doubleAfterSplit) parts.push('DAS');
  else parts.push('nDAS');
  if (rules.doubleRule !== 'any') parts.push(`${rules.doubleRule}`);
  return parts.join(', ');
}
