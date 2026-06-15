import Dexie, { Table } from 'dexie';
import { PracticeRecord } from '@/types';

class BlackjackDB extends Dexie {
  records!: Table<PracticeRecord, number>;

  constructor() {
    super('blackjack_practice');
    this.version(1).stores({
      records: '++id, createdAt, isCorrect, handType, rulesLabel',
    });
  }
}

export const db = new BlackjackDB();
