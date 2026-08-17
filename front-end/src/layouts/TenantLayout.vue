<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { VaSidebarItem } from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/stores/auth";
import { tenantNavItems } from "@/config/sidebarItems";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";
import TenantSwitcher from "@/components/TenantSwitcher.vue";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import gsap from "gsap";
import { useAnimations } from "@/composables/useAnimations";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { fadeIn, fadeOut } = useAnimations();
const { status, pendingCount } = useOnlineStatus();

const collapsed = ref(false);
const sidebarVisible = ref(true);
const windowWidth = ref<number>(
  typeof window !== "undefined" ? window.innerWidth : 1024
);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed<User | null>(
  () => authStore.user as unknown as User | null
);
const isAdmin = computed(() => authStore.user?.role === "admin");
const capabilities = computed(() => authStore.capabilities);

let pageTween: gsap.core.Tween | null = null;
let leaveTween: gsap.core.Tween | null = null;

const beforeEnter = (el: Element) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(8px)";
};

const onEnter = (el: Element, done: () => void) => {
  if (pageTween) pageTween.kill();
  pageTween = fadeIn(el, { duration: "base" });
  pageTween.eventCallback("onComplete", done);
};

const onLeave = (el: Element, done: () => void) => {
  if (leaveTween) leaveTween.kill();
  leaveTween = fadeOut(el, { duration: "fast" });
  leaveTween.eventCallback("onComplete", done);
};

const shouldShow = (item: {
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresPermission?: string;
  requiresFeature?: string;
  requiresServiceMode?: string;
  requiresVertical?: string;
}) => {
  if (item.requiresAuth && !isAuthenticated.value) return false;
  if (item.requiresAdmin && !isAdmin.value) return false;
  if (item.requiresPermission === "manage_tenants") return false;
  if (
    item.requiresPermission &&
    !user.value?.permissions?.[item.requiresPermission]
  )
    return false;
  if (
    item.requiresFeature &&
    !capabilities.value?.featureFlags?.[item.requiresFeature]
  ) {
    return false;
  }
  if (
    item.requiresServiceMode &&
    !capabilities.value?.serviceModes?.includes(item.requiresServiceMode)
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

const visibleNavItems = computed(() => tenantNavItems.filter(shouldShow));

const logout = async () => {
  if (!isAuthenticated.value) return;
  await authStore.logout();
  router.push({ name: "home" });
};

const isActive = (routeName: string) =>
  route.name === routeName ||
  (typeof route.name === "string" && route.name.startsWith(`${routeName}-`));

const sidebarWidth = computed(() => {
  if (!sidebarVisible.value) return "0px";
  if (collapsed.value) return "72px";
  return "260px";
});

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

const currentYear = new Date().getFullYear();

onMounted(() => {
  checkWindowWidth();
  window.addEventListener("resize", checkWindowWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkWindowWidth);
});

watch(
  () => authStore.currentTenant?.businessVertical,
  (vertical) => {
    if (typeof document !== "undefined") {
      const allowed = ["restaurant", "salon", "event"];
      const safe = allowed.includes(vertical || "") ? vertical || "" : "";
      document.documentElement.setAttribute("data-vertical", safe);
    }
  },
  { immediate: true }
);
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="tl-layout">
    <aside class="tl-sidebar" :style="{ width: sidebarWidth }">
      <div class="tl-sidebar-inner">
        <div class="tl-sidebar-top">
          <div class="tl-sidebar-header">
            <img
              class="tl-logo"
              src="@/assets/images/logo.jpg"
              alt="RTRS logo"
              @click="router.push({ name: 'tenant-landing' })"
            />
            <span v-if="!collapsed" class="tl-brand">RTRS</span>
          </div>
          <button
            v-if="!collapsed"
            class="tl-collapse-btn"
            @click="collapsed = true"
            aria-label="Collapse sidebar"
          >
            <Icon icon="mdi:chevron-left" width="20" height="20" />
          </button>
          <button
            v-else
            class="tl-expand-btn"
            @click="collapsed = false"
            aria-label="Expand sidebar"
          >
            <Icon icon="mdi:chevron-right" width="20" height="20" />
          </button>

          <nav class="tl-nav">
            <VaSidebarItem
              v-for="item in visibleNavItems"
              :key="item.routeName"
              :to="{ name: item.routeName }"
              :aria-label="item.text"
              :class="[
                'tl-nav-item',
                { 'tl-nav-item-active': isActive(item.routeName) },
              ]"
            >
              <template #icon>
                <Icon :icon="item.icon" width="20" height="20" />
              </template>
              <span v-if="!collapsed" class="tl-nav-text">{{ item.text }}</span>
            </VaSidebarItem>
          </nav>
        </div>

        <div class="tl-sidebar-bottom">
          <button type="button" class="tl-logout-item" @click="logout">
            <Icon icon="mdi:logout" width="20" height="20" />
            <span v-if="!collapsed" class="tl-nav-text">Logout</span>
          </button>
        </div>
      </div>
    </aside>

    <div class="tl-main" :style="{ marginLeft: sidebarWidth }">
      <header class="tl-topbar">
        <div class="tl-topbar-left">
          <button
            class="tl-toggle-btn"
            @click="toggleSidebar"
            :aria-label="collapsed ? 'Expand menu' : 'Collapse menu'"
          >
            <Icon
              :icon="collapsed ? 'mdi-menu-right' : 'mdi-menu-left'"
              width="20"
              height="20"
            />
          </button>
        </div>
        <div class="tl-topbar-center">
          <span class="tl-topbar-title">{{
            route.meta.title || "Restaurant Reservations"
          }}</span>
        </div>
        <div class="tl-topbar-right">
          <span v-if="status === 'offline'" class="sync-indicator offline">
            Offline
          </span>
          <span v-else-if="status === 'syncing'" class="sync-indicator syncing">
            Syncing...
          </span>
          <span
            v-else-if="status === 'sync-failed'"
            class="sync-indicator sync-failed"
          >
            Sync failed
          </span>
          <span v-else-if="pendingCount > 0" class="sync-indicator pending">
            {{ pendingCount }} pending
          </span>
          <LocaleSwitcher />
          <TenantSwitcher
            v-if="user?.permissions?.manage_tenants"
            :modelValue="authStore.currentTenant?.id || ''"
          />
          <div v-if="user" class="tl-user-chip">
            {{ user.username?.charAt(0)?.toUpperCase() }}
          </div>
        </div>
      </header>

      <main id="main-content" class="tl-content">
        <Transition
          name="page-transition"
          @before-enter="beforeEnter"
          @enter="onEnter"
          @leave="onLeave"
        >
          <RouterView v-slot="{ Component }">
            <component
              v-if="Component"
              :is="Component"
              :key="`${String($route.name)}-${authStore.currentTenant?.id ?? 'platform'}`"
            />
          </RouterView>
        </Transition>
      </main>

      <footer v-if="!route.meta.standalone" class="tl-footer">
        <div class="tl-footer-inner">
          <span class="tl-footer-text"
            >&copy; {{ currentYear }} Vibespot Technologies Ltd. Made by: Kobina
            John Sanni</span
          >
          <nav class="tl-footer-legal" aria-label="Legal">
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
  </div>
</template>

<style scoped>
.tl-layout {
  display: flex;
  min-height: 100vh;
  background: var(--background);
}

.tl-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: var(--z-sidebar);
  background: linear-gradient(180deg, var(--brand-900) 0%, #120e0b 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 4px 0 32px rgba(26, 20, 16, 0.25);
  transition: width var(--duration-normal) var(--ease-in-out);
  overflow: hidden;
}

.tl-sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tl-sidebar-top {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 2px;
}

.tl-sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 18px;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 18px;
}

