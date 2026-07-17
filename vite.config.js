import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "prompt",

      includeAssets: [
        "favicon.ico",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],

      manifest: {
        name: "Cash-up Hacker",
        short_name: "Cash-up",
        description:
          "A step-by-step assistant for rebuilding a cash float and calculating takings.",

        theme_color: "#20242a",
        background_color: "#f5f6f8",

        display: "standalone",
        orientation: "portrait",

        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webp}",
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
});