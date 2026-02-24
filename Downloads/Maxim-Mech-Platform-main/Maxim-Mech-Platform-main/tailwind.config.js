/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6fc',
          100: '#d9eaf8',
          200: '#b8daf2',
          300: '#87c3e9',
          400: '#50a5db',
          500: '#2d8acc',
          600: '#1e6eaf',
          700: '#19588e',
          800: '#184b75',
          900: '#0f3d7a',
          950: '#0c2750',
        },
        neutral: {
          850: '#1e293b',
          925: '#0f172a',
          950: '#0a0e17',
        },
        surface: {
          light: '#f8fafc',
          'light-elevated': '#ffffff',
          dark: '#131c2e',
          'dark-elevated': '#1a2332',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        'display-lg': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgb(0 0 0 / 0.06), 0 10px 20px -2px rgb(0 0 0 / 0.04)',
        'soft-lg': '0 20px 40px -12px rgb(0 0 0 / 0.12), 0 8px 16px -8px rgb(0 0 0 / 0.08)',
        glow: '0 0 0 1px rgb(255 255 255 / 0.05), 0 8px 24px -4px rgb(0 0 0 / 0.15)',
        'glow-brand': '0 0 0 1px rgb(30 110 175 / 0.2), 0 8px 24px -4px rgb(30 110 175 / 0.25)',
        'dark-soft': '0 2px 20px -4px rgb(0 0 0 / 0.4), 0 0 0 1px rgb(255 255 255 / 0.03)',
        'dark-glow': '0 0 0 1px rgb(59 130 246 / 0.08), 0 8px 30px -8px rgb(0 0 0 / 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, var(--tw-gradient-from) 0%, var(--tw-gradient-via) 50%, var(--tw-gradient-to) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      transitionDuration: { '250': '250ms' },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
