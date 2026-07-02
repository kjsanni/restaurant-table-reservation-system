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
      if (isAuthenticated.value) {
        router.push({ name: "search" });
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
              <Transition name="fade" mode="out-in">
                <component :is="Component" :key="$route.name" />
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
  background: var(--restaurant-charcoal) !important;
  border-right: 1px solid var(--restaurant-border);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.06) !important;
}

:deep(.va-sidebar__menu) {
  background: transparent !important;
}

.app-sidebar {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
}

.content-wrapper {
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
  padding: 20px 14px;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 4px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 18px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 16px;
}

.logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: white;
  padding: 2px;
}

.brand {
  font-family: "Inter-Bold", sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: white;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-label {
  font-family: "Inter-Medium", sans-serif;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.4);
  padding: 10px 14px 8px;
  font-weight: 600;
}

.nav-item {
  border-radius: 10px;
  margin: 0;
  padding: 0 12px;
  height: 44px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.nav-item::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 10px;
  opacity: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  transition: opacity 0.2s ease;
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item:hover {
  transform: translateX(4px);
}

.nav-text {
  font-family: "Inter-Medium", sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.85);
  position: relative;
  z-index: 1;
}

.nav-item:hover .nav-text {
  color: white;
}

.sidebar-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Inter-Bold", sans-serif;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-family: "Inter-Medium", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-family: "Inter-Light", sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: capitalize;
}

.logout-item {
  color: rgba(255, 255, 255, 0.6);
}

.logout-item:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

.app-topbar-integrated {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background: var(--restaurant-cream);
  border-bottom: 1px solid var(--restaurant-border);
  padding: 0 24px;
  gap: 16px;
  z-index: 40;
  position: sticky;
  top: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-left :deep(.va-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
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
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 15px;
  color: var(--restaurant-charcoal);
  letter-spacing: 0.1px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  flex: 1;
  padding: 32px var(--x-spacing-mobile);
  min-height: calc(100vh - 64px);
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 150;
  transition: opacity 0.2s ease;
}

@media screen and (max-width: 768px) {
  .app-sidebar {
    position: fixed !important;
    top: 0;
    left: 0;
    height: 100vh !important;
    z-index: 200 !important;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .app-sidebar.sidebar-mobile-visible {
    transform: translateX(0);
  }

  .main-content {
    padding: 32px 16px;
  }

  .nav-label {
    display: none;
  }

  .sidebar-header {
    border-bottom: none;
    padding-bottom: 12px;
  }

  .sidebar-top {
    padding: 16px 10px;
  }

  .nav-item {
    height: 42px;
  }
}

.app-footer {
  padding: 16px 24px;
  text-align: center;
  border-top: 1px solid var(--restaurant-border);
  background: var(--restaurant-surface);
  margin-left: 0;
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.footer-text {
  font-family: "Lora", Georgia, serif;
  font-size: 12px;
  color: var(--restaurant-warm-gray);
}
</style>
