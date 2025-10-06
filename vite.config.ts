import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { VantResolver } from "@vant/auto-import-resolver";
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [VantResolver()],
    }),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0", // 监听所有可用的 IP 地址
    port: 8083, // 指定端口号
    strictPort: true, // 如果端口被占用，则会报错
    proxy: {
      // 将 /api 代理到本地 Express 服务（开发环境）
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        // 保留路径，不需要重写；如需自定义可开启：
        // rewrite: (path) => path.replace(/^\/api/, '/api')
      },
    },
  },
  build: {
    assetsDir: "assets",
    rollupOptions: {
      output: {
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },
  publicDir: "public",
});
