import { create } from 'zustand';
import { PracticeRecord } from '@/types';
import { db } from '@/db';

interface HistoryState {
  records: PracticeRecord[];
  isLoading: boolean;
  exportFormat: 'csv' | 'json';
  filterCorrect: 'all' | 'correct' | 'wrong';
  filterType: 'all' | 'Hard' | 'Soft' | 'Pair';
  currentPage: number;
  pageSize: number;

  loadRecords: () => Promise<void>;
  clearRecords: () => Promise<void>;
  exportCSV: () => string;
  setFilter: (f: Partial<Pick<HistoryState, 'filterCorrect' | 'filterType'>>) => void;
  setPage: (page: number) => void;
  filteredRecords: () => PracticeRecord[];
  stats: () => {
    total: number;
    correct: number;
    wrong: number;
    accuracy: number;
    byType: { Hard: { total: number; correct: number }; Soft: { total: number; correct: number }; Pair: { total: number; correct: number } };
  };
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  records: [],
  isLoading: false,
  exportFormat: 'csv',
  filterCorrect: 'all',
  filterType: 'all',
  currentPage: 1,
  pageSize: 20,

  loadRecords: async () => {
    set({ isLoading: true });
    try {
      const records = await db.records.orderBy('id').reverse().toArray();
      set({ records, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearRecords: async () => {
    await db.records.clear();
    set({ records: [], currentPage: 1 });
  },

  exportCSV: () => {
    const filtered = get().filteredRecords();
    const headers = ['ID', '时间', '庄家牌', '玩家手牌', '类型', '正确操作', '正确EV', '你的选择', '你的EV', '是否正确', 'EV差距', '规则'];
    const rows = filtered.map(r => [
      r.id,
      r.createdAt.toISOString(),
      r.dealerUp,
      r.playerHand,
      r.handType,
      r.correctAction,
      r.correctEv.toFixed(3),
      r.userAction,
      r.userEv.toFixed(3),
      r.isCorrect ? '正确' : '错误',
      r.evDiff.toFixed(3),
      r.rulesLabel,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  setFilter: (f) => set(f as any),
  setPage: (page) => set({ currentPage: page }),

  filteredRecords: () => {
    const { records, filterCorrect, filterType } = get();
    return records.filter(r => {
      if (filterCorrect === 'correct' && !r.isCorrect) return false;
      if (filterCorrect === 'wrong' && r.isCorrect) return false;
      if (filterType !== 'all' && r.handType !== filterType) return false;
      return true;
    });
  },

  stats: () => {
    const records = get().records;
    const total = records.length;
    const correct = records.filter(r => r.isCorrect).length;
    const wrong = total - correct;
    const accuracy = total > 0 ? correct / total : 0;

    const byType = { Hard: { total: 0, correct: 0 }, Soft: { total: 0, correct: 0 }, Pair: { total: 0, correct: 0 } };
    for (const r of records) {
      if (byType[r.handType]) {
        byType[r.handType].total++;
        if (r.isCorrect) byType[r.handType].correct++;
      }
    }

    return { total, correct, wrong, accuracy, byType };
  },
}));
