<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  VaLayout,
  VaSidebar,
  VaSidebarItem,
  VaButton,
  VaChip,
  VaConfig,
} from "vuestic-ui";
import { Icon } from "@iconify/vue";
import {
  guestNavItems,
  authenticatedNavItems,
  adminNavItems,
} from "@/config/sidebarItems";
import PageHeader from "@/components/PageHeader.vue";
import TenantSwitcher from "@/components/TenantSwitcher.vue";
import { useTenantBranding } from "@/composables/useTenantBranding";
import { getCurrentInstance } from "vue";

const app = getCurrentInstance()?.appContext?.app;
if (app) {
  app.config.errorHandler = (err) => handleError(err, "vue");
}

defineOptions({
  components: { PageHeader },
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
useTenantBranding();

const sidebarVisible = ref(true);
const collapsed = ref(false);
const windowWidth = ref<number>(
  typeof window !== "undefined" ? window.innerWidth : 1024
);
const hasError = ref(false);
const errorMessage = ref("");

const handleError = (err: unknown, context = "app") => {
  console.error(`[${context}]`, err);
  hasError.value = true;
  errorMessage.value =
    (err as Error)?.message || "Something went wrong. Please refresh the page.";
};

window.addEventListener("error", (event) => {
  handleError(event.error, "window");
});

window.addEventListener("unhandledrejection", (event) => {
  handleError(event.reason, "unhandledrejection");
});

const resetError = () => {
  hasError.value = false;
  errorMessage.value = "";
};

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.user?.role === "admin");
const user = computed(() => authStore.user);

const currentYear = new Date().getFullYear();

const checkWindowWidth = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value <= 768) {
    if (!sidebarVisible.value) {
      sidebarVisible.value = true;
    }
  } else {
    if (!sidebarVisible.value) {
      sidebarVisible.value = true;
      collapsed.value = false;
    }
  }
};

const toggleSidebar = () => {
  if (windowWidth.value <= 768) {
    if (collapsed.value && sidebarVisible.value) {
      collapsed.value = false;
    } else if (!collapsed.value && sidebarVisible.value) {
      collapsed.value = true;
    } else {
      sidebarVisible.value = !sidebarVisible.value;
      if (sidebarVisible.value) collapsed.value = true;
    }
  } else {
    collapsed.value = !collapsed.value;
  }
};

const isActive = (name: string) => route.name === name;

const shouldShow = (item: {
  tenantOnly?: boolean;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresPermission?: string;
  requiresFeature?: string;
  requiresVertical?: string;
}) => {
  if (item.tenantOnly && !authStore.tenantModeEnabled) return false;
  if (item.requiresAuth && !isAuthenticated.value) return false;
  if (item.requiresAdmin && !isAdmin.value) return false;
  if (
    item.requiresPermission &&
    !authStore.user?.permissions?.[item.requiresPermission]
  )
    return false;
  if (
    item.requiresFeature &&
    !authStore.capabilities?.featureFlags?.[item.requiresFeature]
  ) {
    return false;
  }
  if (
    item.requiresVertical &&
    authStore.currentTenant?.businessVertical !== item.requiresVertical
  ) {
    return false;
  }
  return true;
};

const allNavItems = computed(() => {
  const items = [...guestNavItems];
  if (isAuthenticated.value) {
    items.push(...authenticatedNavItems.filter(shouldShow));
    if (isAdmin.value) {
      items.push(...adminNavItems.filter(shouldShow));
    }
  }
  return items;
});

const sidebarWidth = computed(() => {
  if (!sidebarVisible.value) return "0px";
  if (collapsed.value) return "72px";
  return "260px";
});

const desktopMargin = computed(() => {
  if (windowWidth.value <= 768) return "0px";
  return sidebarWidth.value;
});

const logout = async () => {
  if (!isAuthenticated.value) return;
  await authStore.logout();
  router.push({ name: "home" });
};

