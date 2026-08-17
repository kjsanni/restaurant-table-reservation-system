import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/stores/auth";
import { vHoverLift, vTapScale } from "@/directives/motion";
import "./assets/design-system.css";
import "./assets/main.css";
import "./assets/settings.css";

const vuesticConfig = {
  config: {
    colors: {
      variables: {
        primary: "var(--brand-700)",
        secondary: "var(--neutral-600)",
        success: "var(--earth-500)",
        info: "var(--sky-500)",
        danger: "var(--rose-500)",
        warning: "var(--accent-500)",
        backgroundPrimary: "var(--background)",
        backgroundSecondary: "var(--surface)",
        backgroundElement: "var(--surface)",
        backgroundBorder: "var(--border)",
        textPrimary: "var(--ink)",
        textInverted: "var(--white)",
        shadow: "rgba(26, 20, 16, 0.08)",
        focus: "var(--accent-500)",
        transparent: "rgba(0, 0, 0, 0)",
        white: "var(--white)",
      },
    },
    components: {
      all: {
        borderRadius: { defaultValue: "var(--radius-lg)" },
      },
      presets: {
        VaButton: {
          primary: { color: "primary", size: "medium" },
          secondary: { color: "secondary", size: "medium" },
          danger: { color: "danger", size: "medium" },
        },
        VaCard: {
          default: { radius: "lg", shadow: true } as any,
        },
        VaInput: {
          default: { size: "large" } as any,
        },
      },
    },
  } as any,
};

async function bootstrap() {
  const pinia = createPinia();
  const app = createApp(App);

  app.use(pinia);

  app.directive("hover-lift", vHoverLift);
  app.directive("tap-scale", vTapScale);

  const authStore = useAuthStore();
  await authStore.init();

  app.use(router);
  app.use(createVuestic(vuesticConfig));

  app.mount("#app");
}

bootstrap();

async function unregisterExistingServiceWorker() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isSecure) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
  }
}

if (import.meta.env.DEV) {
  unregisterExistingServiceWorker();
} else {
  registerServiceWorker();
}
