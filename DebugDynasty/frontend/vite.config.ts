import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Polyfill Node's `global` for sockjs-client (CommonJS lib) in the browser
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: true
  }
})
