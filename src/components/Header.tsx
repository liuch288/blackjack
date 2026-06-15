import { useGameStore } from '@/store/gameStore';

interface Props {
  activeTab: 'practice' | 'history' | 'settings' | 'ev';
  onTabChange: (tab: 'practice' | 'history' | 'settings' | 'ev') => void;
}

export function Header({ activeTab, onTabChange }: Props) {
  const { totalInSession, correctInSession } = useGameStore();

  const tabs = [
    { id: 'practice' as const, label: '练习', icon: '🃏' },
    { id: 'history' as const, label: '历史', icon: '📋' },
    { id: 'ev' as const, label: '策略表', icon: '📊' },
    { id: 'settings' as const, label: '设置', icon: '⚙' },
  ];

  return (
    <header className="bg-black/30 backdrop-blur-sm border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 shrink-0">
          🃏 Blackjack 策略练习
        </h1>

        <nav className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${activeTab === tab.id
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'practice' && totalInSession > 0 && (
          <div className="flex items-center gap-3 text-sm shrink-0">
            <span className="text-white/50">
              本场：<span className="text-white font-semibold">{totalInSession}</span> 题
            </span>
            <span className="text-white/50">
              正确率：
              <span className={`font-semibold ${correctInSession / totalInSession >= 0.7 ? 'text-green-400' : 'text-yellow-400'}`}>
                {totalInSession > 0 ? `${Math.round((correctInSession / totalInSession) * 100)}%` : '—'}
              </span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
