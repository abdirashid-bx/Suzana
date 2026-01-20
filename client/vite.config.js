import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://suzana-system.onrender.com',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://suzana-system.onrender.com',
        changeOrigin: true
      }
    }
  }
})
