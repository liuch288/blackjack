import { useGameStore } from '@/store/gameStore';
import { DealerArea } from './DealerArea';
import { PlayerArea } from './PlayerArea';
import { DecisionPanel } from './DecisionPanel';
import { FeedbackPanel } from './FeedbackPanel';

export function GameTable() {
  const {
    scenario,
    answerRecord,
    showFeedback,
    generateNewScenario,
    submitAction,
    nextScenario,
  } = useGameStore();

  // Generate first scenario on mount
  if (!scenario) {
    generateNewScenario();
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4 max-w-3xl mx-auto">
      {!scenario ? (
        <div className="text-white/50 text-lg">加载中...</div>
      ) : (
        <>
          {/* Dealer area */}
          <DealerArea card={scenario.dealerUpCard} />

          {/* Divider */}
          <div className="w-32 h-px bg-white/10" />

          {/* Player area */}
          <PlayerArea hand={scenario.playerHand} />

          {/* Decision buttons */}
          {!showFeedback && (
            <DecisionPanel
              availableActions={scenario.availableActions}
              disabled={showFeedback}
              onAction={submitAction}
            />
          )}

          {/* Feedback */}
          {showFeedback && answerRecord && (
            <FeedbackPanel record={answerRecord} onNext={nextScenario} />
          )}

          {/* Hint for keyboard shortcuts */}
          {!showFeedback && (
            <div className="text-white/25 text-xs mt-2">
              键盘快捷键：H 要牌 · S 停牌 · D 加倍 · P 分牌 · R 投降
            </div>
          )}
        </>
      )}
    </div>
  );
}
