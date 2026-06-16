import { RefObject } from 'react';
import { Action } from '@/types';
import { actionShortLabel } from '@/engine/explanation';
import { GlassPanel } from './GlassPanel';

interface Props {
  availableActions: Action[];
  disabled: boolean;
  onAction: (action: Action) => void;
  mouseContainer: RefObject<HTMLDivElement | null>;
}

const ACTION_CONFIG: Record<Action, {
  key: string;
  tint: string;
  ring: string;
  tooltip: string;
  shortLabel: string;
}> = {
  Hit:        { key: 'H', tint: 'from-blue-500/40 to-blue-600/30',   ring: 'ring-blue-400/40',   tooltip: '要牌（拿一张新牌）',         shortLabel: '要牌' },
  Stand:      { key: 'S', tint: 'from-green-500/40 to-emerald-600/30', ring: 'ring-green-400/40',  tooltip: '停牌（保持当前手牌）',       shortLabel: '停牌' },
  Double:     { key: 'D', tint: 'from-amber-500/40 to-orange-600/30', ring: 'ring-amber-400/40',  tooltip: '加倍（赌注翻倍，只拿一张牌）', shortLabel: '加倍' },
  Split:      { key: 'P', tint: 'from-purple-500/40 to-fuchsia-600/30', ring: 'ring-purple-400/40', tooltip: '分牌（将一对牌分两手下注）', shortLabel: '分牌' },
  Surrender:  { key: 'R', tint: 'from-slate-500/30 to-gray-600/20', ring: 'ring-slate-400/30',  tooltip: '投降（放弃本局，损失一半赌注）', shortLabel: '投降' },
};

const ALL_ACTIONS: Action[] = ['Hit', 'Stand', 'Double', 'Split', 'Surrender'];

export function DecisionPanel({ availableActions, disabled, onAction, mouseContainer }: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center w-full max-w-2xl">
      {ALL_ACTIONS.map(action => {
        const config = ACTION_CONFIG[action];
        const isAvailable = availableActions.includes(action);
        const isDisabled = disabled || !isAvailable;

        return (
          <div
            key={action}
            className="relative group"
            style={{ width: 96, height: 84 }}
            title={isAvailable ? `${config.tooltip} [${config.key}]` : '当前场景不可用'}
          >
            <GlassPanel
              variant={isAvailable ? 'normal' : 'subtle'}
              cornerRadius={18}
              mouseContainer={mouseContainer}
              style={{ width: 96, height: 84 }}
            >
              <button
                disabled={isDisabled}
                onClick={() => onAction(action)}
                className={`btn-glass-action ${isDisabled ? 'btn-glass-disabled' : ''}
                  bg-gradient-to-br ${config.tint} rounded-[18px]`}
              >
                <span className="text-base sm:text-lg font-bold">{config.shortLabel}</span>
                <span className="text-xs opacity-80 mt-0.5 font-mono">({config.key})</span>
              </button>
            </GlassPanel>

            {!isAvailable && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 glass-surface-strong
                text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                当前场景不可用
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
