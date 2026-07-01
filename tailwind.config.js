/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E8F0FE',
          100: '#C7DFFB',
          200: '#8BB9F7',
          300: '#4E93F2',
          400: '#2170E8',
          500: '#034EA1',
          600: '#004080',
          700: '#003366',
          800: '#00264D',
          900: '#001A33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
        button: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(3,78,161,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px -4px rgba(3,78,161,0.10)',
        button: '0 4px 12px rgba(3,78,161,0.16)',
      },
    },
  },
  plugins: [],
}

