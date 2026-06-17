import { useEffect, RefObject } from 'react';
import { useGameStore } from '@/store/gameStore';
import { DealerArea } from './DealerArea';
import { PlayerArea } from './PlayerArea';
import { DecisionPanel } from './DecisionPanel';
import { FeedbackPanel } from './FeedbackPanel';

interface Props {
  mouseContainer: RefObject<HTMLDivElement | null>;
}

export function GameTable({ mouseContainer }: Props) {
  const {
    scenario,
    answerRecord,
    showFeedback,
    generateNewScenario,
    submitAction,
    nextScenario,
  } = useGameStore();

  if (!scenario) {
    generateNewScenario();
  }

  // 练习页全程锁定 body 滚动，禁止移动端上下拖动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 py-6 sm:py-8 px-4 max-w-3xl mx-auto relative">
      {!scenario ? (
        <div className="text-white/60 text-lg">加载中...</div>
      ) : (
        <>
          <DealerArea card={scenario.dealerUpCard} mouseContainer={mouseContainer} />

          <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <PlayerArea hand={scenario.playerHand} mouseContainer={mouseContainer} />

          {!showFeedback && (
            <DecisionPanel
              availableActions={scenario.availableActions}
              disabled={showFeedback}
              onAction={submitAction}
              mouseContainer={mouseContainer}
            />
          )}

          {showFeedback && answerRecord && (
            <>
              {/* 移动端：固定遮罩 + 可滚动答案浮层 */}
              <div className="sm:hidden fixed inset-0 z-30 overflow-y-auto overscroll-contain">
                <div
                  className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                  style={{ animation: 'fadeIn 0.3s ease-out' }}
                  onClick={() => nextScenario()}
                />
                <div className="relative z-10 flex items-end justify-center min-h-full pt-20 px-4 pb-4">
                  <div className="w-full max-w-lg">
                    <FeedbackPanel
                      record={answerRecord}
                      onNext={nextScenario}
                      mouseContainer={mouseContainer}
                    />
                  </div>
                </div>
              </div>
              {/* 桌面端：内联显示 */}
              <div className="hidden sm:block w-full">
                <FeedbackPanel
                  record={answerRecord}
                  onNext={nextScenario}
                  mouseContainer={mouseContainer}
                />
              </div>
            </>
          )}

          
        </>
      )}
    </div>
  );
}
