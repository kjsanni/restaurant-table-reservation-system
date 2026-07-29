<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { VaSidebarItem } from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/stores/auth";
import { superAdminNavItems } from "@/config/sidebarItems";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const collapsed = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed<User | null>(
  () => authStore.user as unknown as User | null
);
const isSuperAdmin = computed(() => authStore.isSuperAdmin);

const shouldShow = (item: {
  platformOnly?: boolean;
  tenantOnly?: boolean;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresPermission?: string;
  requiresFeature?: string;
  requiresVertical?: string;
  requiresId?: boolean;
}) => {
  if (item.platformOnly && !isSuperAdmin.value) return false;
  if (item.tenantOnly && !authStore.tenantModeEnabled && !isSuperAdmin.value)
    return false;
  if (item.requiresAuth && !isAuthenticated.value) return false;
  if (item.requiresAdmin && user.value?.role !== "admin") return false;
  if (
    item.requiresPermission &&
    !user.value?.permissions?.[item.requiresPermission]
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
  if (item.requiresId) return false;
  return true;
};

const visibleNavItems = computed(() => superAdminNavItems.filter(shouldShow));

const groupedNavItems = computed(() => {
  const groups: Record<string, NavItem[]> = {};
  for (const item of visibleNavItems.value) {
    const section = item.section || "Other";
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }
  return groups;
});

const SECTION_ORDER = [
  "Dashboard",
  "Tenants",
  "Financial",
  "Support",
  "Integrations",
  "Security & Compliance",
  "Platform",
  "Data & Tools",
];

const orderedSections = computed(() => {
  const sections = Object.keys(groupedNavItems.value);
  return sections.sort((a, b) => {
    const aIdx = SECTION_ORDER.indexOf(a);
    const bIdx = SECTION_ORDER.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
});

const logout = async () => {
  if (!isAuthenticated.value) return;
  await authStore.logout();
  router.push({ name: "home" });
};

const isActive = (routeName: string) =>
  route.name === routeName ||
  (typeof route.name === "string" && route.name.startsWith(`${routeName}-`));
</script>

<template>
  <div class="sa-layout">
    <aside class="sa-sidebar" :class="{ minimized: collapsed }">
      <div class="sa-sidebar-inner">
        <div class="sa-sidebar-top">
          <div class="sa-sidebar-header">
            <Icon icon="mdi:shield-crown" width="28" height="28" />
            <span v-if="!collapsed" class="sa-brand">Platform Admin</span>
          </div>
          <button
            v-if="!collapsed"
            class="sa-collapse-btn"
            @click="collapsed = true"
            aria-label="Collapse sidebar"
          >
            <Icon icon="mdi:chevron-left" width="20" height="20" />
          </button>
          <button
            v-else
            class="sa-expand-btn"
            @click="collapsed = false"
            aria-label="Expand sidebar"
          >
            <Icon icon="mdi:chevron-right" width="20" height="20" />
          </button>

          <nav class="sa-nav">
            <template v-for="section in orderedSections" :key="section">
              <div class="sa-nav-section">{{ section }}</div>
              <VaSidebarItem
                v-for="item in groupedNavItems[section]"
                :key="item.routeName"
                :to="{ name: item.routeName }"
                :class="[
                  'sa-nav-item',
                  { 'sa-nav-item-active': isActive(item.routeName) },
                ]"
              >
                <template #icon>
                  <Icon :icon="item.icon" width="20" height="20" />
                </template>
                <span v-if="!collapsed" class="sa-nav-text">{{
                  item.text
                }}</span>
              </VaSidebarItem>
            </template>
          </nav>
        </div>

        <div class="sa-sidebar-bottom">
          <div class="sa-user-section" v-if="user">
            <div class="sa-user-avatar">
              {{ user.username?.charAt(0)?.toUpperCase() }}
            </div>
            <div v-if="!collapsed" class="sa-user-info">
              <span class="sa-user-name">{{ user.username }}</span>
              <span class="sa-user-role">Super Admin</span>
            </div>
          </div>
          <div class="sa-logout-item" @click="logout">
            <Icon icon="mdi:logout" width="20" height="20" />
            <span v-if="!collapsed" class="sa-nav-text">Logout</span>
          </div>
        </div>
      </div>
    </aside>

    <main class="sa-main" :style="{ marginLeft: collapsed ? '72px' : '260px' }">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.sa-layout {
  display: flex;
  min-height: 100vh;
  background: var(--background);
}

.sa-sidebar {
  width: 260px;
  min-height: 100vh;
  background: var(--brand-900);
  color: var(--white);
  display: flex;
  flex-direction: column;
  position: fixed;
  inset-block: 0;
  left: 0;
  z-index: var(--z-sidebar);
  transition: width var(--duration-normal) var(--ease-in-out);
}

.sa-sidebar.minimized {
  width: 72px;
}

.sa-sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sa-sidebar-top {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 12px;
}

.sa-sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 18px;
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--white);
  letter-spacing: -0.01em;
  position: relative;
}

.sa-brand {
  white-space: nowrap;
}

.sa-collapse-btn,
.sa-expand-btn {
  position: absolute;
  top: 18px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: var(--white);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.sa-collapse-btn:hover,
.sa-expand-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

.sa-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sa-nav-section {
  padding: 12px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.45);
  user-select: none;
}

.sa-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: #ffffff !important;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
}

.sa-nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff !important;
}

.sa-nav-item-active {
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
}

.sa-nav-text {
  white-space: nowrap;
  color: #ffffff !important;
}

.sa-sidebar-bottom {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sa-user-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 12px;
}

.sa-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
  color: var(--brand-900);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.sa-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sa-user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sa-user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.sa-logout-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
}

.sa-logout-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--white);
}

.sa-main {
  flex: 1;
  min-height: 100vh;
  transition: margin var(--duration-normal) var(--ease-in-out);
}

@media (max-width: 768px) {
  .sa-sidebar {
    transform: translateX(-100%);
  }
  .sa-main {
    margin-left: 0;
  }
}
</style>
