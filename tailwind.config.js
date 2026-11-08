/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        pixel: '4px 4px 0 #17202a, 0 0 0 3px #f4d35e',
      },
    },
  },
  plugins: [],
}
