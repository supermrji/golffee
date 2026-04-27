import './style.css'
import { ViteSSG } from 'vite-ssg'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { inject } from '@vercel/analytics'
import App from './App.vue'
import Home from './pages/Home.vue'
import Region from './pages/Region.vue'

export const createApp = ViteSSG(
  App,
  {
    routes: [
      { path: '/', component: Home },
      { path: '/region/:id', component: Region }
    ]
  },
  ({ isClient }) => {
    if (isClient) {
      injectSpeedInsights()
      inject()
    }
  }
)