const handleKeydown = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  const isInputFocused = ["input", "textarea", "select"].includes(
    (event.target as HTMLElement)?.tagName?.toLowerCase() || ""
  );
  const isModalOpen =
    document.querySelector(".va-modal_overlay") ||
    document.querySelector(".modal-overlay");

  if (isInputFocused || isModalOpen) return;

  switch (key) {
    case "n":
      if (isAuthenticated.value) {
        router.push({ name: "new-reservation" });
      }
      break;
    case "/":
      if (isAuthenticated.value && route.name !== "reservations") {
        router.push({ name: "reservations" });
      }
      break;
    case "t":
      if (isAuthenticated.value) {
        router.push({ name: "reservations" });
      }
      break;
  }
};

onMounted(() => {
  checkWindowWidth();
  window.addEventListener("resize", checkWindowWidth);
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkWindowWidth);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <VaConfig>
    <div v-if="hasError" class="error-boundary">
      <div class="error-boundary-inner">
        <h1>Something went wrong</h1>
        <p>{{ errorMessage }}</p>
        <VaButton preset="primary" @click="resetError">Try again</VaButton>
      </div>
    </div>
    <VaLayout v-else>
      <template #left v-if="!route.meta.standalone">
        <VaSidebar
          v-model="sidebarVisible"
          width="260"
          minimized-width="72"
          :minimized="collapsed"
          color="primary"
          :class="[
            'app-sidebar',
            { 'sidebar-mobile-visible': sidebarVisible && windowWidth <= 768 },
          ]"
        >
          <div class="sidebar-inner">
            <div class="sidebar-top">
              <div class="sidebar-header">
                <img
                  class="logo"
                  src="@/assets/images/logo.jpg"
                  alt="Logo"
                  @click="router.push({ name: 'home' })"
                />
                <span v-if="!collapsed" class="brand">RTRS</span>
              </div>

              <div class="nav-section">
                <div class="nav-label" v-if="!collapsed">Menu</div>
                <VaSidebarItem
                  v-for="item in allNavItems"
                  :key="item.routeName"
                  :to="{ name: item.routeName }"
                  :class="[
                    'nav-item',
                    { 'is-active': isActive(item.routeName) },
                  ]"
                >
                  <template #icon>
                    <Icon :icon="item.icon" width="20" height="20" />
                  </template>
                  <span v-if="!collapsed" class="nav-text">{{
                    item.text
                  }}</span>
                </VaSidebarItem>
              </div>
            </div>

            <div class="sidebar-bottom" v-if="isAuthenticated">
              <div class="user-section" v-if="user">
                <div class="user-avatar">
                  {{ user.username?.charAt(0)?.toUpperCase() }}
                </div>
                <div v-if="!collapsed" class="user-info">
                  <span class="user-name">{{ user.username }}</span>
                  <span class="user-role">{{ user.role }}</span>
                </div>
              </div>
              <VaSidebarItem
                :active="false"
                @click.stop="logout"
                class="nav-item logout-item"
              >
                <template #icon>
                  <Icon icon="mdi:logout" width="20" height="20" />
                </template>
                <span v-if="!collapsed" class="nav-text">Logout</span>
              </VaSidebarItem>
            </div>
          </div>
        </VaSidebar>
      </template>

      <template #default>
        <div
          class="content-wrapper"
          :style="{
            marginLeft: route.meta.standalone ? '0px' : desktopMargin,
            display:
              route.meta.standalone && route.name !== 'home' && isAuthenticated
                ? 'grid'
                : 'block',
            gridTemplateColumns:
              route.meta.standalone && route.name !== 'home' && isAuthenticated
                ? '250px 1fr'
                : 'none',
          }"
        >
          <aside
            v-if="
              route.meta.standalone &&
              route.name !== 'login' &&
              route.name !== 'register' &&
              route.name !== 'home' &&
              isAuthenticated
            "
            class="standalone-sidebar"
          >
            <div class="standalone-sidebar-brand">
              <div class="standalone-sidebar-mark">R</div>
              <div class="standalone-sidebar-name">
                Restaurant<br />Reservations
              </div>
            </div>
            <nav class="standalone-nav-group">
              <div class="standalone-nav-group-title">Operations</div>
              <RouterLink
                :to="{ name: 'tenant-landing' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">◆</span> Dashboard
              </RouterLink>
              <RouterLink
                :to="{ name: 'reservations' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">▦</span> Reservations
              </RouterLink>
              <RouterLink
                :to="{ name: 'table-management' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">▦</span> Tables
              </RouterLink>
              <RouterLink
                :to="{ name: 'schedule' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">◷</span> Schedule
              </RouterLink>
              <RouterLink
                :to="{ name: 'calendar' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">▤</span> Calendar
              </RouterLink>
              <RouterLink
                :to="{ name: 'floor-plan' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">◻</span> Floor Plan
              </RouterLink>
            </nav>
            <nav class="standalone-nav-group">
              <div class="standalone-nav-group-title">Guests</div>
              <RouterLink
                :to="{ name: 'waitlist' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">◌</span> Waitlist
              </RouterLink>
              <RouterLink
                :to="{ name: 'customer-profile' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">👤</span> Customer Portal
              </RouterLink>
            </nav>
            <nav class="standalone-nav-group">
              <div class="standalone-nav-group-title">Insights</div>
              <RouterLink
                :to="{ name: 'reports' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">📊</span> Reports
              </RouterLink>
              <RouterLink
                :to="{ name: 'heatmap' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">🌡</span> Heatmap
              </RouterLink>
            </nav>
            <nav class="standalone-nav-group" style="margin-top: auto">
              <div class="standalone-nav-group-title">Admin</div>
              <RouterLink
                :to="{ name: 'admin-settings' }"
                class="standalone-nav-item"
                active-class="active"
              >
                <span class="standalone-nav-icon">⚙</span> Settings
              </RouterLink>
              <span
                class="standalone-nav-item"
                style="cursor: pointer"
                @click.stop="logout"
              >
                <span class="standalone-nav-icon">↪</span> Logout
              </span>
            </nav>
          </aside>

          <header v-if="!route.meta.standalone" class="app-topbar-integrated">
            <div class="topbar-left">
              <VaButton
                preset="secondary"
                size="small"
                @click="toggleSidebar"
                :aria-label="collapsed ? 'Expand menu' : 'Collapse menu'"
              >
                <template #icon>
                  <Icon
                    :icon="collapsed ? 'mdi-menu-right' : 'mdi-menu-left'"
                    width="16"
                    height="16"
                  />
                </template>
              </VaButton>
            </div>
            <div class="topbar-center">
              <span class="topbar-title">Restaurant Reservations</span>
            </div>
            <div class="topbar-right">
              <template v-if="isAuthenticated">
                <TenantSwitcher
                  v-if="
                    user?.permissions?.manage_tenants &&
                    authStore.tenantModeEnabled
                  "
                  :modelValue="authStore.currentTenant?.id || ''"
                  @update:modelValue="authStore.setTenant"
                />
                <VaChip color="primary" size="small">{{
                  user?.username
                }}</VaChip>
              </template>
            </div>
          </header>

          <div
            v-if="
              !route.meta.standalone && sidebarVisible && windowWidth <= 768
            "
            class="sidebar-backdrop"
            @click="toggleSidebar"
          ></div>
          <main
            class="main-content"
            :style="route.meta.standalone ? { padding: 0 } : {}"
          >
            <RouterView v-slot="{ Component }">
              <component v-if="Component" :is="Component" :key="$route.name" />
            </RouterView>
          </main>

          <footer v-if="!route.meta.standalone" class="app-footer">
            <div class="footer-inner">
              <span class="footer-text"
                >&copy; {{ currentYear }} Vibespot Technologies Ltd. Made by:
                Kobina John Sanni</span
              >
              <nav class="footer-legal" aria-label="Legal">
                <RouterLink
                  :to="{ name: 'legal-document', params: { slug: 'privacy' } }"
                  >Privacy</RouterLink
                >
                <RouterLink
                  :to="{ name: 'legal-document', params: { slug: 'terms' } }"
                  >Terms</RouterLink
                >
                <RouterLink
                  :to="{ name: 'legal-document', params: { slug: 'cookies' } }"
                  >Cookies</RouterLink
                >
                <RouterLink
                  :to="{ name: 'legal-document', params: { slug: 'gdpr' } }"
                  >GDPR</RouterLink
                >
                <RouterLink
                  :to="{ name: 'legal-document', params: { slug: 'dpa' } }"
                  >DPA</RouterLink
                >
                <RouterLink
                  :to="{ name: 'legal-document', params: { slug: 'customer' } }"
                  >Customers</RouterLink
                >
                <RouterLink
                  :to="{ name: 'legal-document', params: { slug: 'tenant' } }"
                  >Merchants</RouterLink
                >
                <RouterLink
                  :to="{
                    name: 'legal-document',
                    params: { slug: 'payment-refund' },
                  }"
                  >Payments</RouterLink
                >
                <RouterLink
                  :to="{
                    name: 'legal-document',
                    params: { slug: 'accessibility' },
                  }"
                  >Accessibility</RouterLink
                >
              </nav>
            </div>
          </footer>
        </div>
      </template>
    </VaLayout>
  </VaConfig>
