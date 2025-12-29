import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'ishop',
        short_name: 'ishop',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#B93B7A',
        icons: [
          {
            src: 'icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg'
          },
          {
            src: 'icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*']
      }
    })
  ]
})