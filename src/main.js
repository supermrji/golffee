import './style.css'
import { ViteSSG } from 'vite-ssg'
import { injectSpeedInsights } from '@vercel/speed-insights'
import App from './App.vue'
import Home from './pages/Home.vue'

injectSpeedInsights()

export const createApp = ViteSSG(
  App,
  {
    routes: [
      { path: '/', component: Home }
    ]
  }
)
