import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              test: /node_modules\/(react|react-dom|scheduler)/,
              name: 'vendor-react',
              priority: 20,
            },
            {
              test: /node_modules/,
              name: 'vendor',
              priority: 10,
            },
            {
              name: 'app',
              minSize: 100000,
              priority: 1,
            },
          ],
        },
      },
    },
  },
})
