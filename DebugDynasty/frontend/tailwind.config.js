/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'stormy-teal': {
          DEFAULT: '#086375',
          light: '#0c8fa9',
          dark: '#043b46',
        },
        'turquoise': {
          DEFAULT: '#1dd3b0',
          light: '#56edd0',
          dark: '#149d82',
        },
        'green-yellow': {
          DEFAULT: '#affc41',
          light: '#c6ff6b',
          dark: '#87cd1a',
        },
        'light-green': {
          DEFAULT: '#b2ff9e',
          light: '#d2ffc6',
          dark: '#8ae274',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
