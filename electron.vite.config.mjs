import { defineConfig } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [svelte()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          import: resolve(__dirname, 'src/renderer/import.html'),
          export: resolve(__dirname, 'src/renderer/export.html'),
        }
      }
    }
  }
})
