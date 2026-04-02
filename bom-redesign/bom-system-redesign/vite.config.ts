import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5176,  // 更新为当前使用的端口
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        // 不再移除/api前缀，因为后端API已经配置了/api前缀
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/static": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});