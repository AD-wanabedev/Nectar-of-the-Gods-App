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
          dark: '#292929', // Original Charcoal
          black: '#050505', // Deep Black for background
          platinum: '#E5E7EB', // Cool Platinum
          gold: '#a07b32', // Original Gold
          peach: '#fdcca6', // Original Peach
          white: '#f6f2e9', // Original Off-White
        }
      },
      fontFamily: {
        sans: ['"Neue Haas Grotesk Display Pro"', '"Outfit"', 'sans-serif'],
        script: ['"Gatteway Signature"', '"Great Vibes"', 'cursive'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 0 20px rgba(160, 123, 50, 0.3)', // Restored Gold Glow
      }
    },
  },
  plugins: [],
}
