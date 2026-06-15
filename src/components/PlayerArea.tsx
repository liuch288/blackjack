import { Hand } from '@/types';
import { CardView } from './CardView';
import { handLabel } from '@/engine/hand';

interface Props {
  hand: Hand;
}

export function PlayerArea({ hand }: Props) {
  const typeColors = {
    Hard: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    Soft: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Pair: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-white/60 text-sm font-medium tracking-wide uppercase">你的手牌</div>
      <div className="flex gap-2 sm:gap-3 items-center flex-wrap justify-center">
        {hand.cards.map((card, i) => (
          <CardView key={`${card.rank}-${card.suit}-${i}`} card={card} size="md" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{handLabel(hand)}</span>
        <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[hand.type]}`}>
          {hand.type === 'Hard' ? '硬牌' : hand.type === 'Soft' ? '软牌' : '对子'}
        </span>
      </div>
    </div>
  );
}
