import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#000000",
        surface: "#050505",
        elevated: "#0a0a0a",
        primary: "#FFFFFF",
        secondary: "#A1A1AA",
        muted: "#52525B",
        accent: "#3B82F6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        headline: "-0.04em",
        body: "-0.01em",
        label: "0.05em",
      },
      borderRadius: {
        card: "16px",
        btn: "8px",
      },
      boxShadow: {
        "glow-accent": "0 0 40px -10px rgba(59,130,246,0.4)",
        "card-hover": "0 20px 40px -20px rgba(0,0,0,0.8)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
