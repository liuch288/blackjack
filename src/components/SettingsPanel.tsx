import { RefObject } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { PRESETS, GameRules } from '@/types';
import { GlassPanel } from './GlassPanel';

interface Props {
  mouseContainer: RefObject<HTMLDivElement | null>;
}

export function SettingsPanel({ mouseContainer }: Props) {
  const { rules, activePresetId, isCustom, setPreset, updateRules, resetToDefault } = useSettingsStore();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* 标题 */}
      <GlassPanel
        variant="subtle"
        cornerRadius={20}
        mouseContainer={mouseContainer}
        style={{ width: '100%' }}
      >
        <div className="px-5 py-4">
        <h2 className="text-2xl font-bold text-white">游戏规则设置</h2>
        </div>
      </GlassPanel>

      {/* 预设 */}
      <GlassPanel
        variant="subtle"
        cornerRadius={20}
        mouseContainer={mouseContainer}
        style={{ width: '100%' }}
      >
        <div className="p-5">
        <h3 className="text-sm font-medium text-white/55 mb-3">🎯 快速预设</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-150 backdrop-blur-sm
                ${activePresetId === p.id && !isCustom
                  ? 'border-amber-300/60 bg-amber-400/15 shadow-lg shadow-amber-400/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
            >
              <div className="font-bold text-sm text-white">{p.name}</div>
              <div className="text-xs text-white/50 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
        {isCustom && (
          <p className="text-xs text-amber-300/80 mt-3">当前为自定义规则（偏离了所有预设）</p>
        )}
        </div>
      </GlassPanel>

      {/* 详细设置 */}
      <GlassPanel
        variant="subtle"
        cornerRadius={20}
        mouseContainer={mouseContainer}
        style={{ width: '100%' }}
      >
        <div className="p-5">
        <h3 className="text-sm font-medium text-white/55 mb-4">────────── 详细设置 ──────────</h3>

        <div className="space-y-6">
          <SettingsRow label="📦 使用牌副数">
            <OptionGroup
              options={[
                { value: 1, label: '1副' },
                { value: 2, label: '2副' },
                { value: 6, label: '6副' },
                { value: 8, label: '8副' },
              ]}
              selected={rules.deckCount}
              onSelect={v => updateRules({ deckCount: v as GameRules['deckCount'] })}
            />
          </SettingsRow>

          <SettingsRow label="🏠 庄家软17时" hint="S17对玩家更有利：庄家拿到软17时不再要牌">
            <OptionGroup
              options={[
                { value: true, label: '停牌 (S17)' },
                { value: false, label: '要牌 (H17)' },
              ]}
              selected={rules.dealerStandSoft17}
              onSelect={v => updateRules({ dealerStandSoft17: v })}
            />
          </SettingsRow>

          <SettingsRow label="🏳 投降" hint="允许在首两张牌时放弃本局，只输一半。庄A不可投：庄家明牌为A时不允许投降">
            <OptionGroup
              options={[
                { value: 'ls', label: '允许投降' },
                { value: 'no-ace', label: '庄A不可投' },
                { value: 'none', label: '禁止投降' },
              ]}
              selected={rules.surrender}
              onSelect={v => updateRules({ surrender: v })}
            />
          </SettingsRow>

          <SettingsRow label="✖️ 加倍限制" hint="限制允许加倍的手牌点数范围">
            <OptionGroup
              options={[
                { value: 'any', label: '任意两张' },
                { value: '9-11', label: '仅9-11' },
                { value: '10-11', label: '仅10-11' },
              ]}
              selected={rules.doubleRule}
              onSelect={v => updateRules({ doubleRule: v as GameRules['doubleRule'] })}
            />
          </SettingsRow>

          <SettingsRow label="🃏 分牌后加倍 (DAS)" hint="分牌后可在子手牌上继续加倍">
            <ToggleSwitch
              enabled={rules.doubleAfterSplit}
              onToggle={v => updateRules({ doubleAfterSplit: v })}
              labelOn="允许 DAS"
              labelOff="禁止 nDAS"
            />
          </SettingsRow>
        </div>
        </div>
      </GlassPanel>

      {/* 当前规则摘要 */}
      <GlassPanel
        variant="subtle"
        cornerRadius={16}
        mouseContainer={mouseContainer}
        style={{ width: '100%' }}
      >
        <div className="px-5 py-4 space-y-2">
          <div className="text-sm text-white/55">💡 当前规则组合：</div>
          <div className="font-bold text-white">
            {activePresetId && !isCustom
              ? `🎯 ${PRESETS.find(p => p.id === activePresetId)?.name}（${PRESETS.find(p => p.id === activePresetId)?.desc}）`
              : '⚡ 自定义规则'
            }
          </div>
          <div className="text-xs text-white/40">
            修改规则后，策略判定会自动适配。之前的练习记录不会丢失。
          </div>
        </div>
      </GlassPanel>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={resetToDefault}
          className="flex-1 py-3 glass-surface rounded-xl font-medium text-sm text-white transition-all hover:bg-white/15"
        >
          恢复默认
        </button>
        <button
          onClick={() => {}}
          className="flex-1 py-3 bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/40
            rounded-xl font-bold text-sm text-amber-100 transition-all backdrop-blur-sm"
        >
          已自动保存
        </button>
      </div>
    </div>
  );
}

function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{label}</span>
        {hint && (
          <span className="text-white/30 cursor-help text-xs" title={hint}>?</span>
        )}
      </div>
      {children}
    </div>
  );
}

function OptionGroup({ options, selected, onSelect }: {
  options: { value: string | number | boolean; label: string }[];
  selected: string | number | boolean;
  onSelect: (v: any) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={String(o.value)}
          onClick={() => onSelect(o.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 backdrop-blur-sm
            ${selected === o.value
              ? 'bg-white/25 text-white shadow-sm ring-1 ring-white/20'
              : 'bg-white/5 text-white/60 hover:bg-white/12 hover:text-white/85 border border-white/5'
            }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ enabled, onToggle, labelOn, labelOff }: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onToggle(!enabled)}
        className={`w-12 h-7 rounded-full transition-all duration-200 relative backdrop-blur-sm
          ${enabled ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-white/15 border border-white/10'}`}
      >
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
          ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
      <span className={`text-sm font-medium ${enabled ? 'text-green-300' : 'text-white/55'}`}>
        {enabled ? labelOn : labelOff}
      </span>
    </div>
  );
}
