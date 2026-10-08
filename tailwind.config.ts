import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "tenderhub-navy": "#071A33",
        "tenderhub-gold": "#D4AF37",
        "tenderhub-background": "#F8FAFC",
      },
    },
  },
  plugins: [],
};

export default config;