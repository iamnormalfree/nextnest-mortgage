import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Palette - 95% of UI
        'ink': '#0A0A0A',
        'charcoal': '#1C1C1C',
        'graphite': '#374151',
        'silver': '#8E8E93',
        'pearl': '#C7C7CC',
        'fog': '#E5E5EA',
        'mist': '#F2F2F7',

        // Accent - 5% of UI (from logo)
        'gold': {
          DEFAULT: '#FCD34D',
          dark: '#F59E0B',
          pale: '#FEF3C7',
        },

        // Semantic (minimal use)
        'emerald': '#10B981',
        'ruby': '#EF4444',
      },
      fontFamily: {
        'sans': ['SF Pro Display', '-apple-system', 'Helvetica Neue', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': '11px',    // Labels, metadata
        'sm': '13px',    // Secondary text
        'base': '16px',  // Body text
        'lg': '20px',    // Subheadings
        'xl': '25px',    // Section headers
        '2xl': '31px',   // Page headers
        '3xl': '39px',   // Hero text
        '4xl': '49px',   // Display text
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
      },
      spacing: {
        // 8px grid system
        '0': '0px',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '8': '64px',
        '10': '80px',
        '12': '96px',
        '16': '128px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        '200': '200ms',
      },
      animation: {
        'skeleton': 'skeleton-wave 1.5s infinite',
        'counter': 'counter 2s ease-out',
      },
      keyframes: {
        'skeleton-wave': {
          'to': { left: '100%' }
        }
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.08)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config