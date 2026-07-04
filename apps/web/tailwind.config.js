/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        darkBorder: "#3b0764",
        lightBorder: "#d8b4fe ",
        vSelectLight: "#6b21a8",
        vSelectDark: "#9333ea",
        // --- Landing: dark editorial system (DESIGN.md) ---
        canvas: "#18120E",
        surface: {
          1: "#221A14",
          2: "#2D2319",
          3: "#3A2E22",
        },
        ink: {
          DEFAULT: "#F0E8DC",
          primary: "#F0E8DC",
          muted: "#A89888",
          faint: "#6B5E51",
          "primary-light": "#1C140E",
          "muted-light": "#7A6B5E",
        },
        accent: {
          DEFAULT: "#C98A5A",
          hover: "#D9996A",
          subtle: "rgba(201, 138, 90, 0.1)",
        },
        // Gold — two-tier accent system: rare/precious highlight (DESIGN.md §2)
        gold: {
          DEFAULT: "#C9A84C",
          muted: "#9E7D35",
        },
        hairline: "#3A2E22",
        border: {
          DEFAULT: "#3A2E22",
          light: "#D9CFC6",
        },
        "canvas-light": "#FAF6F1",
        "surface-light": {
          1: "#F2EBE3",
        },
      },
      fontFamily: {
        display: ['"Young Serif"', "Georgia", "serif"],
        body: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": [
          "clamp(2.75rem, 6vw, 4.5rem)",
          { lineHeight: "1.05", letterSpacing: "-0.02em" },
        ],
        "display-xl": [
          "clamp(2.25rem, 5vw, 3.5rem)",
          { lineHeight: "1.1", letterSpacing: "-0.015em" },
        ],
        "display-lg": [
          "clamp(1.75rem, 3.5vw, 2.5rem)",
          { lineHeight: "1.15", letterSpacing: "-0.01em" },
        ],
        "display-md": ["clamp(1.375rem, 2.5vw, 1.75rem)", { lineHeight: "1.2" }],
        "body-lg": ["1.25rem", { lineHeight: "1.6" }],
        "body-base": ["1rem", { lineHeight: "1.65" }],
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],
        eyebrow: ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.18em" }],
      },
      borderRadius: {
        chip: "6px",
        card: "12px",
        "card-lg": "20px",
        sm: "6px",
        md: "12px",
        lg: "20px",
      },
      transitionDuration: {
        fast: "150ms",
        base: "300ms",
        slow: "600ms",
        crawl: "1200ms",
      },
      backgroundImage: {
        // Gold-as-material: champagne → deep-gold gradient for text-clip & borders
        "gradient-gold": "linear-gradient(135deg, #E8C96B 0%, #C9A84C 45%, #9E7D35 100%)",
        // Hairline ambient divider — transparent to gold-tint to transparent
        "accent-line": "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        elevated: "0 8px 40px rgba(0,0,0,0.55)",
        accent: "0 4px 24px rgba(201,138,90,0.2)",
        // Gold luminous glow for primary CTA
        "gold-glow": "0 0 32px rgba(201,168,76,0.35), 0 4px 16px rgba(201,168,76,0.15)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16,1,0.3,1)",
        soft: "cubic-bezier(0.4,0,0.2,1)",
      },
      maxWidth: {
        prose: "68ch",
      },
      animation: {
        "infinite-scroll": "infinite-scroll 25s linear infinite",
        "marquee-slow": "infinite-scroll 40s linear infinite",
      },
      keyframes: {
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
  darkMode: "selector",
  prefix: "tw-",
};
