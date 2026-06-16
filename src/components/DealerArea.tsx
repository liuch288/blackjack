import { RefObject } from 'react';
import { CardView } from './CardView';
import { Card } from '@/types';
import { GlassPanel } from './GlassPanel';

interface Props {
  card: Card;
  mouseContainer: RefObject<HTMLDivElement | null>;
}

export function DealerArea({ card, mouseContainer }: Props) {
  return (
    <GlassPanel
      variant="subtle"
      cornerRadius={28}
      mouseContainer={mouseContainer}
      style={{ minWidth: 280 }}
    >
      <div className="px-9 py-5">
      <div className="flex flex-col items-center gap-3">
        <div className="text-white/70 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase">
          庄家明牌
        </div>
        <div className="flex gap-3 items-center">
          <CardView card={card} size="md" />
          <CardView card={card} size="md" faceDown />
        </div>
      </div>
      </div>
    </GlassPanel>
  );
}
