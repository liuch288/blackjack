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
    rank: 'text-4xl',
    suit: 'text-4xl',
  },
  md: {
    container: 'w-16 h-24 sm:w-20 sm:h-28',
    rank: 'text-5xl sm:text-6xl',
    suit: 'text-5xl sm:text-6xl',
  },
  lg: {
    container: 'w-24 h-36',
    rank: 'text-7xl',
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
      {/* 数字：右上角，右对齐保证不同字符宽度下右缘统一 */}
      <span
        className={`absolute ${s.rank} font-black leading-none`}
        style={{
          fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif",
          fontWeight: 800,
          letterSpacing: '-0.04em',
          top: 2,
          right: 4,
          textAlign: 'right',
          lineHeight: 0.75,
        }}
      >
        {card.rank}
      </span>
      {/* 花色：左下角，左对齐 */}
      <span
        className={`absolute ${s.suit} leading-none`}
        style={{
          textShadow: '0 2px 3px rgba(0,0,0,0.3), 0 -1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(0,0,0,0.15)',
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
