import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// five pages: the landing page, the release history at /updates, the maker's story at /story,
// the install help at /install and the AI connect help at /connect
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        updates: resolve(import.meta.dirname, 'updates.html'),
        story: resolve(import.meta.dirname, 'story.html'),
        install: resolve(import.meta.dirname, 'install.html'),
        connect: resolve(import.meta.dirname, 'connect.html'),
      },
    },
  },
})
