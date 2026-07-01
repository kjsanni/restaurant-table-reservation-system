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
                  <Icon :icon="item.icon" width="20" height="20" />
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
                <Icon icon="mdi:logout" width="20" height="20" />
                <span v-if="!collapsed" class="nav-text">Logout</span>
              </VaSidebarItem>
            </div>
          </div>
        </VaSidebar>
      </template>

      <template #top>
        <header class="app-topbar" :style="{ left: sidebarWidth }">
          <div class="topbar-left">
            <VaButton
              preset="secondary"
              size="small"
              @click="toggleSidebar"
              :aria-label="collapsed ? 'Expand menu' : 'Collapse menu'"
            >
              <template #icon>
                <Icon
                  :icon="collapsed ? 'mdi:menu-right' : 'mdi:menu-left'"
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
              <VaChip color="primary" size="small">{{ user?.username }}</VaChip>
            </template>
          </div>
        </header>
      </template>

      <template #default>
        <div
          v-if="sidebarVisible && windowWidth <= 768"
          class="sidebar-backdrop"
          @click="toggleSidebar"
        ></div>
        <main class="main-content" :style="{ paddingLeft: sidebarWidth }">
          <RouterView v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <component :is="Component" :key="$route.name" />
            </Transition>
          </RouterView>
        </main>

        <footer class="app-footer">
          <span class="footer-text"
            >&copy; {{ currentYear }} Vibespot Technologies Ltd. Made by: Kobina
            John Sanni</span
          >
        </footer>
      </template>
    </VaLayout>
  </VaConfig>
</template>

<style scoped>
:deep(.va-sidebar) {
  border-right: 1px solid var(--restaurant-border);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.06);
}

.app-sidebar {
  height: 100vh;
  position: sticky;
  top: 0;
  z-index: 50;
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
  padding: 16px 12px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 18px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 12px;
}

.logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: white;
  padding: 2px;
}

.brand {
  font-family: "Inter-Bold", sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: white;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-label {
  font-family: "Inter-Medium", sans-serif;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: rgba(255, 255, 255, 0.5);
  padding: 8px 12px 6px;
  font-weight: 600;
}

.nav-item {
  border-radius: 8px;
  margin: 1px 6px;
  padding: 0 10px;
  height: 40px;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.nav-item:deep(.va-sidebar-item__content) {
  height: 40px;
  padding: 0 8px;
}

.nav-text {
  font-family: "Inter-Medium", sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  margin-left: 10px;
  letter-spacing: 0.1px;
}

.sidebar-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 12px;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Inter-Bold", sans-serif;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.user-name {
  font-family: "Inter-Medium", sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-family: "Inter-Light", sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: capitalize;
}

.logout-item {
  color: rgba(255, 255, 255, 0.7);
}

.logout-item:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

.app-topbar {
  position: fixed;
  top: 0;
  right: 0;
  height: 64px;
  background: white;
  border-bottom: 1px solid var(--restaurant-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
  z-index: 40;
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.topbar-title {
  font-family: "Inter-Medium", sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: var(--primary-black);
  letter-spacing: 0.1px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  padding-top: 32px;
  padding-bottom: 40px;
  min-height: 100vh;
  transition: padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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

  .app-topbar {
    left: 0 !important;
  }

  :deep(.va-layout__area--right),
  :deep(.va-layout__area--bottom) {
    display: none;
  }

  .main-content {
    padding-left: 0 !important;
  }

  .nav-label {
    display: none;
  }

  .sidebar-header {
    border-bottom: none;
    padding-bottom: 12px;
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
  font-family: "Inter-Light", sans-serif;
  font-size: 12px;
  color: var(--secondary-gray);
}
</style>
