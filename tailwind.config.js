export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#292929',
          gold: '#a07b32',
          peach: '#fdcca6',
          white: '#f6f2e9',
        }
      },
      fontFamily: {
        sans: ['"Neue Haas Grotesk Display Pro"', '"Outfit"', 'sans-serif'],
        script: ['"Gatteway Signature"', '"Great Vibes"', 'cursive'],
      },
      boxShadow: {
        'glass-hover': '0 0 20px rgba(160, 123, 50, 0.3)', // Gold glow
      }
    },
  },
  plugins: [],
}
