// vite.config.ts (at repo root or inside client/ — see note below)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // If your frontend code lives in ./client (recommended), set root:
  root: path.resolve(__dirname, "client"),
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    // Do NOT proxy in dev - frontend calls backend directly
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "client/dist"),
    emptyOutDir: true,
  },
});
