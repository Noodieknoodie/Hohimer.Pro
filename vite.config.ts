import react from "@vitejs/plugin-react";
import { resolve } from "path";

async function getConfig() {
  const { defineConfig } = await import("vite");
  return defineConfig({
    plugins: [react()],
    define: {
      global: "globalThis",
    },
    build: {
      outDir: "lib/static",
      rollupOptions: {
        input: {
          m365agents: resolve(__dirname, "src/static/scripts/m365agents.ts"),
          app: resolve(__dirname, "src/static/scripts/app.tsx"),
          styles: resolve(__dirname, "src/static/styles/custom.css"), // Changed from app.css to custom.css
        },
        output: {
          entryFileNames: "scripts/[name].js",
          chunkFileNames: "scripts/[name].js",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'styles/app.css'; // Force output to app.css
            }
            return 'assets/[name][extname]';
          },
        },
      },
    },
  });
}

export default getConfig();