.tl-logo {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  object-fit: cover;
  flex-shrink: 0;
  background: white;
  padding: 2px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

.tl-brand {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: white;
  white-space: nowrap;
  letter-spacing: var(--tracking-wide);
}

.tl-collapse-btn,
.tl-expand-btn {
  position: absolute;
  top: 18px;
  right: 12px;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: white;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.tl-collapse-btn:hover,
.tl-expand-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

.tl-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tl-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.75) !important;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
}

.tl-nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white !important;
}

.tl-nav-item-active {
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white !important;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
}

.tl-nav-text {
  white-space: nowrap;
  color: #ffffff !important;
}

.tl-sidebar-bottom {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.tl-logout-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  border: none;
  background: transparent;
  width: 100%;
}

.tl-logout-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white !important;
}

.tl-main {
  flex: 1;
  min-height: 100vh;
  transition: margin-left var(--duration-normal) var(--ease-in-out);
  display: flex;
  flex-direction: column;
}

.tl-topbar {
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
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 var(--space-6);
  gap: var(--space-4);
  z-index: var(--z-sticky);
}

@supports (backdrop-filter: blur(1px)) {
  .tl-topbar {
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    will-change: transform;
  }
}

.tl-topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tl-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.tl-toggle-btn:hover {
  background: var(--neutral-100);
}

.tl-topbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.tl-topbar-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}

.tl-topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.tl-user-chip {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
  color: white;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.tl-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  min-height: calc(100vh - 64px);
  position: relative;
  z-index: 1;
}

.tl-footer {
  padding: var(--space-5) var(--space-6);
  text-align: center;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface);
  position: relative;
  z-index: 1;
}

.tl-footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2) var(--space-5);
}

.tl-footer-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 450;
  width: 100%;
  margin-bottom: var(--space-2);
}

.tl-footer-legal {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.tl-footer-legal a {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.tl-footer-legal a:hover {
  color: var(--accent-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media screen and (max-width: 768px) {
  .tl-sidebar {
    position: fixed !important;
    top: 0;
    left: 0;
    height: 100vh !important;
    z-index: var(--z-modal) !important;
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-in-out);
  }

  .tl-sidebar.sidebar-mobile-visible {
    transform: translateX(0);
  }

  .tl-content {
    padding: var(--space-6) var(--space-4);
  }
}

.sync-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}
.sync-indicator.offline {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}
.sync-indicator.syncing {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}
.sync-indicator.sync-failed {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
.sync-indicator.pending {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}
</style>
