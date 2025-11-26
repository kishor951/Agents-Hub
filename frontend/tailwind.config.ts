import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary & Accents
        primary: {
          DEFAULT: '#3A7BFF',
          50: '#F0F5FF',
          100: '#E0EBFF',
          200: '#C1D7FF',
          300: '#A2C3FF',
          400: '#83AFFF',
          500: '#3A7BFF',
          600: '#2E62E8',
          700: '#2349D1',
          800: '#1830BA',
          900: '#0C17A3',
        },
        secondary: {
          DEFAULT: '#7B4DFF',
          50: '#F5F0FF',
          100: '#EBE0FF',
          200: '#D7C1FF',
          300: '#C3A2FF',
          400: '#AF83FF',
          500: '#7B4DFF',
          600: '#6E3DE8',
          700: '#612DD1',
          800: '#541DBA',
          900: '#470DA3',
        },
        accent: {
          DEFAULT: '#20E3B2',
          50: '#F0FFFA',
          100: '#E0FFF5',
          200: '#C1FFEB',
          300: '#A2FFE1',
          400: '#83FFD7',
          500: '#20E3B2',
          600: '#1ACCAA',
          700: '#14B3A2',
          800: '#0E9A9A',
          900: '#088192',
        },
        danger: '#FF5252',
        warning: '#F4D03F',

        // Backgrounds
        'bg-base': '#0A0F1F',
        'bg-surface': '#161A2B',
        'bg-surface-alt': '#2C3345',

        // Text
        'text-primary': '#F5F7FA',
        'text-secondary': '#AAB1C1',
        'text-disabled': '#6B7280',

        // Borders
        'border-color': '#2C3345',
      },
      backgroundColor: {
        base: '#0A0F1F',
        surface: '#161A2B',
        'surface-alt': '#2C3345',
      },
      textColor: {
        primary: '#F5F7FA',
        secondary: '#AAB1C1',
        disabled: '#6B7280',
      },
      borderColor: {
        'color': '#2C3345',
      },
      fontFamily: {
        primary: ['Space Grotesk', 'Inter', 'sans-serif'],
        secondary: ['IBM Plex Sans', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        h1: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        subtitle: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.5', fontWeight: '500' }],
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
      },
      boxShadow: {
        sm: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        md: '0px 4px 16px rgba(0, 0, 0, 0.35)',
        lg: '0px 8px 24px rgba(0, 0, 0, 0.4)',
        glow: '0px 0px 20px rgba(58, 123, 255, 0.3)',
      },
      animation: {
        'fusion-spin': 'fusion-spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
      },
    },
  },
  plugins: [],
}

export default config
