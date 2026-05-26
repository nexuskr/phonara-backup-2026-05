import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: false,
    },
  },

  resolve: {
    alias: {
      "@": "/src",
      "@pkg": "/src/packages",
    },
  },

  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom"))
              return "vendor-react";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (
              id.includes("framer-motion") ||
              id.includes("motion-dom") ||
              id.includes("iceberg-js") ||
              id.includes("its-fine")
            )
              return "vendor-motion";
            if (id.includes("react-router-dom")) return "vendor-router";
            if (id.includes("react-i18next") || id.includes("i18next"))
              return "vendor-i18n";
            if (id.includes("lightweight-charts")) return "vendor-charts";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("sonner")) return "vendor-toast";
            if (
              id.includes("@radix-ui") ||
              id.includes("react-day-picker") ||
              id.includes("vaul") ||
              id.includes("input-otp") ||
              id.includes("embla-carousel-react") ||
              id.includes("react-resizable-panels") ||
              id.includes("cmdk") ||
              id.includes("react-hook-form") ||
              id.includes("next-themes")
            )
              return "vendor-ui";
            if (id.includes("@react-three")) return "vendor-three";
            if (
              id.includes("howler") ||
              id.includes("canvas-confetti") ||
              id.includes("idb-keyval")
            )
              return "vendor-media";
            return "vendor";
          }
        },
      },
    },
  },
});
