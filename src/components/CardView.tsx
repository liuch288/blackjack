import { Card as CardType } from '@/types';
import { isRed } from '@/engine/card';

interface Props {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
}

export function CardView({ card, size = 'md', faceDown }: Props) {
  if (faceDown) {
    return (
      <div className={`card-front bg-gradient-to-br from-blue-900 to-blue-700 border-blue-500/30
        ${size === 'sm' ? 'w-12 h-18' : size === 'lg' ? 'w-24 h-36' : 'w-16 h-24 sm:w-20 sm:h-28'}`}>
        <div className="text-blue-300/50 text-2xl">🂠</div>
      </div>
    );
  }

  const red = isRed(card);
  const sizeClass = size === 'sm' ? 'w-12 h-18 text-sm' : size === 'lg' ? 'w-24 h-36 text-2xl' : 'w-16 h-24 sm:w-20 sm:h-28 text-lg';

  return (
    <div className={`card-front ${sizeClass} ${red ? 'card-red' : 'card-black'}`}>
      <div className="flex flex-col items-center leading-none">
        <span className="font-bold">{card.rank}</span>
        <span className="text-base sm:text-xl mt-1">{card.suit}</span>
      </div>
    </div>
  );
}
