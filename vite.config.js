import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://stock-agent-dongsigi.github.io/poc_page/
export default defineConfig({
  plugins: [react()],
  base: '/poc_page/',
})
