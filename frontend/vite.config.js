import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/simulate': 'http://localhost:3000',
      '/extinction': 'http://localhost:3000',
      '/recovery': 'http://localhost:3000',
      '/sensitivity': 'http://localhost:3000',
      '/risk-scores': 'http://localhost:3000',
      '/multi-extinction': 'http://localhost:3000'
    }
  }
})
