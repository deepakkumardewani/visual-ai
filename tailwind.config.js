/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        darkBorder: '#3b0764',
        lightBorder: '#d8b4fe ',
        vSelectLight: '#6b21a8',
        vSelectDark: '#9333ea'
      },
      animation: {
        'infinite-scroll': 'infinite-scroll 25s linear infinite'
      },
      keyframes: {
        'infinite-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' }
        }
      }
    }
  },
  plugins: [],
  darkMode: 'selector',
  prefix: 'tw-'
}