</template>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-8);
  background: var(--surface);
}
.error-boundary-inner {
  text-align: center;
  max-width: 420px;
}
.error-boundary-inner h1 {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  margin-bottom: var(--space-3);
}
.error-boundary-inner p {
  font-size: var(--text-base);
  color: var(--ink-secondary);
  margin-bottom: var(--space-5);
}

:deep(.va-layout) {
  overflow: visible;
  height: auto;
  min-height: 100vh;
}

:deep(.va-sidebar) {
  background: linear-gradient(
    180deg,
    var(--brand-900) 0%,
    #120e0b 100%
  ) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 4px 0 32px rgba(26, 20, 16, 0.25) !important;
}

:deep(.va-sidebar__menu) {
  background: transparent !important;
}

.app-sidebar {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-sidebar);
}

.content-wrapper {
  transition: margin-left var(--duration-normal) var(--ease-in-out);
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar-top {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--space-5) var(--space-4);
  overflow-y: auto;
  overflow-x: hidden;
  gap: var(--space-2);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3) var(--space-5);
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: var(--space-5);
  transition: opacity var(--duration-fast) var(--ease-in-out);
}
.sidebar-header:hover {
  opacity: 0.9;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  object-fit: cover;
  flex-shrink: 0;
  background: white;
  padding: 2px;
  box-shadow: var(--shadow-sm);
}

