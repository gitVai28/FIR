import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  // Add the base configuration for GitHub Pages
  base: '/FIR/', // Replace 'FIR' with your repository name
})
