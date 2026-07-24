/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/canvas/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/editor/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/graph/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // We'll define specific colors if needed, but we will mostly rely on CSS variables for full theme flexibility
      }
    },
  },
  plugins: [],
}
