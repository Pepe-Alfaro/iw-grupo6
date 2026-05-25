import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Needed for docker-network E2E runs (Playwright hits the dev server via http://frontend:5173)
    allowedHosts: ['frontend'],
    proxy: {
      '/api': 'http://backend:8000',
      '/uploads': 'http://backend:8000',
    },
  },
})
