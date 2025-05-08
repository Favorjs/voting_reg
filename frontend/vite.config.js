import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    port: 3001
  },
  resolve: {
    alias: {
      // optional: configure if you use @/ for imports
      '@': '/src'
    }
  }
})
