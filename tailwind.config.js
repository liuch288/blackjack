/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        table: {
          green: '#0d5e2e',
          dark: '#0a4a24',
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
      },
    },
  },
  plugins: [],
};
