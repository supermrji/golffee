import './style.css'
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import Home from './pages/Home.vue'

export const createApp = ViteSSG(
  App,
  {
    routes: [
      { path: '/', component: Home }
    ]
  }
)
