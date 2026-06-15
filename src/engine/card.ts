import { Card, Rank, Suit } from '@/types';

const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

export function rankValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank);
}

export function createCard(rank: Rank, suit: Suit): Card {
  const value = rankValue(rank);
  return {
    suit,
    rank,
    value,
    altValue: rank === 'A' ? 11 : undefined,
    isAce: rank === 'A',
    isTen: value === 10,
  };
}

export function randomCard(): Card {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return createCard(rank, suit);
}

export function randomRank(): Rank {
  return RANKS[Math.floor(Math.random() * RANKS.length)];
}

export function cardLabel(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function isRed(card: Card): boolean {
  return card.suit === '♥' || card.suit === '♦';
}
