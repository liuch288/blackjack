import { useState, useCallback, RefObject } from 'react';
import { AnswerRecord } from '@/types';
import { actionLabel, actionShortLabel, evColorClass, getPlayerBustProb, getDealerBustProb } from '@/engine/explanation';
import { GlassPanel } from './GlassPanel';

interface Props {
  record: AnswerRecord;
  onNext: () => void;
  mouseContainer: RefObject<HTMLDivElement | null>;
}

interface SectionAnimProps {
  direction: 'left' | 'right';
  delay: number;
  isExiting: boolean;
  children: React.ReactNode;
}

function AnimatedSection({ direction, delay, isExiting, children }: SectionAnimProps) {
  const enterClass = direction === 'left' ? 'animate-slide-scale-left' : 'animate-slide-scale-right';
  const exitClass = direction === 'left' ? 'animate-exit-left' : 'animate-exit-right';

  return (
    <div
      className={isExiting ? exitClass : enterClass}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      {children}
    </div>
  );
}

function ProbBar({ label, prob, color }: { label: string; prob: number; color: string }) {
  const pct = Math.round(prob * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className={`font-mono font-bold ${color.replace('bg-', 'text-')}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function FeedbackPanel({ record, onNext, mouseContainer }: Props) {
  const { scenario, userAction, correctAction, userEv, correctEv, evDiff, explanation, isCorrect } = record;
  const [isExiting, setIsExiting] = useState(false);

  const playerBust = getPlayerBustProb(scenario.playerHand);
  const dealerBust = getDealerBustProb(
    scenario.dealerUpCard.isAce ? 1 : scenario.dealerUpCard.value >= 10 ? 10 : scenario.dealerUpCard.value,
    true
  );

  const handleNext = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => { onNext(); }, 550);
  }, [onNext]);

  const maxDelay = 320;
  const sections = [
    {
      id: 'header',
      direction: 'left' as const,
      delay: 0,
      content: (
        <div className={`px-5 py-4 ${isCorrect ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl inline-block animate-bounce">{isCorrect ? '✅' : '❌'}</span>
            <span className={`text-lg font-bold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {isCorrect ? '正确！' : `不正确 — 你的选择：${actionShortLabel(userAction)}`}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'ev',
      direction: 'right' as const,
      delay: 80,
      content: (
        <div className="px-5 py-4 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-white/10">
              <div className="text-white/55 text-xs mb-1">你的选择 EV</div>
              <div className={`text-xl font-mono font-bold ${evColorClass(userEv)}`}>
                {userEv >= 0 ? '+' : ''}{userEv.toFixed(3)}
              </div>
              <div className="text-white/40 text-xs">{actionShortLabel(userAction)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-white/10">
              <div className="text-white/55 text-xs mb-1">正确操作 EV</div>
              <div className={`text-xl font-mono font-bold ${evColorClass(correctEv)}`}>
                {correctEv >= 0 ? '+' : ''}{correctEv.toFixed(3)}
              </div>
              <div className="text-green-300 text-xs">{actionShortLabel(correctAction)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70 pt-1 flex-wrap">
            <span>正确操作：</span>
            <span className="text-green-300 font-semibold">{actionLabel(correctAction)}</span>
            <span className="mx-1 text-white/30">|</span>
            <span>EV 差距：</span>
            <span className="text-yellow-300 font-mono font-bold">{evDiff.toFixed(3)}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'bust',
      direction: 'left' as const,
      delay: 160,
      content: (
        <div className="px-5 py-4 space-y-3">
          <div className="text-white/55 text-xs mb-2">📊 爆牌概率</div>
          <ProbBar
            label={`你要牌爆牌概率（${scenario.playerHand.type === 'Soft' ? '软手不会爆' : `硬 ${scenario.playerHand.total}`}）`}
            prob={playerBust}
            color={playerBust > 0.4 ? 'bg-red-400' : playerBust > 0.15 ? 'bg-yellow-400' : 'bg-green-400'}
          />
          <ProbBar
            label={`庄家爆牌概率（明牌 ${scenario.dealerUpCard.rank}）`}
            prob={dealerBust}
            color={dealerBust > 0.35 ? 'bg-green-400' : dealerBust > 0.25 ? 'bg-yellow-400' : 'bg-red-400'}
          />
        </div>
      ),
    },
    {
      id: 'explanation',
      direction: 'right' as const,
      delay: 240,
      content: (
        <div className="px-5 py-4">
          <div className="text-white/55 text-xs mb-2">📖 为什么？</div>
          <p className="text-sm text-white/85 leading-relaxed">{explanation}</p>
        </div>
      ),
    },
    {
      id: 'next',
      direction: 'left' as const,
      delay: 320,
      content: (
        <div className="px-5 py-4">
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-base
              transition-all duration-200 active:scale-95 hover:scale-[1.02]
              ${isCorrect
                ? 'animate-glow-pulse bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30'
                : 'bg-gradient-to-r from-white/20 to-white/10 hover:from-white/25 hover:to-white/15 backdrop-blur-sm'
              }`}
          >
            下一题 →
          </button>
        </div>
      ),
    },
  ];

  // 玻璃面板内层：覆盖一层色调（绿/红）让玻璃带语义色
  const tintBg = isCorrect
    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(16, 185, 129, 0.08))'
    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(220, 38, 38, 0.08))';

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        className={`animate-glass-rise ${isExiting ? 'scale-[0.97] opacity-70 blur-[1px]' : ''}`}
      >
        <GlassPanel
          variant="strong"
          cornerRadius={24}
          mouseContainer={mouseContainer}
          style={{ width: '100%' }}
          enableSpotlight={false}
        >
          <div
            className={`rounded-[24px] overflow-hidden border ${
              isCorrect ? 'border-green-300/40' : 'border-red-300/40'
            }`}
            style={{
              background: isExiting ? 'transparent' : tintBg,
              boxShadow: isCorrect
                ? '0 0 40px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                : '0 0 40px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
          >
            {sections.map((s) => (
              <AnimatedSection
                key={s.id}
                direction={s.direction}
                delay={isExiting ? maxDelay - s.delay : s.delay}
                isExiting={isExiting}
              >
                {s.content}
              </AnimatedSection>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
