import { useState, useEffect, RefObject } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Action, GameRules, PRESETS } from '@/types';
import evData from '@/data/ev-table.json';
import { actionLabel } from '@/engine/explanation';
import { GlassPanel } from './GlassPanel';

interface Props {
  mouseContainer: RefObject<HTMLDivElement | null>;
}

const UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

type Mode = 'hard' | 'soft' | 'pair';

type PopoverData = {
  x: number;
  y: number;
  actions: Record<string, number>;
  handLabel: string;
  dealerUp: string;
};

function filterActions(
  actions: Record<string, number>,
  rules?: GameRules,
  handTotal?: number,
  dealerUp?: string,
): Record<string, number> {
  const filtered = { ...actions };
  if (rules) {
    if (rules.surrender === 'none') {
      delete filtered.Surrender;
    } else if (rules.surrender === 'no-ace' && dealerUp === 'A') {
      delete filtered.Surrender;
    }
    if (handTotal !== undefined && filtered.Double !== undefined) {
      const canDouble =
        rules.doubleRule === 'any' ||
        (rules.doubleRule === '9-11' && handTotal >= 9 && handTotal <= 11) ||
        (rules.doubleRule === '10-11' && handTotal >= 10 && handTotal <= 11);
      if (!canDouble) delete filtered.Double;
    }
  }
  return filtered;
}

function bestActionFromFiltered(filtered: Record<string, number>): string {
  let best = '';
  let bestEV = -Infinity;
  for (const [act, ev] of Object.entries(filtered)) {
    if (ev > bestEV && ev > -Infinity) { bestEV = ev; best = act; }
  }
  return best;
}

const ACT_COLORS: Record<string, string> = {
  Hit: 'bg-blue-500',
  Stand: 'bg-green-500',
  Double: 'bg-amber-500',
  Split: 'bg-purple-500',
  Surrender: 'bg-pink-500',
};

function cellClass(act: string): string {
  return ACT_COLORS[act] ? ACT_COLORS[act] + '/25' : '';
}

