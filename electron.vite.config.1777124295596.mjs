// electron.vite.config.mjs
import { defineConfig } from "electron-vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
var __electron_vite_injected_dirname = "C:\\Users\\aiden\\Documents\\Github\\Prism Profile Manager";
var electron_vite_config_default = defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [svelte()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/renderer/index.html"),
          import: resolve(__electron_vite_injected_dirname, "src/renderer/import.html"),
          export: resolve(__electron_vite_injected_dirname, "src/renderer/export.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
