import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuestic } from 'vuestic-ui'
import 'vuestic-ui/css'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(
  createVuestic({
    config: {
      colors: {
        variables: {
          primary: '#0f172a',
          secondary: '#64748b',
          success: '#16a34a',
          info: '#0ea5e9',
          danger: '#dc2626',
          warning: '#f59e0b',
          backgroundPrimary: '#f1f5f9',
          backgroundSecondary: '#ffffff',
          backgroundElement: '#f8fafc',
          backgroundBorder: '#e2e8f0',
          textPrimary: '#0f172a',
          textInverted: '#fefdf8',
          shadow: 'rgba(15, 23, 42, 0.08)',
          focus: '#0ea5e9',
          transparent: 'rgba(0, 0, 0, 0)',
          white: '#ffffff',
        },
      },
      components: {
        all: {
          borderRadius: { defaultValue: '8px' },
        },
        presets: {
          VaButton: {
            primary: { color: 'primary', size: 'medium' },
            secondary: { color: 'secondary', size: 'medium' },
            danger: { color: 'danger', size: 'medium' },
          },
          VaCard: {
            default: { radius: 'lg', shadow: true },
          },
          VaInput: {
            default: { size: 'large' },
          },
        },
      },
    },
  }),
)

app.mount('#app')
