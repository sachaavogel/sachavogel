/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cartoon: {
          primary: '#FF6B6B',      // Coral red (for highlights)
          secondary: '#4ECDC4',    // Teal (for accents)
          accent: '#FFE66D',       // Yellow (for cheerful elements)
          success: '#95CD41',      // Green (for completion)
          warning: '#FFA07A',      // Light orange (for attention)
          bg: '#F7F9F9',           // Off-white background
          card: '#FFFFFF',         // White cards
          text: '#2C3E50',         // Dark blue-gray text
          purple: '#8B5CF6',       // Purple for variety
          pink: '#EC4899',         // Pink for variety
          blue: '#3B82F6',         // Blue for variety
          orange: '#F59E0B',       // Amber for highlights
        }
      },
      fontFamily: {
        'nunito': ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'cartoon': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'cartoon-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'cartoon-primary': '0 10px 25px -5px rgba(255, 107, 107, 0.3)',
        'cartoon-secondary': '0 10px 25px -5px rgba(78, 205, 196, 0.3)',
        'cartoon-accent': '0 10px 25px -5px rgba(255, 230, 109, 0.3)',
      }
    },
  },
  plugins: [],
}
