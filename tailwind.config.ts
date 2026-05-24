// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],

  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1440px",
      },
    },

    extend: {
      /* =========================================
       * SAFE AREA
       * ========================================= */
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",

        "safe-bottom-nav":
          "calc(var(--bottom-nav-h, 5.5rem) + env(safe-area-inset-bottom) + 0.75rem)",
      },

      /* =========================================
       * COLORS
       * ========================================= */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        /* PHONARA CORE */
        neon: {
          gold: "#E8B923",
          cyan: "#22E0FF",
          purple: "#8B5CF6",
          pink: "#FF4DDF",
        },

        primary: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
          glow: "#A78BFA",
        },

        secondary: {
          DEFAULT: "#111827",
          foreground: "#FFFFFF",
        },

        accent: {
          DEFAULT: "#DB4DFF",
          foreground: "#FFFFFF",
        },

        "real-cyan": {
          DEFAULT: "#22E0FF",
          foreground: "#041018",
        },

        "sim-gold": {
          DEFAULT: "#E8B923",
          foreground: "#1A1405",
        },

        surface: {
          DEFAULT: "#080B14",
          elevated: "#0F1424",
          glass: "rgba(12,10,24,.72)",
          card: "#101525",
        },

        glass: {
          DEFAULT: "rgba(12,10,24,.72)",
          border: "rgba(255,255,255,.08)",
          strong: "rgba(255,255,255,.14)",
        },

        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",

        rarity: {
          common: "#94A3B8",
          rare: "#3B82F6",
          epic: "#A855F7",
          legendary: "#F59E0B",
        },

        muted: {
          DEFAULT: "#9CA3AF",
          foreground: "#D1D5DB",
        },

        popover: {
          DEFAULT: "#090B14",
          foreground: "#FFFFFF",
        },

        card: {
          DEFAULT: "#0B0E17",
          foreground: "#FFFFFF",
        },
      },

      /* =========================================
       * BACKGROUND IMAGES
       * ========================================= */
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg,#5B7CFF 0%,#8D4DFF 50%,#DB4DFF 100%)",

        "gradient-cyber":
          "linear-gradient(135deg,#22E0FF 0%,#8B5CF6 50%,#DB4DFF 100%)",

        "gradient-gold":
          "linear-gradient(135deg,#E8B923 0%,#F5D76E 100%)",

        "gradient-glass":
          "linear-gradient(to bottom right,rgba(255,255,255,.08),rgba(255,255,255,.02))",

        "gradient-aurora":
          "radial-gradient(circle at top left,rgba(168,85,247,.25),transparent 30%), radial-gradient(circle at bottom right,rgba(34,224,255,.18),transparent 35%)",
      },

      /* =========================================
       * SHADOWS
       * ========================================= */
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,.45)",

        "card-hover":
          "0 25px 50px -12px rgba(0,0,0,.55)",

        "neon-purple":
          "0 0 15px rgba(139,92,246,.55), 0 0 35px rgba(139,92,246,.35)",

        "neon-cyan":
          "0 0 15px rgba(34,224,255,.55), 0 0 35px rgba(34,224,255,.35)",

        "neon-gold":
          "0 0 20px rgba(232,185,35,.55), 0 0 45px rgba(232,185,35,.35)",

        "neon-soft":
          "0 0 10px rgba(139,92,246,.35)",

        hero: "0 40px 120px rgba(0,0,0,.75)",
      },

      /* =========================================
       * BORDER RADIUS
       * ========================================= */
      borderRadius: {
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        "3xl": "3rem",
      },

      /* =========================================
       * FONT
       * ========================================= */
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],

        display: [
          "Pretendard Variable",
          "Pretendard",
          "sans-serif",
        ],

        mono: ["JetBrains Mono", "monospace"],
      },

      /* =========================================
       * KEYFRAMES
       * ========================================= */
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },

        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },

        "gentle-pulse": {
          "0%,100%": {
            opacity: "1",
            transform: "scale(1)",
          },

          "50%": {
            opacity: ".88",
            transform: "scale(1.015)",
          },
        },

        "neon-pulse": {
          "0%,100%": {
            opacity: "1",
            filter: "brightness(1)",
          },

          "50%": {
            opacity: ".88",
            filter: "brightness(1.15)",
          },
        },

        "aurora-shift": {
          "0%": {
            backgroundPosition: "0% 50%",
          },

          "50%": {
            backgroundPosition: "100% 50%",
          },

          "100%": {
            backgroundPosition: "0% 50%",
          },
        },

        float: {
          "0%,100%": {
            transform: "translateY(0px)",
          },

          "50%": {
            transform: "translateY(-10px)",
          },
        },

        marquee: {
          "0%": {
            transform: "translateX(0)",
          },

          "100%": {
            transform: "translateX(-50%)",
          },
        },

        "balance-pop": {
          "0%": {
            transform: "scale(1)",
          },

          "50%": {
            transform: "scale(1.12)",
          },

          "100%": {
            transform: "scale(1)",
          },
        },

        "strong-shake": {
          "0%,100%": {
            transform: "translate3d(0,0,0)",
          },

          "20%": {
            transform: "translate3d(-1.5px,.5px,0)",
          },

          "40%": {
            transform: "translate3d(1.5px,-.5px,0)",
          },

          "60%": {
            transform: "translate3d(-1px,.5px,0)",
          },

          "80%": {
            transform: "translate3d(1px,-.5px,0)",
          },
        },
      },

      /* =========================================
       * ANIMATIONS
       * ========================================= */
      animation: {
        "accordion-down":
          "accordion-down .2s ease-out",

        "accordion-up":
          "accordion-up .2s ease-out",

        "gentle-pulse":
          "gentle-pulse 3s ease-in-out infinite",

        "neon-pulse":
          "neon-pulse 2s ease-in-out infinite",

        aurora:
          "aurora-shift 15s ease infinite",

        float:
          "float 5s ease-in-out infinite",

        marquee:
          "marquee 30s linear infinite",

        "balance-pop":
          "balance-pop .4s ease-out",

        "strong-shake":
          "strong-shake .7s cubic-bezier(.36,.07,.19,.97) both",
      },

      /* =========================================
       * EXTRA
       * ========================================= */
      backdropBlur: {
        xs: "2px",
      },

      maxWidth: {
        "8xl": "1600px",
      },

      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
    },
  },

  plugins: [
    function ({ addVariant }: any) {
      /* DEVICE PERFORMANCE */

      addVariant(
        "low",
        '&:where([data-device="low"] *, [data-device="low"]&)',
      );

      addVariant(
        "mid",
        '&:where([data-device="mid"] *, [data-device="mid"]&)',
      );

      addVariant(
        "high",
        '&:where([data-device="high"] *, [data-device="high"]&)',
      );

      addVariant(
        "degrade",
        '&:where([data-degrade="1"] *, [data-degrade="1"]&)',
      );

      addVariant(
        "motion-safe-low",
        "@media (prefers-reduced-motion: reduce)",
      );
    },
  ],
};

export default config;