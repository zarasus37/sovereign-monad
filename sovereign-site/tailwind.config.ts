import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sovereign: {
          bg: "#080808",
          panel: "#101214",
          line: "rgba(160, 160, 160, 0.16)",
          gold: "#C9A84C",
          cyan: "#00D4FF",
          text: "#FFFFFF",
          muted: "#A0A0A0",
          green: "#55e5a2",
          red: "#ff5978"
        }
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(201, 168, 76, 0.3), 0 0 40px rgba(201, 168, 76, 0.08)",
        cyan: "0 0 0 1px rgba(0, 212, 255, 0.22), 0 0 36px rgba(0, 212, 255, 0.08)"
      },
      backgroundImage: {
        grid: [
          "linear-gradient(to right, rgba(160,160,160,0.08) 1px, transparent 1px)",
          "linear-gradient(to bottom, rgba(160,160,160,0.08) 1px, transparent 1px)"
        ].join(",")
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)"],
        mono: ["var(--font-ibm-plex-mono)"]
      }
    }
  },
  plugins: []
};

export default config;
