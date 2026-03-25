/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1215',
        panel: '#1F2933',
        eco: '#4ADE80',
        dataBlue: '#60A5FA',
        dataOrange: '#F97316',
      },
      fontFamily: {
        technical: ['Inter', 'IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
