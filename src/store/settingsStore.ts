import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_RULES, GameRules, PRESETS } from '@/types';

interface SettingsState {
  rules: GameRules;
  activePresetId: string | null;
  isCustom: boolean;

  setPreset: (presetId: string) => void;
  updateRules: (partial: Partial<GameRules>) => void;
  resetToDefault: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      rules: { ...DEFAULT_RULES },
      activePresetId: 'basic',
      isCustom: false,

      setPreset: (presetId: string) => {
        const preset = PRESETS.find(p => p.id === presetId);
        if (!preset) return;
        set({
          rules: { ...preset.rules },
          activePresetId: presetId,
          isCustom: false,
        });
      },

      updateRules: (partial: Partial<GameRules>) => {
        const current = get().rules;
        const newRules = { ...current, ...partial };
        // Check if new rules match any preset
        const matchedPreset = PRESETS.find(p =>
          p.rules.deckCount === newRules.deckCount &&
          p.rules.dealerStandSoft17 === newRules.dealerStandSoft17 &&
          p.rules.surrender === newRules.surrender &&
          p.rules.doubleRule === newRules.doubleRule &&
          p.rules.doubleAfterSplit === newRules.doubleAfterSplit &&
          p.rules.resplit === newRules.resplit
        );
        set({
          rules: newRules,
          activePresetId: matchedPreset ? matchedPreset.id : null,
          isCustom: !matchedPreset,
        });
      },

      resetToDefault: () => {
        set({
          rules: { ...DEFAULT_RULES },
          activePresetId: 'basic',
          isCustom: false,
        });
      },
    }),
    {
      name: 'blackjack-settings',
      partialize: (state) => ({
        rules: state.rules,
        activePresetId: state.activePresetId,
        isCustom: state.isCustom,
      }),
    }
  )
);
