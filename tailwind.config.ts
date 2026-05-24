import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B2545",
        "ink-deep": "#07182F",
        "ink-raised": "#16335C",
        strate: "#2D6A4F",
        foil: "#C9A961",
        "foil-deep": "#B89545",
        parchment: "#F5F1E8",
        "parchment-aged": "#EDE6D3",
        ledger: "#1A1A1A",
        bid: "#7AA86F",
        ask: "#C97A6F",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        tear: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        emboss:
          "0 1px 0 rgba(255,255,255,0.65) inset, 0 -1px 0 rgba(11,37,69,0.08) inset, 0 12px 32px -16px rgba(11,37,69,0.18)",
        foil: "0 2px 0 rgba(201,169,97,0.35), 0 8px 24px -12px rgba(201,169,97,0.55)",
        panel:
          "0 1px 0 rgba(245,241,232,0.06) inset, 0 24px 60px -28px rgba(0,0,0,0.55), 0 12px 24px -20px rgba(0,0,0,0.40)",
      },
    },
  },
  plugins: [],
};
export default config;
