import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Base relativa: el build funciona en cualquier subruta (GitHub Pages
  // sirve este proyecto en /suscripciones/) o incluso en file://.
  base: './',
  plugins: [react(), tailwindcss()],
})