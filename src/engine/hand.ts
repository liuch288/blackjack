import { Card, Hand, HandType } from '@/types';

export function computeHand(cards: Card[]): Hand {
  if (cards.length === 0) {
    return {
      cards: [],
      total: 0,
      totals: [0],
      type: 'Hard',
      isBusted: false,
      isBlackjack: false,
      canSplit: false,
      canDouble: false,
      canSurrender: false,
    };
  }

  const totals = computeTotals(cards);
  let total = 0;
  for (const t of totals) {
    if (t <= 21 && t > total) total = t;
    else if (total === 0 && t > 21) total = t;
  }
  if (total > 21 && totals.length > 1) {
    total = Math.min(...totals);
  }

  const isBusted = total > 21;
  const isBlackjack = cards.length === 2 && total === 21;
  const type = classifyHand(cards);
  const isTwoCards = cards.length === 2;

  return {
    cards,
    total,
    totals,
    type,
    isBusted,
    isBlackjack,
    canSplit: isTwoCards && cards[0].rank === cards[1].rank,
    canDouble: isTwoCards,
    canSurrender: isTwoCards,
  };
}

function computeTotals(cards: Card[]): number[] {
  let totals: number[] = [0];
  for (const card of cards) {
    if (card.isAce) {
      const newTotals: number[] = [];
      for (const t of totals) {
        newTotals.push(t + 1);
        newTotals.push(t + 11);
      }
      totals = [...new Set(newTotals)];
    } else {
      totals = totals.map(t => t + card.value);
    }
  }
  return [...new Set(totals)].sort((a, b) => a - b);
}

function classifyHand(cards: Card[]): HandType {
  if (cards.length === 2 && cards[0].rank === cards[1].rank) {
    return 'Pair';
  }
  const hasAce = cards.some(c => c.isAce);
  if (hasAce) {
    const totals = computeTotals(cards);
    const softTotals = totals.filter(t => t <= 21 && t >= 12);
    if (softTotals.length > 0) {
      const nonAceValues = cards.filter(c => !c.isAce).reduce((s, c) => s + c.value, 0);
      if (nonAceValues <= 9) return 'Soft';
    }
  }
  return 'Hard';
}

export function handLabel(hand: Hand): string {
  const cardsStr = hand.cards.map(c => `${c.rank}${c.suit}`).join(' ');
  const typeLabel = hand.type === 'Soft' ? 'S' : hand.type === 'Pair' ? 'P' : 'H';
  return `${cardsStr} (${hand.total}, ${typeLabel})`;
}

export function handTypeLabel(type: HandType): string {
  return type === 'Soft' ? '软牌 Soft' : type === 'Pair' ? '对子 Pair' : '硬牌 Hard';
}
