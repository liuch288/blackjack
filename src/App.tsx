import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { GameTable } from './components/GameTable';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { EvViewer } from './components/EvViewer';
import { useKeyboard } from './hooks/useKeyboard';

type Tab = 'practice' | 'history' | 'settings' | 'ev';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('practice');
  const containerRef = useRef<HTMLDivElement>(null);

  useKeyboard();

  // Load history on mount (prefetch)
  useEffect(() => {
    import('./store/historyStore').then(m => {
      m.useHistoryStore.getState().loadRecords();
    });
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-felt bg-aurora text-white relative">
      {/* 玻璃面板的鼠标事件源（影响所有 LiquidGlass 的折射方向） */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} mouseContainer={containerRef} />

      <main className="relative z-10">
        {activeTab === 'practice' && <GameTable mouseContainer={containerRef} />}
        {activeTab === 'history' && <HistoryPanel mouseContainer={containerRef} />}
        {activeTab === 'ev' && <EvViewer mouseContainer={containerRef} />}
        {activeTab === 'settings' && <SettingsPanel mouseContainer={containerRef} />}
      </main>

      <footer className="text-center py-6 text-white/20 text-xs relative z-10">
        v1.1.0
      </footer>
    </div>
  );
}

export default App;
