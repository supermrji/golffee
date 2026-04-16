import './style.css'
import { ViteSSG } from 'vite-ssg'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { inject } from '@vercel/analytics'
import App from './App.vue'
import Home from './pages/Home.vue'

injectSpeedInsights()
inject()

export const createApp = ViteSSG(
  App,
  {
    routes: [
      { path: '/', component: Home }
    ]
  }
)
