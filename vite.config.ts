import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径：兼容 GitHub Pages 的 /<repo>/ 子路径，无需写死仓库名
  base: './',
  plugins: [react(), tailwindcss()],
})
