import { useSettingsStore } from '@/store/settingsStore';
import { PRESETS, GameRules } from '@/types';

export function SettingsPanel() {
  const { rules, activePresetId, isCustom, setPreset, updateRules, resetToDefault } = useSettingsStore();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h2 className="text-2xl font-bold">游戏规则设置</h2>

      {/* Presets */}
      <section>
        <h3 className="text-sm font-medium text-white/50 mb-3">🎯 快速预设</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-150
                ${activePresetId === p.id && !isCustom
                  ? 'border-amber-400/60 bg-amber-400/10 shadow-lg shadow-amber-400/5'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
            >
              <div className="font-bold text-sm">{p.name}</div>
              <div className="text-xs text-white/40 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
        {isCustom && (
          <p className="text-xs text-amber-400/60 mt-2">当前为自定义规则（偏离了所有预设）</p>
        )}
      </section>

      <hr className="border-white/5" />

      {/* Detailed settings */}
      <section className="space-y-6">
        <h3 className="text-sm font-medium text-white/50">────────── 详细设置 ──────────</h3>

        {/* Deck count */}
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

        {/* S17/H17 */}
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

        {/* Surrender */}
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

        {/* Double rule */}
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

        {/* DAS */}
        <SettingsRow label="🃏 分牌后加倍 (DAS)" hint="分牌后可在子手牌上继续加倍">
          <ToggleSwitch
            enabled={rules.doubleAfterSplit}
            onToggle={v => updateRules({ doubleAfterSplit: v })}
            labelOn="允许 DAS"
            labelOff="禁止 nDAS"
          />
        </SettingsRow>
      </section>

      {/* Current rules summary */}
      <div className="bg-white/5 rounded-xl p-4 space-y-2">
        <div className="text-sm text-white/50">💡 当前规则组合：</div>
        <div className="font-bold">
          {activePresetId && !isCustom
            ? `🎯 ${PRESETS.find(p => p.id === activePresetId)?.name}（${PRESETS.find(p => p.id === activePresetId)?.desc}）`
            : '⚡ 自定义规则'
          }
        </div>
        <div className="text-xs text-white/30">
          修改规则后，策略判定会自动适配。之前的练习记录不会丢失。
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={resetToDefault}
          className="flex-1 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-medium text-sm transition-all"
        >
          恢复默认
        </button>
        <button
          onClick={() => {}}
          className="flex-1 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40
            rounded-xl font-bold text-sm transition-all"
        >
          已自动保存
        </button>
      </div>
    </div>
  );
}

// Sub-components
function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        {hint && (
          <span className="text-white/20 cursor-help text-xs" title={hint}>?</span>
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
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
            ${selected === o.value
              ? 'bg-white/15 text-white shadow-sm'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
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
        className={`w-12 h-7 rounded-full transition-all duration-200 relative
          ${enabled ? 'bg-green-500' : 'bg-white/20'}`}
      >
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
          ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
      <span className={`text-sm font-medium ${enabled ? 'text-green-400' : 'text-white/40'}`}>
        {enabled ? labelOn : labelOff}
      </span>
    </div>
  );
}
