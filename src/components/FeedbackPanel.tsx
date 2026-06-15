import { AnswerRecord } from '@/types';
import { actionLabel, actionShortLabel, evColorClass, getPlayerBustProb, getDealerBustProb } from '@/engine/explanation';

interface Props {
  record: AnswerRecord;
  onNext: () => void;
}

function ProbBar({ label, prob, color }: { label: string; prob: number; color: string }) {
  const pct = Math.round(prob * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className={`font-mono font-bold ${color}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function FeedbackPanel({ record, onNext }: Props) {
  const { scenario, userAction, correctAction, userEv, correctEv, evDiff, explanation, isCorrect } = record;

  const playerBust = getPlayerBustProb(scenario.playerHand);
  const dealerBust = getDealerBustProb(
    scenario.dealerUpCard.isAce ? 1 : scenario.dealerUpCard.value >= 10 ? 10 : scenario.dealerUpCard.value,
    true // S17 by default
  );

  return (
    <div className="animate-slide-up w-full max-w-lg mx-auto">
      <div className={`rounded-2xl overflow-hidden border-2 ${isCorrect ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'}`}>
        {/* Header */}
        <div className={`px-5 py-4 ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
            <span className={`text-lg font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect
                ? '正确！'
                : `不正确 — 你的选择：${actionShortLabel(userAction)}`}
            </span>
          </div>
        </div>

        {/* EV Comparison */}
        <div className="px-5 py-4 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/50 text-xs mb-1">你的选择 EV</div>
              <div className={`text-xl font-mono font-bold ${evColorClass(userEv)}`}>
                {userEv >= 0 ? '+' : ''}{userEv.toFixed(3)}
              </div>
              <div className="text-white/30 text-xs">{actionShortLabel(userAction)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/50 text-xs mb-1">正确操作 EV</div>
              <div className={`text-xl font-mono font-bold ${evColorClass(correctEv)}`}>
                {correctEv >= 0 ? '+' : ''}{correctEv.toFixed(3)}
              </div>
              <div className="text-green-400 text-xs">{actionShortLabel(correctAction)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60 pt-1">
            <span>正确操作：</span>
            <span className="text-green-400 font-semibold">{actionLabel(correctAction)}</span>
            <span className="mx-1">|</span>
            <span>EV 差距：</span>
            <span className="text-yellow-400 font-mono font-bold">{evDiff.toFixed(3)}</span>
          </div>
        </div>

        {/* Bust Probabilities */}
        <div className="px-5 py-4 border-t border-white/10 space-y-3">
          <div className="text-white/50 text-xs mb-2">📊 爆牌概率</div>
          <ProbBar
            label={`你要牌爆牌概率（${scenario.playerHand.type === 'Soft' ? '软手不会爆' : `硬 ${scenario.playerHand.total}`}）`}
            prob={playerBust}
            color={playerBust > 0.4 ? 'bg-red-500' : playerBust > 0.15 ? 'bg-yellow-500' : 'bg-green-500'}
          />
          <ProbBar
            label={`庄家爆牌概率（明牌 ${scenario.dealerUpCard.rank}）`}
            prob={dealerBust}
            color={dealerBust > 0.35 ? 'bg-green-500' : dealerBust > 0.25 ? 'bg-yellow-500' : 'bg-red-500'}
          />
        </div>

        {/* Explanation */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-white/50 text-xs mb-2">📖 为什么？</div>
          <p className="text-sm text-white/80 leading-relaxed">{explanation}</p>
        </div>

        {/* Next button */}
        <div className="px-5 py-4 border-t border-white/10">
          <button
            onClick={onNext}
            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white
              transition-all duration-150 active:scale-98"
          >
            下一题 →
          </button>
        </div>
      </div>
    </div>
  );
}
