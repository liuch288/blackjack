import { ReactNode, CSSProperties, RefObject, useEffect, useRef, MouseEventHandler } from 'react';

type Variant = 'subtle' | 'normal' | 'strong' | 'extreme' | 'frosted';

interface GlassPanelProps {
  children: ReactNode;
  variant?: Variant;
  cornerRadius?: number;
  /** 鼠标容器，限定全局 mouse 跟踪范围 */
  mouseContainer?: RefObject<HTMLElement | null>;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
  interactive?: boolean;
  enableSpotlight?: boolean;
}

const VARIANT_CONFIG: Record<Variant, {
  bgAlpha: number;
  bgColor: [number, number, number];
  borderAlpha: number;
  blur: number;
  saturate: number;
  glow: number;
  shadow: string;
  hoverScale: number;
  spotlightAlpha: number;
  hoverAlpha: number;
}> = {
  subtle: {
    bgAlpha: 0.05, bgColor: [255, 255, 255], borderAlpha: 0.12, blur: 14, saturate: 180, glow: 0.4,
    shadow: '0 6px 24px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)',
    hoverScale: 1.0, spotlightAlpha: 0.07, hoverAlpha: 0.14,
  },
  normal: {
    bgAlpha: 0.08, bgColor: [255, 255, 255], borderAlpha: 0.18, blur: 18, saturate: 200, glow: 0.6,
    shadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.25)',
    hoverScale: 1.025, spotlightAlpha: 0.08, hoverAlpha: 0.24,
  },
  strong: {
    bgAlpha: 0.12, bgColor: [255, 255, 255], borderAlpha: 0.24, blur: 26, saturate: 220, glow: 0.8,
    shadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.32)',
    hoverScale: 1.0, spotlightAlpha: 0.06, hoverAlpha: 0.18,
  },
  extreme: {
    bgAlpha: 0.16, bgColor: [255, 255, 255], borderAlpha: 0.3, blur: 32, saturate: 240, glow: 1.0,
    shadow: '0 28px 80px rgba(0, 0, 0, 0.6), 0 6px 20px rgba(0, 0, 0, 0.4)',
    hoverScale: 1.0, spotlightAlpha: 0.1, hoverAlpha: 0.28,
  },
  frosted: {
    bgAlpha: 0.45, bgColor: [10, 18, 14], borderAlpha: 0.3, blur: 24, saturate: 130, glow: 0.5,
    shadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
    hoverScale: 1.0, spotlightAlpha: 0.03, hoverAlpha: 0.08,
  },
};

export function GlassPanel({
  children,
  variant = 'normal',
  cornerRadius = 24,
  mouseContainer,
  className = '',
  style,
  onClick,
  interactive = true,
  enableSpotlight = true,
}: GlassPanelProps) {
  const config = VARIANT_CONFIG[variant];
  const ref = useRef<HTMLDivElement>(null);

  // === 全局 spotlight：跟踪整页鼠标，写入 --glass-mx/my ===
  useEffect(() => {
    if (!enableSpotlight) return;
    const root = mouseContainer?.current ?? document.body;
    let raf = 0;
    let lastX = 0;
    let lastY = 0;
    const apply = () => {
      raf = 0;
      document.documentElement.style.setProperty('--glass-mx', `${lastX}px`);
      document.documentElement.style.setProperty('--glass-my', `${lastY}px`);
    };
    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    root.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      root.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mouseContainer, enableSpotlight]);

  // === 局部 hover 高光：监听本元素内的 mousemove，写入 --glass-lx/ly ===
  // 不依赖 React state —— 浏览器原生 :hover 伪类 + 直接写 ref style，
  // 既避免每帧 re-render，也保证 hover 高光位置始终跟随鼠标。
  const onLocalMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty('--glass-lx', `${x}%`);
    ref.current.style.setProperty('--glass-ly', `${y}%`);
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={onLocalMove}
      onMouseMove={onLocalMove}
      className={`relative ${className} glass-panel ${interactive && config.hoverScale > 1 ? 'cursor-pointer' : ''}`}
      style={{
        borderRadius: cornerRadius,
        // 初始高光位置在中心；onMouseEnter 触发时立即覆盖为真实位置
        // CSS 变量用 as any 绕过 React 18 类型限制（React 19 原生支持）
        ...( {
          '--glass-lx': '50%',
          '--glass-ly': '50%',
          '--glass-hover-scale': config.hoverScale > 1 ? String(config.hoverScale) : '1',
        } as Record<string, string> ),
        ...style,
      }}
    >
      {/* 第 1 层：主玻璃面板 */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: cornerRadius,
          background: `rgba(${config.bgColor.join(', ')}, ${config.bgAlpha})`,
          backdropFilter: `blur(${config.blur}px) saturate(${config.saturate}%)`,
          WebkitBackdropFilter: `blur(${config.blur}px) saturate(${config.saturate}%)`,
          border: `1px solid rgba(255, 255, 255, ${config.borderAlpha})`,
          boxShadow: `
            ${config.shadow},
            inset 0 1px 0 rgba(255, 255, 255, ${0.18 + config.glow * 0.18}),
            inset 0 -1px 0 rgba(0, 0, 0, 0.18)
          `,
        }}
      />

      {/* 第 2 层：全局 spotlight —— 跟着整页鼠标走 */}
      {enableSpotlight && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: cornerRadius,
            background: `radial-gradient(
              380px circle at var(--glass-mx, 50%) var(--glass-my, 50%),
              rgba(255, 255, 255, ${config.spotlightAlpha}) 0%,
              rgba(255, 255, 255, ${config.spotlightAlpha * 0.4}) 30%,
              transparent 65%
            )`,
            mixBlendMode: 'plus-lighter',
          }}
        />
      )}

      {/* 第 3 层：局部 hover 高光 —— 跟着本元素内鼠标走
          opacity 由 :hover 伪类控制（0 ↔ 1），不依赖 React state
          位置由 JS mousemove 持续更新 --glass-lx/ly */}
      {interactive && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none glass-panel-hover"
          style={{
            borderRadius: cornerRadius,
            background: `radial-gradient(
              220px circle at var(--glass-lx, 50%) var(--glass-ly, 50%),
              rgba(255, 255, 255, ${config.hoverAlpha}) 0%,
              rgba(255, 255, 255, ${config.hoverAlpha * 0.5}) 30%,
              transparent 70%
            )`,
            mixBlendMode: 'screen',
            // 关键：进入 250ms 淡入，离开 500ms 慢淡出
            // 位置变化用 background transition 平滑跟随
            transition: 'opacity 250ms ease-out, background-position 700ms ease-out, background-size 700ms ease-out',
          }}
        />
      )}

      {/* 第 4 层：顶部反光条 */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: '45%',
          borderTopLeftRadius: cornerRadius,
          borderTopRightRadius: cornerRadius,
          background: `linear-gradient(
            180deg,
            rgba(255, 255, 255, ${0.1 + config.glow * 0.08}) 0%,
            transparent 100%
          )`,
        }}
      />

      {/* 第 5 层：底边暗带 */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '20%',
          borderBottomLeftRadius: cornerRadius,
          borderBottomRightRadius: cornerRadius,
          background: `linear-gradient(
            0deg,
            rgba(0, 0, 0, ${0.15 + config.glow * 0.1}) 0%,
            transparent 100%
          )`,
        }}
      />

      {/* 内容层 */}
      <div className="relative z-10" style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}
