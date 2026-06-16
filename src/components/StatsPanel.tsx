import { RefObject } from 'react';
import { GlassPanel } from './GlassPanel';

interface Props {
  total: number;
  correct: number;
  accuracy: number;
  byType: {
    Hard: { total: number; correct: number };
    Soft: { total: number; correct: number };
    Pair: { total: number; correct: number };
  };
  mouseContainer: RefObject<HTMLDivElement | null>;
}

export function StatsPanel({ total, correct, accuracy, byType, mouseContainer }: Props) {
  const accuracyPct = Math.round(accuracy * 100);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="总题数" value={total.toString()} icon="📝" mouseContainer={mouseContainer} />
      <StatCard
        label="正确率"
        value={`${accuracyPct}%`}
        icon="🎯"
        color={accuracyPct >= 80 ? 'text-green-300' : accuracyPct >= 60 ? 'text-yellow-300' : 'text-red-300'}
        mouseContainer={mouseContainer}
      />
      <StatCard label="正确" value={correct.toString()} icon="✅" color="text-green-300" mouseContainer={mouseContainer} />
      <StatCard label="错误" value={(total - correct).toString()} icon="❌" color="text-red-300" mouseContainer={mouseContainer} />

      <div className="col-span-2 sm:col-span-4 grid grid-cols-3 gap-3 mt-1">
        {(['Hard', 'Soft', 'Pair'] as const).map(type => {
          const t = byType[type];
          const rate = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
          const label = type === 'Hard' ? '硬牌' : type === 'Soft' ? '软牌' : '对子';
          return (
            <div key={type} className="glass-surface rounded-xl p-3 text-center">
              <div className="text-white/55 text-xs mb-1">{label}</div>
              <div className="text-lg font-bold">
                {t.total > 0 ? (
                  <span className={rate >= 80 ? 'text-green-300' : rate >= 60 ? 'text-yellow-300' : 'text-red-300'}>
                    {rate}%
                  </span>
                ) : (
                  <span className="text-white/30">—</span>
                )}
              </div>
              <div className="text-white/40 text-xs">{t.total} 题</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'text-white', mouseContainer }: {
  label: string;
  value: string;
  icon: string;
  color?: string;
  mouseContainer: RefObject<HTMLDivElement | null>;
}) {
  return (
    <GlassPanel
      variant="subtle"
      cornerRadius={16}
      mouseContainer={mouseContainer}
      style={{ width: '100%' }}
    >
      <div className="text-center px-2 py-3">
        <div className="text-2xl mb-1">{icon}</div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        <div className="text-white/50 text-xs">{label}</div>
      </div>
    </GlassPanel>
  );
}
