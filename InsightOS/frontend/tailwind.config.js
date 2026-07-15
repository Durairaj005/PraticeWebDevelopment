/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",     // Blue
        secondary: "#7C3AED",   // Purple
        success: "#10B981",     // Green
        warning: "#F59E0B",     // Orange
        danger: "#EF4444",      // Red
        background: "#F8FAFC",  // Light Gray
        slate: "#0F172A",       // Dark Slate (Dark Mode bg)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
