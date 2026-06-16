/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        table: {
          green: '#0a4a24',
          dark: '#062e16',
          felt: '#0f6b35',
        },
        card: {
          red: '#dc2626',
          black: '#1f2937',
        },
        action: {
          hit: '#3b82f6',
          stand: '#22c55e',
          double: '#f59e0b',
          split: '#a855f7',
          surrender: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'count-up': 'countUp 0.6s ease-out',
        'flip': 'flip 0.5s ease-in-out',
        'slide-scale-left': 'slideScaleLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-scale-right': 'slideScaleRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'exit-left': 'exitLeft 0.35s ease-in forwards',
        'exit-right': 'exitRight 0.35s ease-in forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'glass-rise': 'glassRise 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flip: {
          '0%': { transform: 'perspective(600px) rotateY(0deg)' },
          '50%': { transform: 'perspective(600px) rotateY(90deg)' },
          '100%': { transform: 'perspective(600px) rotateY(0deg)' },
        },
        slideScaleLeft: {
          '0%': { transform: 'translateX(-80px) scale(0.85)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        slideScaleRight: {
          '0%': { transform: 'translateX(80px) scale(0.85)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        exitLeft: {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateX(-60px) scale(0.9)', opacity: '0' },
        },
        exitRight: {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateX(60px) scale(0.9)', opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(34, 197, 94, 0.3), 0 0 15px rgba(34, 197, 94, 0.1)' },
          '50%': { boxShadow: '0 0 12px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.2)' },
        },
        glassRise: {
          '0%': { transform: 'translateY(28px) scale(0.94)', opacity: '0', filter: 'blur(6px)' },
          '60%': { opacity: '1', filter: 'blur(0px)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1', filter: 'blur(0px)' },
        },
      },
    },
  },
  plugins: [],
};
