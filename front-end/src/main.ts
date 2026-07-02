import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  createVuesticEssential,
  VaButton,
  VaInput,
  VaAlert,
  VaModal,
  VaCard,
  VaCardContent,
  VaCardTitle,
  VaCardActions,
  VaDataTable,
  VaSidebar,
  VaSidebarItem,
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
  VaConfig,
  VaFileUpload,
  VaDropdown,
  VaDropdownItem,
  VaDivider,
  VaTextarea,
  VaAccordion,
  VaCollapse,
  VaCollapseItem,
  VaTabs,
  VaTab,
  VaRating,
  VaAvatar,
  VaImage,
  VaProgressBar,
  VaSpinner,
} from 'vuestic-ui'
import 'vuestic-ui/css'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const pinia = createPinia()
const app = createApp(App)

const components = {
  VaButton,
  VaInput,
  VaAlert,
  VaModal,
  VaCard,
  VaCardContent,
  VaCardTitle,
  VaCardActions,
  VaDataTable,
  VaSidebar,
  VaSidebarItem,
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
  VaConfig,
  VaFileUpload,
  VaDropdown,
  VaDropdownItem,
  VaDivider,
  VaTextarea,
  VaAccordion,
  VaCollapse,
  VaCollapseItem,
  VaTabs,
  VaTab,
  VaRating,
  VaAvatar,
  VaImage,
  VaProgressBar,
  VaSpinner,
}

Object.entries(components).forEach(([name, comp]) => {
  app.component(name, comp)
})

app.use(pinia)
app.use(router)
app.use(
  createVuesticEssential({
    config: {
      colors: {
        variables: {
          primary: '#0f172a',
          text: { inverted: '#fefdf8' },
          secondary: '#64748b',
          gray: '#94a3b8',
          success: '#16a34a',
          info: '#0ea5e9',
          danger: '#dc2626',
          warning: '#f59e0b',
          white: '#ffffff',
        },
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
  }),
)

app.mount('#app')
