import { create } from 'zustand';
import { Action, AnswerRecord, Scenario, StrategyResult } from '@/types';
import { generateScenario } from '@/engine/scenario';
import { getOptimalAction, rulesLabel } from '@/engine/strategy';
import { generateExplanation } from '@/engine/explanation';
import { rankValue } from '@/engine/card';
import { useSettingsStore } from './settingsStore';
import { useHistoryStore } from './historyStore';
import { db } from '@/db';

interface GameState {
  scenario: Scenario | null;
  answerRecord: AnswerRecord | null;
  isLoading: boolean;
  showFeedback: boolean;
  isCorrect: boolean | null;
  consecutiveCorrect: number;
  totalInSession: number;
  correctInSession: number;

  generateNewScenario: () => void;
  submitAction: (action: Action) => void;
  nextScenario: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  scenario: null,
  answerRecord: null,
  isLoading: false,
  showFeedback: false,
  isCorrect: null,
  consecutiveCorrect: 0,
  totalInSession: 0,
  correctInSession: 0,

  generateNewScenario: () => {
    const rules = useSettingsStore.getState().rules;
    const history = useHistoryStore.getState().records;
    const typeHistory = history.slice(-50).map(r => ({
      handType: r.handType,
      isCorrect: r.isCorrect,
    }));
    const scenario = generateScenario(rules, typeHistory);

    set({
      scenario,
      answerRecord: null,
      showFeedback: false,
      isCorrect: null,
      isLoading: false,
    });
  },

  submitAction: async (action: Action) => {
    const { scenario, consecutiveCorrect, totalInSession, correctInSession } = get();
    const rules = useSettingsStore.getState().rules;
    if (!scenario) return;

    const dealerUpValue = rankValue(scenario.dealerUpCard.rank);
    const result: StrategyResult = getOptimalAction(
      scenario.playerHand,
      dealerUpValue,
      rules
    );

    const userEv = result.evMap[action] ?? 0;
    const correctAction = result.correctAction ?? action;
    const correctEv = result.evMap[correctAction] ?? 0;
    const isCorrect = action === correctAction;
    const evDiff = Math.abs(correctEv - userEv);
    const explanation = generateExplanation(scenario.playerHand, dealerUpValue, correctAction);

    const answerRecord: AnswerRecord = {
      scenario,
      userAction: action,
      isCorrect,
      userEv,
      correctAction,
      correctEv,
      evDiff,
      explanation,
      timestamp: Date.now(),
    };

    const newConsecutive = isCorrect ? consecutiveCorrect + 1 : 0;

    set({
      answerRecord,
      showFeedback: true,
      isCorrect,
      consecutiveCorrect: newConsecutive,
      totalInSession: totalInSession + 1,
      correctInSession: correctInSession + (isCorrect ? 1 : 0),
    });

    // Save to IndexedDB
    try {
      await db.records.add({
        dealerUp: `${scenario.dealerUpCard.rank}${scenario.dealerUpCard.suit}`,
        playerHand: scenario.playerHand.cards.map(c => `${c.rank}${c.suit}`).join(' '),
        handType: scenario.playerHand.type,
        correctAction,
        correctEv,
        userAction: action,
        userEv,
        isCorrect,
        evDiff,
        explanation,
        createdAt: new Date(),
        rulesLabel: rulesLabel(rules),
      });
    } catch (err) {
      console.error('Failed to save record:', err);
    }
  },

  nextScenario: () => {
    get().generateNewScenario();
  },
}));
