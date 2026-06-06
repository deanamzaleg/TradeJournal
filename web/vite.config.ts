import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,   // bind 0.0.0.0 so other devices on the LAN can reach it
    port: 5173,
  },
})
