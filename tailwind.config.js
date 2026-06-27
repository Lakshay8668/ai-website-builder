export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          400: '#6b8fff',
          500: '#4a6cf7',
          600: '#3451d1',
          700: '#2640a8',
        }
      }
    },
  },
  plugins: [],
}
