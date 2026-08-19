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
        primary: "#4a352b",
        secondary: "#7d766c",
        success: "#4d7c0f",
        info: "#3b82f6",
        danger: "#f43f5e",
        warning: "#d97706",
        backgroundPrimary: "#faf9f7",
        backgroundSecondary: "#ffffff",
        backgroundElement: "#ffffff",
        backgroundBorder: "#e7e4de",
        textPrimary: "#312e2a",
        textInverted: "#ffffff",
        shadow: "rgba(26, 20, 16, 0.08)",
        focus: "#d97706",
        transparent: "rgba(0, 0, 0, 0)",
        white: "#ffffff",
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
