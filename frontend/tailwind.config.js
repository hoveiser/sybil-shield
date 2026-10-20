/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08091A",
        panel: "#0D0F27",
        panelAlt: "#111434",
        edge: "#23264D",
        cyan: "#22D3EE",
        violet: "#A78BFA",
        lime: "#A3E635",
        rose: "#FB7185",
        amber: "#FBBF24",
        mist: "#9AA0C7",
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        halo: "0 0 40px rgba(34, 211, 238, 0.18)",
        violet: "0 0 48px rgba(167, 139, 250, 0.14)",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseRing: {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.02)" },
        },
        dash: {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-60" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        sweep: "sweep 18s linear infinite",
        pulseRing: "pulseRing 4s ease-in-out infinite",
        dash: "dash 3s linear infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};
