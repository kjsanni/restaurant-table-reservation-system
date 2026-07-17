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

defineOptions({
  components: { PageHeader },
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const sidebarVisible = ref(true);
const collapsed = ref(false);
const windowWidth = ref(null);

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

const isActive = (name) => route.name === name;

const shouldShow = (item) => {
  if (item.requiresAuth && !isAuthenticated.value) return false;
  if (item.requiresAdmin && !isAdmin.value) return false;
  if (
    item.requiresPermission &&
    !user.value?.permissions?.[item.requiresPermission]
  )
    return false;
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
  await authStore.logout();
  router.push({ name: "home" });
};

const handleKeydown = (event) => {
  const key = event.key.toLowerCase();
  const isInputFocused = ["input", "textarea", "select"].includes(
    event.target?.tagName?.toLowerCase()
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
    <VaLayout>
      <template #left>
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
                  :active="isActive(item.routeName)"
                  :to="{ name: item.routeName }"
                  class="nav-item"
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
                @click="logout"
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
        <div class="content-wrapper" :style="{ marginLeft: desktopMargin }">
          <header class="app-topbar-integrated">
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
                <VaChip color="primary" size="small">{{
                  user?.username
                }}</VaChip>
              </template>
            </div>
          </header>

          <div
            v-if="sidebarVisible && windowWidth <= 768"
            class="sidebar-backdrop"
            @click="toggleSidebar"
          ></div>
          <main class="main-content">
            <RouterView v-slot="{ Component }">
              <Transition name="fade">
                <div v-if="Component" :key="$route.name">
                  <component :is="Component" />
                </div>
              </Transition>
            </RouterView>
          </main>

          <footer class="app-footer">
            <span class="footer-text"
              >&copy; {{ currentYear }} Vibespot Technologies Ltd. Made by:
              Kobina John Sanni</span
            >
          </footer>
        </div>
      </template>
    </VaLayout>
  </VaConfig>
</template>

<style scoped>
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

.nav-item:hover .nav-text,
.nav-item:deep(.va-sidebar-item--active .nav-text) {
  color: white;
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
</style>
