import './style.css'
import { ViteSSG } from 'vite-ssg'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { inject } from '@vercel/analytics'
import App from './App.vue'
import Home from './pages/Home.vue'
import NotFound from './pages/NotFound.vue'

export const createApp = ViteSSG(
  App,
  {
    routes: [
      { path: '/', component: Home },
      { path: '/region/:id', component: Home },
      { path: '/:pathMatch(.*)*', component: NotFound }
    ]
  },
  ({ isClient }) => {
    if (isClient) {
      injectSpeedInsights()
      inject()
    }
  }
)