function CellPopover({ data, onClose }: { data: PopoverData; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const entries = Object.entries(data.actions).sort((a, b) => b[1] - a[1]);
  const bestEv = entries[0][1];

  return (
    <div
      className="fixed glass-surface-strong rounded-xl p-4 z-50 min-w-[220px]"
      style={{ left: data.x, top: data.y }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-white">
          {data.handLabel}
          <span className="text-white/45 mx-1.5">vs</span>
          庄 <span className="font-mono">{data.dealerUp}</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white/85 text-lg leading-none ml-2 cursor-pointer">&times;</button>
      </div>

      <div className="space-y-1.5">
        {entries.map(([act, ev]) => {
          const isPos = ev >= 0;
          const isBest = ev === bestEv;
          return (
            <div key={act} className="flex items-center justify-between gap-4">
              <span className="text-xs text-white/60">{actionLabel(act as Action)}</span>
              <span className={`text-xs font-mono tabular-nums ${
                isPos ? 'text-green-300' : 'text-red-300'
              } ${isBest ? 'font-bold' : ''}`}>
                {ev >= 0 ? '+' : ''}{ev.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EvViewer({ mouseContainer }: Props) {
  const { rules, activePresetId } = useSettingsStore();
  const [mode, setMode] = useState<Mode>('hard');
  const [popover, setPopover] = useState<PopoverData | null>(null);

  const handleCellClick = (e: React.MouseEvent, acts: Record<string, number>, handLabel: string, dealerUp: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popW = 220;
    const popH = Object.keys(acts).length * 28 + 64;

    let x = rect.right + 8;
    let y = rect.top;
    if (x + popW > window.innerWidth) x = rect.left - popW - 8;
    if (y + popH > window.innerHeight) y = window.innerHeight - popH - 8;
    if (y < 8) y = 8;
    setPopover({ x, y, actions: acts, handLabel, dealerUp });
  };

  const currentPresetName = activePresetId
    ? PRESETS.find(p => p.id === activePresetId)?.name ?? '基础训练'
    : '基础训练';

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-5">
      {/* 头部 */}
      <GlassPanel
        variant="subtle"
        cornerRadius={20}
        mouseContainer={mouseContainer}
        style={{ width: '100%' }}
      >
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">📊 EV 策略表</h2>
            <p className="text-sm text-white/55 mt-1">点击任意格子查看所有决策的 EV 对比</p>
          </div>
          <div className="text-sm bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/65 backdrop-blur-sm">
            当前规则：<span className="text-white font-medium">{currentPresetName}</span>
          </div>
        </div>
      </GlassPanel>

      {/* Mode tabs */}
      <GlassPanel
        variant="subtle"
        cornerRadius={14}
        mouseContainer={mouseContainer}
        style={{ width: 'fit-content' }}
      >
        <div className="p-1.5 flex gap-1">
          {(['hard', 'soft', 'pair'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                ${mode === m ? 'bg-white text-gray-900 shadow' : 'text-white/65 hover:bg-white/10'}`}
            >
              {m === 'hard' ? '硬手 (Hard)' : m === 'soft' ? '软手 (Soft)' : '对子 (Pair)'}
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-white/60 px-1">
        {[
          { act: 'Hit', cls: 'bg-blue-500/60' } as const,
          { act: 'Stand', cls: 'bg-green-500/60' } as const,
          { act: 'Double', cls: 'bg-amber-500/60' } as const,
          { act: 'Split', cls: 'bg-purple-500/60' } as const,
          ...(rules.surrender !== 'none' ? [{ act: 'Surrender' as const, cls: 'bg-pink-500/60' as const }] : []),
        ].map(({ act, cls }) => (
          <div key={act} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${cls}`} />
            {actionLabel(act)}
          </div>
        ))}
      </div>

      {/* 表格 */}
      <div className="glass-surface rounded-xl overflow-x-auto">
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
            {mode === 'hard' && renderHardTable(rules, handleCellClick)}
            {mode === 'soft' && renderSoftTable(rules, handleCellClick)}
            {mode === 'pair' && renderPairTable(rules, handleCellClick)}
          </tbody>
        </table>
      </div>

      {popover && <CellPopover data={popover} onClose={() => setPopover(null)} />}
    </div>
  );
}

function renderHardTable(rules: GameRules, onCellClick: (e: React.MouseEvent, acts: Record<string, number>, handLabel: string, dealerUp: string) => void) {
  const data = (evData as any).hard;
  const hands = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

  return hands.map(h => (
    <tr key={h} className="border-t border-white/5">
      <td className="px-3 py-3 font-bold sticky left-0 bg-table-dark/80 backdrop-blur-sm">{h}</td>
      {UPCARDS.map(u => {
        const rawActs = data[h]?.[u];
        if (!rawActs || Object.keys(rawActs).length === 0) return <td key={u} className="px-3 py-3 text-center text-white/15">—</td>;
        const filtered = filterActions(rawActs, rules, parseInt(h), u);
        const best = bestActionFromFiltered(filtered);
        return (
          <td
            key={u}
            className={`px-2 py-2 text-center ${cellClass(best)} cursor-pointer hover:ring-1 hover:ring-white/30 transition-all`}
            onMouseDown={e => onCellClick(e, filtered, `硬手 ${h}`, u)}
          >
            <div className="font-bold text-sm">{actionLabel(best as any)}</div>
            <div className={`text-xs mt-0.5 ${filtered[best] >= 0 ? 'text-amber-300' : 'text-white/50'}`}>
              {filtered[best] >= 0 ? '+' : ''}{filtered[best].toFixed(3)}
            </div>
          </td>
        );
      })}
    </tr>
  ));
}

function renderSoftTable(rules: GameRules, onCellClick: (e: React.MouseEvent, acts: Record<string, number>, handLabel: string, dealerUp: string) => void) {
  const data = (evData as any).soft;
  const hands = ['12', '13', '14', '15', '16', '17', '18', '19', '20'];
  const labels: Record<string, string> = { '12': 'A2', '13': 'A3', '14': 'A4', '15': 'A5', '16': 'A6', '17': 'A7', '18': 'A8', '19': 'A9', '20': 'A10' };

  return hands.map(h => {
    if (!data[h]) return null;
    return (
      <tr key={h} className="border-t border-white/5">
        <td className="px-3 py-3 font-bold sticky left-0 bg-table-dark/80 backdrop-blur-sm">
          {labels[h]} <span className="text-white/40 text-xs">({h})</span>
        </td>
        {UPCARDS.map(u => {
          const rawActs = data[h]?.[u];
          if (!rawActs || Object.keys(rawActs).length === 0) return <td key={u} className="px-3 py-3 text-center text-white/15">—</td>;
          const filtered = filterActions(rawActs, rules, parseInt(h), u);
          const best = bestActionFromFiltered(filtered);
          return (
            <td
              key={u}
              className={`px-2 py-2 text-center ${cellClass(best)} cursor-pointer hover:ring-1 hover:ring-white/30 transition-all`}
              onMouseDown={e => onCellClick(e, filtered, `${labels[h]} (${h})`, u)}
            >
              <div className="font-bold text-sm">{actionLabel(best as any)}</div>
              <div className={`text-xs mt-0.5 ${filtered[best] >= 0 ? 'text-amber-300' : 'text-white/50'}`}>
                {filtered[best] >= 0 ? '+' : ''}{filtered[best].toFixed(3)}
              </div>
            </td>
          );
        })}
      </tr>
    );
  }).filter(Boolean);
}

function renderPairTable(rules: GameRules, onCellClick: (e: React.MouseEvent, acts: Record<string, number>, handLabel: string, dealerUp: string) => void) {
  const data = (evData as any).pair;
  const hardData = (evData as any).hard;
  const pairs = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

  return pairs.map(p => {
    const cardVal = p === 'A,A' ? 1 : parseInt(p.split(',')[0]);
    const hardTotal = p === 'A,A' ? 12 : cardVal * 2;
    return (
      <tr key={p} className="border-t border-white/5">
        <td className="px-3 py-3 font-bold sticky left-0 bg-table-dark/80 backdrop-blur-sm">{p}</td>
        {UPCARDS.map(u => {
          const splitActs = data[p]?.[u] ?? {};
          const nonSplitActs = hardData[String(hardTotal)]?.[u] ?? {};
          const all = { ...nonSplitActs, ...splitActs };
          if (Object.keys(all).length === 0) return <td key={u} className="px-3 py-3 text-center text-white/15">—</td>;
          const filtered = filterActions(all, rules, hardTotal, u);
          const best = bestActionFromFiltered(filtered);
          return (
            <td
              key={u}
              className={`px-2 py-2 text-center ${cellClass(best)} cursor-pointer hover:ring-1 hover:ring-white/30 transition-all`}
              onMouseDown={e => onCellClick(e, filtered, `对子 ${p}`, u)}
            >
              <div className="font-bold text-sm">{actionLabel(best as any)}</div>
              <div className={`text-xs mt-0.5 ${filtered[best] >= 0 ? 'text-amber-300' : 'text-white/50'}`}>
                {filtered[best] >= 0 ? '+' : ''}{filtered[best].toFixed(3)}
              </div>
            </td>
          );
        })}
      </tr>
    );
  });
}
