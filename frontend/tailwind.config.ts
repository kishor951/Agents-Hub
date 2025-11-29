import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Futuristic Glassmorphism Palette
        primary: {
          DEFAULT: '#00F0FF',  // Electric Cyan
          50: '#E0FEFF',
          100: '#C1FDFF',
          200: '#83FBFF',
          300: '#45F9FF',
          400: '#07F7FF',
          500: '#00F0FF',
          600: '#00C0D1',
          700: '#0090A3',
          800: '#006075',
          900: '#003047',
        },
        secondary: {
          DEFAULT: '#FFFFFF',  // White
          50: '#FFFFFF',
          100: '#F7F7F7',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#FFFFFF',
          600: '#D1D1D1',
          700: '#A3A3A3',
          800: '#757575',
          900: '#474747',
        },
        accent: {
          DEFAULT: '#20E3B2',  // Turquoise
          50: '#E0FFF5',
          100: '#C1FFEB',
          200: '#83FFD7',
          300: '#45FFC3',
          400: '#07FFAF',
          500: '#20E3B2',
          600: '#1AB28E',
          700: '#14826A',
          800: '#0E5146',
          900: '#082123',
        },
        danger: '#FF5252',
        warning: '#F4D03F',

        // Backgrounds - Deep Gunmetal/Obsidian
        'bg-base': '#0A0B10',
        'bg-secondary': '#14141F',
        'bg-surface': 'rgba(20, 20, 31, 0.6)',
        'bg-surface-alt': 'rgba(30, 30, 45, 0.4)',

        // Text
        'text-primary': '#FFFFFF',
        'text-secondary': '#8F90A6',
        'text-disabled': '#6B7280',

        // Borders
        'border-color': 'rgba(255, 255, 255, 0.1)',
      },
      backgroundColor: {
        base: '#0A0B10',
        surface: 'rgba(20, 20, 31, 0.6)',
        'surface-alt': 'rgba(30, 30, 45, 0.4)',
      },
      textColor: {
        primary: '#FFFFFF',
        secondary: '#8F90A6',
        disabled: '#6B7280',
      },
      borderColor: {
        'color': 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        headline: ['Tomorrow', 'Space Mono', 'sans-serif'],
        primary: ['Space Mono', 'Inter', 'sans-serif'],
        mono: ['Space Mono', 'JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        hero: ['72px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.03em' }],
        h1: ['48px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        h2: ['32px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
        h3: ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        subtitle: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.05em' }],
        micro: ['10px', { lineHeight: '1.5', fontWeight: '500' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        xs: '4px',
        s: '8px',
        m: '16px',
        l: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        pill: '100px',
      },
      boxShadow: {
        sm: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        md: '0px 4px 16px rgba(0, 0, 0, 0.35)',
        lg: '0px 8px 24px rgba(0, 0, 0, 0.4)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2)',
        'glow-cyan-strong': '0 0 30px rgba(0, 240, 255, 0.8), 0 0 60px rgba(0, 240, 255, 0.5)',
        'glow-white-strong': '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)',
      },
      backdropBlur: {
        glass: '10px',
        'glass-strong': '20px',
      },
      animation: {
        'fusion-spin': 'fusion-spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'holographic-shine': 'holographic-shine 4s ease-in-out infinite',
      },
      keyframes: {
        'fusion-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'holographic-shine': {
          '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
          '100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
