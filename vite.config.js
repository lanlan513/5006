import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        materials: fileURLToPath(new URL('./materials.html', import.meta.url))
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3018'
    }
  }
})
