import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      './src/tests/setupTests.js'
    ],
    coverage: {
      provider: 'istanbul'
    }
  }
  // server: {
  //   // If I want to connect through wifi on mobile
  //   host: true
  // },
})
