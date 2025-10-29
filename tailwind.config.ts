import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
      colors: {
        // NextNest Brand Colors
        'nn-gold': '#FFB800',
        'nn-gold-soft': '#F4B942',
        'nn-grey-dark': '#1C1C1E',
        'nn-grey-medium': '#8E8E93',
        'nn-grey-light': '#F5F5F7',
        'nn-blue': '#0F4C75',
        'nn-red': '#DC2626',
        'nn-green': '#059669',

        // Bloomberg/Sophisticated Flow Colors
        'ink': '#0A0A0A',
        'charcoal': '#1C1C1C',
        'graphite': '#374151',
        'silver': '#8E8E93',
        'pearl': '#C7C7CC',
        'fog': '#E5E5EA',
        'mist': '#F2F2F7',
        'gold': {
          DEFAULT: '#FCD34D',
          dark: '#F59E0B',
          pale: '#FEF3C7',
        },
        'emerald': '#10B981',
        'ruby': '#EF4444',
      },
      backgroundImage: {
        'nn-gradient-gold': 'linear-gradient(135deg, #FFB800 0%, #F4B942 100%)',
        'nn-gradient-calculation': 'linear-gradient(90deg, rgba(255, 184, 0, 0.1) 0%, rgba(15, 76, 117, 0.1) 100%)',
        'nn-gradient-trust': 'linear-gradient(90deg, rgba(15, 76, 117, 0.05) 0%, rgba(15, 76, 117, 0.1) 100%)',
        'hero-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F2F2F7 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
      },
      boxShadow: {
        'nn-soft': '0 4px 12px rgba(28, 28, 30, 0.1)',
        'nn-medium': '0 8px 24px rgba(28, 28, 30, 0.15)',
        'nn-strong': '0 12px 40px rgba(28, 28, 30, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config
