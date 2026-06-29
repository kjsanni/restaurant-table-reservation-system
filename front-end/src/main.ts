import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  createVuesticEssential,
  VaButton,
  VaInput,
  VaAlert,
  VaModal,
  VaCard,
  VaDataTable,
  VaSidebar,
  VaNavbar,
  VaLayout,
  VaForm,
  VaSelect,
  VaSwitch,
  VaChip,
  VaBadge,
  VaTooltip,
  VaSkeleton,
  VaIcon,
  VaDropdownPlugin,
  VaModalPlugin,
} from 'vuestic-ui'
import 'vuestic-ui/css'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(
  createVuesticEssential({
    components: {
      VaButton,
      VaInput,
      VaAlert,
      VaModal,
      VaCard,
      VaDataTable,
      VaSidebar,
      VaNavbar,
      VaLayout,
      VaForm,
      VaSelect,
      VaSwitch,
      VaChip,
      VaBadge,
      VaTooltip,
      VaSkeleton,
      VaIcon,
    },
    plugins: {
      VaDropdownPlugin,
      VaModalPlugin,
    },
    config: {
      colors: {
        variables: {
          primary: '#04030f',
          background: '#f8e9f2',
          text: { inverted: '#edfdfb' },
          secondary: '#686868',
          gray: '#b9bab8',
          success: '#22c55e',
          info: '#3b82f6',
          danger: '#ef4444',
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
            secondary: { preset: 'secondary', size: 'medium' },
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
