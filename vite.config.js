import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    proxy: {
      '/hsv-api': {
        target: 'https://herzienestatenvertaling.nl',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hsv-api/, ''),
        configure: (proxy) => {
          // De HSV-site stuurt "Link: preload"-headers mee; de browser zou die
          // scripts dan op localhost proberen te laden (404-ruis in de console).
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers.link
          })
        },
      },
    },
  },
  base: '/FormatBible/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
