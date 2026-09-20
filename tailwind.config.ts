import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background, #FFFFFF)",
        foreground: "var(--foreground, #0F172A)",
        muted: {
          DEFAULT: "var(--muted, #64748B)",
          foreground: "var(--muted-foreground, #94A3B8)",
        },
        surface: {
          DEFAULT: "var(--surface, #F8FAFC)",
          foreground: "var(--surface-foreground, #0F172A)",
        },
        border: "var(--border, #E2E8F0)",
        primary: {
          DEFAULT: "var(--primary, #0F766E)",
          foreground: "#FFFFFF",
        },
        brand: {
          primary: "var(--brand-primary, #0F766E)",
          secondary: "var(--brand-secondary, #F8FAFC)",
          text: "var(--brand-text, #0F172A)",
        },
        success: {
          DEFAULT: "var(--success, #16A34A)",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "var(--warning, #D97706)",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "var(--destructive, #DC2626)",
          foreground: "#FFFFFF",
        },
        accent: {
          turquoise: { DEFAULT: "#F0FDFA", border: "#CCFBF1", text: "#0F766E" },
          indigo: { DEFAULT: "#EEF2FF", border: "#E0E7FF", text: "#4338CA" },
          amber: { DEFAULT: "#FFFBEB", border: "#FEF3C7", text: "#B45309" },
          orange: { DEFAULT: "#FFF7ED", border: "#FFEDD5", text: "#C2410C" },
          purple: { DEFAULT: "#FAF5FF", border: "#F3E8FF", text: "#7E22CE" },
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.04)",
        dropdown: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        card: "20px",
        saas: "20px",
        pill: "999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "stamp-pop": {
          "0%": { transform: "scale(0.5) rotate(-15deg)", opacity: "0" },
          "70%": { transform: "scale(1.15) rotate(3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "stamp-pop": "stamp-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
