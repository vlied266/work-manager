import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./public/**/*.{svg,ico}"],
  theme: {
    extend: {
      colors: {
        base: "#ffffff",
        "base-secondary": "#f5f5f7",
        ink: "#1d1d1f",
        "ink-secondary": "#424245",
        muted: "#86868b",
        "muted-light": "#d2d2d7",
        accent: "#0071e3",
        "accent-hover": "#0077ed",
        "accent-light": "#e8f4fd",
        success: "#30d158",
        warning: "#ff9f0a",
        error: "#ff453a",
        glass: "rgba(255, 255, 255, 0.8)",
        "glass-border": "rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        "apple-sm": "12px",
        "apple-md": "18px",
        "apple-lg": "24px",
        "apple-xl": "30px",
        "apple-full": "980px",
      },
      boxShadow: {
        "apple-sm": "0 2px 8px rgba(0, 0, 0, 0.04)",
        "apple-md": "0 4px 16px rgba(0, 0, 0, 0.08)",
        "apple-lg": "0 8px 32px rgba(0, 0, 0, 0.12)",
        glass: "0 25px 80px rgba(15, 23, 42, 0.15)",
        subtle: "0 10px 40px rgba(15, 23, 42, 0.08)",
      },
      backdropBlur: {
        glass: "20px",
      },
      letterSpacing: {
        "apple-tight": "-0.011em",
        "apple-normal": "-0.005em",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

