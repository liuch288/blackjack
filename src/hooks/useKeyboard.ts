import { useEffect } from 'react';
import { Action } from '@/types';
import { useGameStore } from '@/store/gameStore';

export function useKeyboard() {
  const store = useGameStore;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      const state = store.getState();
      const key = e.key.toUpperCase();
      const actionMap: Record<string, Action> = {
        'H': 'Hit',
        'S': 'Stand',
        'D': 'Double',
        'P': 'Split',
        'R': 'Surrender',
      };

      if (state.showFeedback) {
        if (key === 'ENTER' || key === ' ' || key === 'N') {
          e.preventDefault();
          state.nextScenario();
        }
        return;
      }

      const action = actionMap[key];
      const availableActions = state.scenario?.availableActions ?? [];
      if (action && availableActions.includes(action)) {
        e.preventDefault();
        state.submitAction(action);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);
}
