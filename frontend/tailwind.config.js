/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#0a0f1d',
          navy: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          amber: '#f59e0b',
          emerald: '#10b981',
          cyan: '#06b6d4',
          indigo: '#6366f1',
          rose: '#f43f5e'
        }
      }
    },
  },
  plugins: [],
}
