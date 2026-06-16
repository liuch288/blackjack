import { RefObject } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GlassPanel } from './GlassPanel';

interface Props {
  activeTab: 'practice' | 'history' | 'settings' | 'ev';
  onTabChange: (tab: 'practice' | 'history' | 'settings' | 'ev') => void;
  mouseContainer: RefObject<HTMLElement | null>;
}

export function Header({ activeTab, onTabChange, mouseContainer }: Props) {
  const { totalInSession, correctInSession } = useGameStore();

  const tabs = [
    { id: 'practice' as const, label: '练习', icon: '🃏' },
    { id: 'history' as const, label: '历史', icon: '📋' },
    { id: 'ev' as const, label: '策略表', icon: '📊' },
    { id: 'settings' as const, label: '设置', icon: '⚙' },
  ];

  return (
    <header className="sticky top-3 z-50 px-3 pt-3">
      <GlassPanel
        variant="frosted"
        cornerRadius={24}
        mouseContainer={mouseContainer as RefObject<HTMLDivElement | null>}
        className="glass-liquid"
        enableSpotlight={false}
      >
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 shrink-0 text-white">
              <span className="text-xl">🃏</span>
              <span>Blackjack 策略练习</span>
            </h1>

            <nav className="flex gap-1 bg-black/20 rounded-xl p-1 backdrop-blur-sm">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${activeTab === tab.id
                      ? 'bg-white/25 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                    }`}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {activeTab === 'practice' && totalInSession > 0 && (
              <div className="flex items-center gap-3 text-xs sm:text-sm shrink-0">
                <span className="text-white/60">
                  本场：<span className="text-white font-semibold">{totalInSession}</span> 题
                </span>
                <span className="text-white/60">
                  正确率：
                  <span className={`font-semibold ${correctInSession / totalInSession >= 0.7 ? 'text-green-300' : 'text-yellow-300'}`}>
                    {totalInSession > 0 ? `${Math.round((correctInSession / totalInSession) * 100)}%` : '—'}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
    </header>
  );
}
