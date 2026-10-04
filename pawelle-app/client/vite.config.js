import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 5173,
    proxy: { '/api': `http://127.0.0.1:${process.env.PAWELLE_PORT || 3001}` },
  },
})
