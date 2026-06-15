import { CardView } from './CardView';
import { Card } from '@/types';

interface Props {
  card: Card;
}

export function DealerArea({ card }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-white/60 text-sm font-medium tracking-wide uppercase">庄家明牌</div>
      <div className="flex gap-3 items-center">
        <CardView card={card} size="md" />
        <CardView card={card} size="md" faceDown />
      </div>
      <div className="text-xl font-bold">
        {card.rank}{card.suit}
      </div>
    </div>
  );
}
