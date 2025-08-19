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
        'gilda': ['Gilda Display', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f4fa',
          100: '#e6edf7',
          500: '#4A90E2',
          600: '#3A80D2',
        },
        dark: {
          900: '#0D1B2A',
        },
        light: {
          50: '#FAF9F8',
        }
      },
    },
  },
  plugins: [],
}
export default config
