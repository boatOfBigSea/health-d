
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 保留相对路径，这对 Flutter 本地服务器加载静态资源至关重要
  base: './',
  plugins: [react()],
  build: {
    assetsDir: 'assets',
    // 适配 iOS 浏览器的核心配置
    target: "es2015",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});
