// vite.config.js

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite"; // 1. Import the plugin

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Add the plugin to the array
  ],
  define: {
    global: "globalThis",
  },
  build: {
    outDir: "lib/static",
    rollupOptions: {
      input: {
        m365agents: resolve(__dirname, "src/static/scripts/m365agents.ts"),
        app: resolve(__dirname, "src/static/scripts/app.tsx"),
        styles: resolve(__dirname, "src/static/styles/custom.css"),
      },
      output: {
        entryFileNames: "scripts/[name].js",
        chunkFileNames: "scripts/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'styles/app.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
