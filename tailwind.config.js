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
          dark: '#050505', // Deep Onyx
          platinum: '#E5E7EB', // Cool Platinum
          gold: '#E5E7EB', // Mapped to Platinum for immediate overrides
          peach: '#fdcca6', // Keep for warmth if needed, or remove? styling consistency.
          white: '#f6f2e9',
        }
      },
      fontFamily: {
        sans: ['"Neue Haas Grotesk Display Pro"', '"Outfit"', 'sans-serif'],
        script: ['"Gatteway Signature"', '"Great Vibes"', 'cursive'],
      },
      boxShadow: {
        'glass-hover': '0 0 20px rgba(229, 231, 235, 0.1)', // Platinum glow (subtle)
      }
    },
  },
  plugins: [],
}
