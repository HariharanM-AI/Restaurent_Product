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
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.03), 0 4px 16px -2px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
        dropdown: "0 16px 40px -8px rgba(15, 23, 42, 0.12), 0 6px 14px -4px rgba(15, 23, 42, 0.06)",
        luxury: "0 24px 48px -12px rgba(15, 23, 42, 0.14), 0 8px 20px -4px rgba(15, 23, 42, 0.06)",
        emboss: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)",
        "glow-brand": "0 0 24px -4px rgba(15, 118, 110, 0.3)",
        panel: "0 1px 0 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(16, 42, 38, 0.04), 0 8px 24px -12px rgba(16, 42, 38, 0.12)",
        "panel-hover": "0 1px 0 0 rgba(255,255,255,0.7) inset, 0 2px 4px rgba(16, 42, 38, 0.05), 0 18px 40px -16px rgba(16, 42, 38, 0.22)",
        "panel-dark": "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0, 0, 0, 0.6)",
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
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
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
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "text-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "live-ping": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "80%, 100%": { transform: "scale(2.4)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        aurora: {
          "0%": { transform: "translate3d(0,0,0) rotate(0deg) scale(1)" },
          "50%": { transform: "translate3d(4%, -3%, 0) rotate(8deg) scale(1.08)" },
          "100%": { transform: "translate3d(0,0,0) rotate(0deg) scale(1)" },
        },
        "border-spin": {
          "0%": { "--border-angle": "0deg" },
          "100%": { "--border-angle": "360deg" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "text-shimmer": "text-shimmer 2.4s linear infinite",
        "live-ping": "live-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite",
        float: "float 6s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        "border-spin": "border-spin 6s linear infinite",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "stamp-pop": "stamp-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
