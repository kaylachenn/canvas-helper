/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'playwrite': ['"Playwrite DE SAS"', 'cursive'],
      },
      colors: {
        'canvas-bg': '#EDE8D0',
        'canvas-blue': '#667eea',
        'canvas-blue-hover': '#5a67d8',
      }
    },
  },
  plugins: [],
}