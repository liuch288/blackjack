import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { PRESETS } from '@/types';
import evData from '@/data/ev-table.json';
import { actionLabel } from '@/engine/explanation';

const UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

type Mode = 'hard' | 'soft' | 'pair';

function bestAction(actions: Record<string, number>): string {
  let best = '';
  let bestEV = -Infinity;
  for (const [act, ev] of Object.entries(actions)) {
    if (ev > bestEV && ev > -Infinity) { bestEV = ev; best = act; }
  }
  return best;
}

function cellClass(act: string): string {
  if (act === 'Hit') return 'bg-blue-500/25';
  if (act === 'Stand') return 'bg-green-500/25';
  if (act === 'Double') return 'bg-amber-500/30';
  if (act === 'Split') return 'bg-purple-500/25';
  if (act === 'Surrender') return 'bg-pink-500/25';
  return '';
}

export function EvViewer() {
  const { activePresetId } = useSettingsStore();
  const [mode, setMode] = useState<Mode>('hard');

  const currentPresetName = activePresetId
    ? PRESETS.find(p => p.id === activePresetId)?.name ?? '基础训练'
    : '基础训练';

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">📊 EV 策略表</h2>
          <p className="text-sm text-white/40 mt-1">
            数据来源：无限牌靴模型 · 共用于所有预设规则 · 策略由当前规则决定
          </p>
        </div>
        <div className="text-sm bg-white/5 rounded-lg px-3 py-2 text-white/50">
          当前规则：<span className="text-white font-medium">{currentPresetName}</span>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {(['hard', 'soft', 'pair'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
              ${mode === m ? 'bg-white text-gray-900' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}
          >
            {m === 'hard' ? '硬手 (Hard)' : m === 'soft' ? '软手 (Soft)' : '对子 (Pair)'}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-white/50 mb-4">
        {[
          { act: 'Hit', cls: 'bg-blue-500/50' },
          { act: 'Stand', cls: 'bg-green-500/50' },
          { act: 'Double', cls: 'bg-amber-500/50' },
          { act: 'Split', cls: 'bg-purple-500/50' },
          { act: 'Surrender', cls: 'bg-pink-500/50' },
        ].map(({ act, cls }) => (
          <div key={act} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${cls}`} />
            {actionLabel(act as any)}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-white/5 z-10">手牌</th>
              {UPCARDS.map(u => (
                <th key={u} className="px-3 py-3 text-center font-semibold min-w-[80px]">庄 {u}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mode === 'hard' && renderHardTable()}
            {mode === 'soft' && renderSoftTable()}
            {mode === 'pair' && renderPairTable()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderHardTable() {
  const data = (evData as any).hard;
  const hands = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

  return hands.map(h => (
    <tr key={h} className="border-t border-white/5">
      <td className="px-3 py-3 font-bold sticky left-0 bg-table-green">{h}</td>
      {UPCARDS.map(u => {
        const acts = data[h]?.[u];
        if (!acts || Object.keys(acts).length === 0) return <td key={u} className="px-3 py-3 text-center text-white/10">—</td>;
        const best = bestAction(acts);
        return (
          <td key={u} className={`px-2 py-2 text-center ${cellClass(best)}`}>
            <div className="font-bold text-sm">{actionLabel(best as any)}</div>
            <div className={`text-xs mt-0.5 ${acts[best] >= 0 ? 'text-amber-400' : 'text-white/40'}`}>
              {acts[best] >= 0 ? '+' : ''}{acts[best].toFixed(3)}
            </div>
          </td>
        );
      })}
    </tr>
  ));
}

function renderSoftTable() {
  const data = (evData as any).soft;
  const hands = ['12', '13', '14', '15', '16', '17', '18', '19', '20'];
  const labels: Record<string, string> = { '12': 'A2', '13': 'A3', '14': 'A4', '15': 'A5', '16': 'A6', '17': 'A7', '18': 'A8', '19': 'A9', '20': 'A10' };

  return hands.map(h => {
    // First, check if this hand exists in the data
    if (!data[h]) return null;
    return (
      <tr key={h} className="border-t border-white/5">
        <td className="px-3 py-3 font-bold sticky left-0 bg-table-green">
          {labels[h]} <span className="text-white/30 text-xs">({h})</span>
        </td>
        {UPCARDS.map(u => {
          const acts = data[h]?.[u];
          if (!acts || Object.keys(acts).length === 0) return <td key={u} className="px-3 py-3 text-center text-white/10">—</td>;
          const best = bestAction(acts);
          return (
            <td key={u} className={`px-2 py-2 text-center ${cellClass(best)}`}>
              <div className="font-bold text-sm">{actionLabel(best as any)}</div>
              <div className={`text-xs mt-0.5 ${acts[best] >= 0 ? 'text-amber-400' : 'text-white/40'}`}>
                {acts[best] >= 0 ? '+' : ''}{acts[best].toFixed(3)}
              </div>
            </td>
          );
        })}
      </tr>
    );
  }).filter(Boolean);
}

function renderPairTable() {
  const data = (evData as any).pair;
  const hardData = (evData as any).hard;
  const pairs = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

  return pairs.map(p => {
    const cardVal = p === 'A,A' ? 1 : parseInt(p.split(',')[0]);
    const hardTotal = p === 'A,A' ? 12 : cardVal * 2;
    return (
      <tr key={p} className="border-t border-white/5">
        <td className="px-3 py-3 font-bold sticky left-0 bg-table-green">{p}</td>
        {UPCARDS.map(u => {
          const splitActs = data[p]?.[u] ?? {};
          const nonSplitActs = hardData[String(hardTotal)]?.[u] ?? {};
          const all = { ...nonSplitActs, ...splitActs };
          if (Object.keys(all).length === 0) return <td key={u} className="px-3 py-3 text-center text-white/10">—</td>;
          const best = bestAction(all);
          return (
            <td key={u} className={`px-2 py-2 text-center ${cellClass(best)}`}>
              <div className="font-bold text-sm">{actionLabel(best as any)}</div>
              <div className={`text-xs mt-0.5 ${all[best] >= 0 ? 'text-amber-400' : 'text-white/40'}`}>
                {all[best] >= 0 ? '+' : ''}{all[best].toFixed(3)}
              </div>
            </td>
          );
        })}
      </tr>
    );
  });
}
