/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        bb: {
          bg: "#FFFDF6",
          surface: "#FFFFFF",
          surfaceSoft: "#F2F4F7",
          text: "#1A1C1E",
          textSoft: "#667085",
          muted: "#98A2B3",
          border: "#afb0b3",
          primary: "#FDC836",
          primarySoft: "#fcd056",
          secondary: "#000000",
          danger: "#EF4444",
          warning: "#F59E0B",
          info: "#0EA5E9",
          hover:"#FEE9AF",
          coloredborder:"#E5D8B2",
        },
      },
      boxShadow: {
        "bb-card": "0 2px 6px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        'ws-flash': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
          '25%': { boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
          '75%': { boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5)' },
        },
      },
      animation: {
        'ws-flash': 'ws-flash 2s ease-in-out',
      },
    },
  },
  plugins: [],
};
