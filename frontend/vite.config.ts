import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// 本地开发：后端直连默认 3000（npm run dev）；Docker Compose 联调时可用 VITE_BACKEND_TARGET=http://localhost:21104
const backendTarget = process.env.VITE_BACKEND_TARGET ?? "http://localhost:3000";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 20104,
    host: "0.0.0.0",
    proxy: {
      // 前端统一请求 /api，禁止硬编码 localhost 到业务代码
      "/api": {
        target: backendTarget,
        changeOrigin: true
      }
    }
  }
});