.brand {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: white;
  white-space: nowrap;
  letter-spacing: var(--tracking-wide);
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.35);
  padding: var(--space-3) var(--space-3) var(--space-2);
  font-weight: 600;
}

.nav-item {
  border-radius: var(--radius-md);
  margin: 0;
  padding: 0;
  height: 42px;
  transition: all var(--duration-fast) var(--ease-in-out);
  position: relative;
  display: inline-flex;
  align-items: center;
}

.nav-item::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  opacity: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item:hover {
  transform: translateX(4px);
}

.nav-item:deep(.va-sidebar-item__content) {
  padding: var(--space-3) var(--space-4);
  color: rgba(255, 255, 255, 0.8) !important;
}
.nav-item:deep(.va-sidebar-item__content):hover {
  color: white !important;
}
.nav-item:deep(.va-sidebar-item--active .va-sidebar-item__content) {
  color: white !important;
  background: linear-gradient(
    90deg,
    rgba(217, 119, 6, 0.18) 0%,
    rgba(180, 83, 9, 0.08) 100%
  ) !important;
  border-radius: var(--radius-lg);
  box-shadow: inset 3px 0 0 var(--accent) !important;
}
.nav-item:deep(.va-sidebar-item--active::before) {
  opacity: 1;
}

.nav-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: var(--tracking-normal);
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
}

