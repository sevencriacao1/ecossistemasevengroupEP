/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        background: '#0F0F10',
        primary: {
          DEFAULT: '#DF750D',
          hover: '#E88520',
          glow: 'rgba(223, 117, 13, 0.15)'
        },
        surface: {
          DEFAULT: '#141417',
          hover: '#1A1A1D',
          active: '#202024',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        text: {
          DEFAULT: '#FFFFFF',
          muted: '#A1A1AA',
          dark: '#71717A'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(circle at 50% 0%, rgba(223, 117, 13, 0.12) 0%, rgba(15, 15, 16, 0) 60%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      boxShadow: {
        'premium': '0 24px 48px -12px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 32px rgba(223, 117, 13, 0.25)',
        'glass': 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [],
};
