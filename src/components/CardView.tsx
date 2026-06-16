import { Card as CardType } from '@/types';
import { isRed } from '@/engine/card';

interface Props {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
}

export function CardView({ card, size = 'md', faceDown }: Props) {
  if (faceDown) {
    const sizeClass = size === 'sm' ? 'w-12 h-[72px]' : size === 'lg' ? 'w-24 h-36' : 'w-16 h-24 sm:w-20 sm:h-28';
    return (
      <div className={`card-back ${sizeClass}`}>
        {/* 牌背花纹：菱形点阵，模拟真实扑克牌背 */}
        <div className="grid grid-cols-3 gap-1.5 opacity-60">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300/70" />
          ))}
        </div>
      </div>
    );
  }

  const red = isRed(card);
  const sizeClass = size === 'sm' ? 'w-12 h-[72px] text-sm' : size === 'lg' ? 'w-24 h-36 text-2xl' : 'w-16 h-24 sm:w-20 sm:h-28 text-lg';

  return (
    <div className={`card-front ${sizeClass} ${red ? 'card-red' : 'card-black'}`}>
      <div className="flex flex-col items-center leading-none">
        <span className="font-bold">{card.rank}</span>
        <span className="text-base sm:text-xl mt-1">{card.suit}</span>
      </div>
    </div>
  );
}