.nav-item:deep(.va-sidebar-item--active .nav-text) {
  color: white;
}
.nav-item.is-active {
  background: linear-gradient(
    90deg,
    rgba(217, 119, 6, 0.18) 0%,
    rgba(180, 83, 9, 0.08) 100%
  ) !important;
  border-radius: var(--radius-lg);
}
.nav-item.is-active .nav-text {
  color: white;
  font-weight: 600;
}
.nav-item.is-active::before {
  opacity: 1;
  box-shadow: inset 3px 0 0 var(--accent) !important;
}

.sidebar-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.user-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.45);
  text-transform: capitalize;
}

.logout-item {
  color: rgba(255, 255, 255, 0.55);
}
.logout-item:hover {
  background: rgba(239, 68, 68, 0.12) !important;
  color: #fca5a5 !important;
}

.app-topbar-integrated {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 var(--space-6);
  gap: var(--space-4);
  z-index: var(--z-sticky);
  position: sticky;
  top: 0;
  backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.topbar-left :deep(.va-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
}
.topbar-left :deep(.va-button__content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0 !important;
}

.topbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.topbar-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.main-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  min-height: calc(100vh - 64px);
  transition: margin-left var(--duration-300) var(--ease-out);
  position: relative;
  z-index: 1;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 20, 16, 0.45);
  z-index: var(--z-overlay);
  transition: opacity var(--duration-300) var(--ease-out);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

@media screen and (max-width: 768px) {
  .app-sidebar {
    position: fixed !important;
    top: 0;
    left: 0;
    height: 100vh !important;
    z-index: var(--z-modal) !important;
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-in-out);
  }

  .app-sidebar.sidebar-mobile-visible {
    transform: translateX(0);
  }

  .main-content {
    padding: var(--space-6) var(--space-4);
  }

  .nav-label {
    display: none;
  }

  .sidebar-header {
    border-bottom: none;
    padding-bottom: var(--space-3);
  }

  .sidebar-top {
    padding: var(--space-4) var(--space-3);
  }

  .nav-item {
    height: 40px;
  }
}

.app-footer {
  padding: var(--space-5) var(--space-6);
  text-align: center;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface);
  margin-left: 0;
  transition: margin-left var(--duration-300) var(--ease-out);
  position: relative;
  z-index: 1;
}

.footer-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 450;
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2) var(--space-5);
}

.footer-legal {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.footer-legal a {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.footer-legal a:hover {
  color: var(--accent-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.standalone-sidebar {
  background: linear-gradient(
    180deg,
    var(--brand-900) 0%,
    var(--brand-800) 100%
  );
  color: var(--white);
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.standalone-sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.standalone-sidebar-mark {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 16px;
  color: var(--brand-900);
}
.standalone-sidebar-name {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.15;
}
.standalone-nav-group {
  margin-top: 8px;
}
.standalone-nav-group-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.45);
  padding: 12px 12px 6px;
}
.standalone-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
  cursor: pointer;
}
.standalone-nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--white);
  transform: translateX(2px);
}
.standalone-nav-item.active {
  background: linear-gradient(
    90deg,
    rgba(217, 119, 6, 0.18),
    rgba(217, 119, 6, 0.06)
  );
  color: var(--accent-300);
  font-weight: 600;
}
.standalone-nav-icon {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  opacity: 0.85;
}

@media screen and (max-width: 960px) {
  .standalone-sidebar {
    display: none;
  }
  .content-wrapper {
    grid-template-columns: 1fr !important;
  }
}
</style>
