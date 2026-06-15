import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GameTable } from './components/GameTable';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { EvViewer } from './components/EvViewer';
import { useKeyboard } from './hooks/useKeyboard';

type Tab = 'practice' | 'history' | 'settings' | 'ev';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('practice');

  useKeyboard();

  // Load history on mount (prefetch)
  useEffect(() => {
    import('./store/historyStore').then(m => {
      m.useHistoryStore.getState().loadRecords();
    });
  }, []);

  return (
    <div className="min-h-screen bg-table-green text-white">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === 'practice' && <GameTable />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'ev' && <EvViewer />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>

      <footer className="text-center py-6 text-white/20 text-xs">
        Blackjack 基本策略练习工具 v1.0.0 · EV 数据由动态规划精确计算 · 仅供学习使用
      </footer>
    </div>
  );
}

export default App;
