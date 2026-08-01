/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./services/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Paleta cívica (equivalente dark de apps/web/src/index.css, oklch -> hex)
        civic: {
          background: "#0e1524",
          card: "#162037",
          cardhover: "#1b2742",
          foreground: "#edf1f7",
          primary: "#5b8aff",
          "primary-foreground": "#0d1420",
          secondary: "#1c2639",
          "secondary-foreground": "#edf1f7",
          muted: "#1c2639",
          "muted-foreground": "#a8b2c7",
          accent: "#e6b23f",
          "accent-foreground": "#332308",
          destructive: "#e0554a",
          "destructive-foreground": "#ffffff",
          ring: "#5b8aff",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
