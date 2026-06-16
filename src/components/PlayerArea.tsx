import { RefObject } from 'react';
import { Hand } from '@/types';
import { CardView } from './CardView';
import { GlassPanel } from './GlassPanel';

interface Props {
  hand: Hand;
  mouseContainer: RefObject<HTMLDivElement | null>;
}

export function PlayerArea({ hand, mouseContainer }: Props) {
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
          你的手牌
        </div>
        <div className="flex gap-2 sm:gap-3 items-center flex-wrap justify-center">
          {hand.cards.map((card, i) => (
            <CardView key={`${card.rank}-${card.suit}-${i}`} card={card} size="md" />
          ))}
        </div>
      </div>
      </div>
    </GlassPanel>
  );
}
