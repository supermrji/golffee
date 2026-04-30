import fs from 'fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { REGION_SLUGS } from './src/constants/regions.js'

const buildVersion = Date.now().toString()

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,          // 使用既有的 public/manifest.json
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,webp,ico,json}'],
        navigateFallback: null,  // 靜態站所有路由都已預渲染為 HTML
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'golffee-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: /\/src\/data\/golf_courses\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'golffee-data', networkTimeoutSeconds: 5 }
          }
        ]
      }
    }),
    {
      name: 'version-inject',
      buildStart() {
        fs.writeFileSync(
          new URL('./public/version.json', import.meta.url).pathname,
          JSON.stringify({ version: buildVersion })
        )
      }
    }
  ],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion)
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  ssgOptions: {
    includedRoutes(paths) {
      const regionSlugs = Object.keys(REGION_SLUGS)
      return [
        ...paths.flatMap(route =>
          route === '/region/:id'
            ? regionSlugs.map(id => `/region/${id}`)
            : route.includes(':pathMatch') ? [] : [route]
        ),
        '/404'
      ]
    }
  }
})
