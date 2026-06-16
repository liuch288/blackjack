import { useEffect, RefObject } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { actionShortLabel } from '@/engine/explanation';
import { StatsPanel } from './StatsPanel';
import { HandType } from '@/types';
import { GlassPanel } from './GlassPanel';

interface Props {
  mouseContainer: RefObject<HTMLDivElement | null>;
}

export function HistoryPanel({ mouseContainer }: Props) {
  const {
    records,
    isLoading,
    filterCorrect,
    filterType,
    currentPage,
    pageSize,
    loadRecords,
    clearRecords,
    exportCSV,
    setFilter,
    setPage,
    filteredRecords,
    stats,
  } = useHistoryStore();

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filtered = filteredRecords();
  const { total, correct, accuracy } = stats();
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const csv = exportCSV();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackjack-practice-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('确定要清除所有练习记录吗？此操作不可恢复。')) {
      clearRecords();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* 标题玻璃面板 */}
      <GlassPanel
        variant="subtle"
        cornerRadius={20}
        mouseContainer={mouseContainer}
        style={{ width: '100%' }}
      >
        <div className="px-5 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📋 练习历史
        </h2>
        <p className="text-sm text-white/55 mt-1">查看你的所有练习记录，分析薄弱点</p>
        </div>
      </GlassPanel>

      {/* 统计概览 */}
      {total > 0 && (
        <StatsPanel
          total={total}
          correct={correct}
          accuracy={accuracy}
          byType={stats().byType}
          mouseContainer={mouseContainer}
        />
      )}

      {/* 筛选 + 操作 玻璃条 */}
      <GlassPanel
        variant="subtle"
        cornerRadius={16}
        mouseContainer={mouseContainer}
        style={{ width: '100%' }}
      >
        <div className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterCorrect}
              onChange={e => { setFilter({ filterCorrect: e.target.value as any }); setPage(1); }}
              className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white
                backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="all">全部</option>
              <option value="correct">仅正确</option>
              <option value="wrong">仅错误</option>
            </select>
            <select
              value={filterType}
              onChange={e => { setFilter({ filterType: e.target.value as any }); setPage(1); }}
              className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white
                backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="all">全部类型</option>
              <option value="Hard">硬牌 Hard</option>
              <option value="Soft">软牌 Soft</option>
              <option value="Pair">对子 Pair</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={records.length === 0}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg
                text-sm font-medium text-white transition-all backdrop-blur-sm
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              📥 导出 CSV
            </button>
            <button
              onClick={handleClearData}
              disabled={records.length === 0}
              className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-400/30
                rounded-lg text-sm font-medium text-red-200 transition-all backdrop-blur-sm
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              🗑 清除历史
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* 表格（毛玻璃化，不走 LiquidGlass 避免过多 SVG 滤镜） */}
      {isLoading ? (
        <div className="text-center text-white/50 py-12">加载中...</div>
      ) : pageData.length === 0 ? (
        <div className="text-center text-white/50 py-12">
          <p className="text-4xl mb-3">📝</p>
          <p>暂无练习记录</p>
          <p className="text-sm mt-1">回到练习页面开始答题吧！</p>
        </div>
      ) : (
        <>
          <div className="glass-surface rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-white/55 text-xs uppercase">
                  <th className="px-3 py-3 text-left">#</th>
                  <th className="px-3 py-3 text-left">时间</th>
                  <th className="px-3 py-3">庄家</th>
                  <th className="px-3 py-3">你的手牌</th>
                  <th className="px-3 py-3">类型</th>
                  <th className="px-3 py-3">正确操作</th>
                  <th className="px-3 py-3">你的选择</th>
                  <th className="px-3 py-3">结果</th>
                  <th className="px-3 py-3">正确EV</th>
                  <th className="px-3 py-3">你的EV</th>
                  <th className="px-3 py-3">差距</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r, i) => (
                  <tr key={r.id} className={`border-t border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                    <td className="px-3 py-3 text-white/40 text-xs">{r.id}</td>
                    <td className="px-3 py-3 text-white/60 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString('zh-CN', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-3 text-center font-mono">{r.dealerUp}</td>
                    <td className="px-3 py-3 font-mono text-xs">{r.playerHand}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        r.handType === 'Hard' ? 'bg-orange-500/20 text-orange-300' :
                        r.handType === 'Soft' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {r.handType === 'Hard' ? '硬' : r.handType === 'Soft' ? '软' : '对'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-green-300 font-medium">{actionShortLabel(r.correctAction)}</td>
                    <td className="px-3 py-3 text-center">{actionShortLabel(r.userAction)}</td>
                    <td className="px-3 py-3 text-center">
                      {r.isCorrect ? <span className="text-green-300">✓</span> : <span className="text-red-300">✗</span>}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs">
                      <span className={r.correctEv >= 0 ? 'text-green-300' : 'text-red-300'}>
                        {r.correctEv >= 0 ? '+' : ''}{r.correctEv.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs">
                      <span className={r.userEv >= 0 ? 'text-green-300' : 'text-red-300'}>
                        {r.userEv >= 0 ? '+' : ''}{r.userEv.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs text-yellow-300">
                      {r.evDiff.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 bg-white/10 border border-white/15 rounded-lg text-sm
                  backdrop-blur-sm disabled:opacity-30 hover:bg-white/20 transition-all"
              >
                ←
              </button>
              <span className="text-sm text-white/60 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 bg-white/10 border border-white/15 rounded-lg text-sm
                  backdrop-blur-sm disabled:opacity-30 hover:bg-white/20 transition-all"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
