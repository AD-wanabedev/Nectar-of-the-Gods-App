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
          peach: '#fdcca6', // Original Peach
          white: '#f6f2e9', // Original Off-White
          gold: '#a07b32', // Original Gold
        },
        gold: {
          50: '#FFFBEB',
          100: '#FFF9E6',
          200: '#FEF3C7',
          300: '#F4D03F',
          400: '#E5BE2E',
          500: '#D4AF37',
          600: '#B8860B',
          700: '#9A7109',
          800: '#6B5416',
          900: '#4A3A0F'
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
