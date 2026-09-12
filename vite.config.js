import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // 0.0.0.0 — LAN IP se access (e.g. http://192.168.200.173:5173)
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/docs/**', '**/node_modules/**'],
    },
  },
})
