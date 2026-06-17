import { Card as CardType } from '@/types';
import { isRed } from '@/engine/card';

interface Props {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
}

const sizeMap = {
  sm: {
    container: 'w-12 h-[72px]',
    rank: 'text-3xl',
    suit: 'text-4xl',
  },
  md: {
    container: 'w-[72px] h-[108px] sm:w-20 sm:h-28',
    rank: 'text-4xl sm:text-5xl',
    suit: 'text-5xl sm:text-6xl',
  },
  lg: {
    container: 'w-24 h-36',
    rank: 'text-6xl',
    suit: 'text-7xl',
  },
};

export function CardView({ card, size = 'md', faceDown }: Props) {
  if (faceDown) {
    const s = sizeMap[size];
    return (
      <div className={`card-back ${s.container}`}>
        <div className="grid grid-cols-3 gap-1.5 opacity-60">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300/70" />
          ))}
        </div>
      </div>
    );
  }

  const red = isRed(card);
  const s = sizeMap[size];

  return (
    <div className={`card-front ${s.container} ${red ? 'card-red' : 'card-black'}`}>
      {/* 数字：右上角，红色/黑色玻璃字效由父容器 card-red/card-black 级联 */}
      <span
        className={`absolute ${s.rank} font-black leading-none`}
        style={{
          fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif",
          fontWeight: 800,
          letterSpacing: '-0.04em',
          top: 6,
          right: 6,
          textAlign: 'right',
          lineHeight: 0.75,
        }}
      >
        {card.rank}
      </span>
      {/* 花色：左下角，玻璃字效由父容器级联 */}
      <span
        className={`absolute ${s.suit} leading-none`}
        style={{
          bottom: 10,
          left: 2,
          textAlign: 'left',
          lineHeight: 0.75,
        }}
      >
        {card.suit}
      </span>
    </div>
  );
}
