/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Use class-based dark mode so NativeWind doesn't clash with the browser's media observer
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
