import { watch, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";

const BRAND_CSS_VARS = [
  "brand-50",
  "brand-100",
  "brand-200",
  "brand-300",
  "brand-400",
  "brand-500",
  "brand-600",
  "brand-700",
  "brand-800",
  "brand-900",
];

const ACCENT_CSS_VARS = [
  "accent",
  "accent-50",
  "accent-100",
  "accent-200",
  "accent-300",
  "accent-400",
  "accent-500",
  "accent-600",
  "accent-soft",
  "accent-text",
];

const applyBranding = (settings = {}) => {
  const root = document.documentElement;
  const branding = settings.branding || {};

  if (branding.primaryColor) {
    root.style.setProperty("--brand-500", branding.primaryColor);
    root.style.setProperty("--brand-400", branding.primaryColor);
    root.style.setProperty("--brand-600", branding.primaryColor);
    root.style.setProperty("--brand-700", branding.primaryColor);
    root.style.setProperty("--accent", branding.primaryColor);
    root.style.setProperty("--accent-500", branding.primaryColor);
    root.style.setProperty("--accent-400", branding.primaryColor);
    root.style.setProperty("--accent-600", branding.primaryColor);
    root.style.setProperty("--accent-soft", branding.primaryColor);
    root.style.setProperty("--accent-text", branding.primaryColor);
  }

  if (branding.secondaryColor) {
    root.style.setProperty("--brand-900", branding.secondaryColor);
    root.style.setProperty("--brand-800", branding.secondaryColor);
  }

  if (branding.logoUrl) {
    const logoEl = document.querySelector(".sidebar-header .logo");
    if (logoEl) {
      logoEl.src = branding.logoUrl;
    }
  }

  if (branding.brandName) {
    const brandEl = document.querySelector(".sidebar-header .brand");
    if (brandEl) {
      brandEl.textContent = branding.brandName;
    }
    const titleEl = document.querySelector(".topbar-title");
    if (titleEl) {
      titleEl.textContent = branding.brandName;
    }
  }
};

const clearBranding = () => {
  const root = document.documentElement;
  BRAND_CSS_VARS.forEach((v) => root.style.removeProperty(`--${v}`));
  ACCENT_CSS_VARS.forEach((v) => root.style.removeProperty(`--${v}`));

  const logoEl = document.querySelector(".sidebar-header .logo");
  if (logoEl) {
    logoEl.src = "/src/assets/images/logo.jpg";
  }

  const brandEl = document.querySelector(".sidebar-header .brand");
  if (brandEl) {
    brandEl.textContent = "RTRS";
  }

  const titleEl = document.querySelector(".topbar-title");
  if (titleEl) {
    titleEl.textContent = "Restaurant Reservations";
  }
};

export const useTenantBranding = () => {
  const authStore = useAuthStore();

  const apply = () => {
    const tenant = authStore.currentTenant;
    if (tenant?.settings?.branding) {
      applyBranding(tenant.settings);
    } else if (
      authStore.branding &&
      (authStore.branding.brandName ||
        authStore.branding.logoUrl ||
        authStore.branding.primaryColor)
    ) {
      applyBranding({ branding: authStore.branding });
    } else {
      clearBranding();
    }
  };

  const stop = watch(
    [() => authStore.currentTenant, () => authStore.branding],
    () => {
      apply();
    },
    { deep: true }
  );

  onUnmounted(() => {
    stop();
  });

  return { apply, clearBranding };
};
