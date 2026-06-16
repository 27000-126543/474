/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        midnight: "#1A1A2E",
        deepnavy: "#16213E",
        amber: {
          400: "#F0C05A",
          500: "#E8A838",
          600: "#D4922A",
          700: "#B87A1E",
        },
        warmgray: {
          100: "#F5F0EB",
          200: "#F0EDE8",
          300: "#D4CFC8",
          400: "#A09890",
          500: "#7A7268",
          600: "#5C554C",
          700: "#3D3832",
          800: "#2A2620",
          900: "#1E1B17",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "wave": "wave 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.5)" },
          "50%": { transform: "scaleY(1.5)" },
        },
      },
    },
  },
  plugins: [],
};
