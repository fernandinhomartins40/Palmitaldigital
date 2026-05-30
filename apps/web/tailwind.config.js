/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        mute: 'rgb(var(--mute) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        coral: '#FF5B49',
        citrus: '#D6F24A',
        cobalt: '#3D5AFE',
        magenta: '#E94FCB',
        mint: '#5EEAD4',
        amber: '#FFB020',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Geist', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        glass: '24px',
        'glass-lg': '32px',
      },
      backdropBlur: {
        xs: '8px',
      },
      screens: {
        xs: '375px',
      },
      keyframes: {
        'reaction-float': {
          '0%': { opacity: '0', transform: 'translate(-50%, 0) scale(0.65)' },
          '18%': { opacity: '1', transform: 'translate(-50%, -18px) scale(1.15)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -72px) scale(1.85)' },
        },
        'shimmer-pulse': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.04)' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'shimmer-pulse': 'shimmer-pulse 4.5s ease-in-out infinite',
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
