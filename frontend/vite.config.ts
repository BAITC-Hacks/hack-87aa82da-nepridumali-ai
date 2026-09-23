import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/simulate": {
          target: env.API_PROXY_TARGET || "http://127.0.0.1:4000",
          changeOrigin: true,
        },
        "/analysis": {
          target: env.API_PROXY_TARGET || "http://127.0.0.1:4000",
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: { output: { manualChunks: { charts: ["recharts"] } } },
    },
  };
});
