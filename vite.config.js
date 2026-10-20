import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// two pages: the landing page and the release history at /updates
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        updates: resolve(import.meta.dirname, 'updates.html'),
      },
    },
  },
})
