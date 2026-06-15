import { Action } from '@/types';
import { actionShortLabel } from '@/engine/explanation';

interface Props {
  availableActions: Action[];
  disabled: boolean;
  onAction: (action: Action) => void;
}

const ACTION_CONFIG: Record<Action, { key: string; className: string; tooltip: string }> = {
  Hit: { key: 'H', className: 'btn-hit', tooltip: '要牌（拿一张新牌）' },
  Stand: { key: 'S', className: 'btn-stand', tooltip: '停牌（保持当前手牌）' },
  Double: { key: 'D', className: 'btn-double', tooltip: '加倍（赌注翻倍，只拿一张牌）' },
  Split: { key: 'P', className: 'btn-split', tooltip: '分牌（将一对牌分两手下注）' },
  Surrender: { key: 'R', className: 'btn-surrender', tooltip: '投降（放弃本局，损失一半赌注）' },
};

const ALL_ACTIONS: Action[] = ['Hit', 'Stand', 'Double', 'Split', 'Surrender'];

export function DecisionPanel({ availableActions, disabled, onAction }: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {ALL_ACTIONS.map(action => {
        const config = ACTION_CONFIG[action];
        const isAvailable = availableActions.includes(action);

        return (
          <button
            key={action}
            className={`btn-action ${config.className} relative group`}
            disabled={disabled || !isAvailable}
            onClick={() => onAction(action)}
            title={isAvailable ? `${config.tooltip} [${config.key}]` : '当前场景不可用'}
          >
            <span className="block text-base sm:text-lg">{actionShortLabel(action)}</span>
            <span className="block text-xs opacity-80 mt-0.5">({config.key})</span>

            {!isAvailable && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white
                text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100
                transition-opacity pointer-events-none z-10">
                当前场景不可用
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
