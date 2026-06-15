interface Props {
  total: number;
  correct: number;
  accuracy: number;
  byType: {
    Hard: { total: number; correct: number };
    Soft: { total: number; correct: number };
    Pair: { total: number; correct: number };
  };
}

export function StatsPanel({ total, correct, accuracy, byType }: Props) {
  const accuracyPct = Math.round(accuracy * 100);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="总题数"
        value={total.toString()}
        icon="📝"
      />
      <StatCard
        label="正确率"
        value={`${accuracyPct}%`}
        icon="🎯"
        color={accuracyPct >= 80 ? 'text-green-400' : accuracyPct >= 60 ? 'text-yellow-400' : 'text-red-400'}
      />
      <StatCard
        label="正确"
        value={correct.toString()}
        icon="✅"
        color="text-green-400"
      />
      <StatCard
        label="错误"
        value={(total - correct).toString()}
        icon="❌"
        color="text-red-400"
      />

      {/* Per-type breakdown */}
      <div className="col-span-2 sm:col-span-4 grid grid-cols-3 gap-3 mt-1">
        {(['Hard', 'Soft', 'Pair'] as const).map(type => {
          const t = byType[type];
          const rate = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
          const label = type === 'Hard' ? '硬牌' : type === 'Soft' ? '软牌' : '对子';
          return (
            <div key={type} className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-white/40 text-xs mb-1">{label}</div>
              <div className="text-lg font-bold">
                {t.total > 0 ? (
                  <span className={rate >= 80 ? 'text-green-400' : rate >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                    {rate}%
                  </span>
                ) : (
                  <span className="text-white/20">—</span>
                )}
              </div>
              <div className="text-white/30 text-xs">{t.total} 题</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'text-white' }: {
  label: string;
  value: string;
  icon: string;
  color?: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-white/40 text-xs">{label}</div>
    </div>
  );
}
