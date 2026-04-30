import fs from 'fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { REGION_SLUGS } from './src/constants/regions.js'

const buildVersion = Date.now().toString()

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
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
