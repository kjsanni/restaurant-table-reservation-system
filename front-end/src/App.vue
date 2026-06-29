<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  VaLayout,
  VaSidebar,
  VaSidebarItem,
  VaNavbar,
  VaButton,
  VaChip,
  VaIcon,
} from 'vuestic-ui'
import {
  guestNavItems,
  authenticatedNavItems,
  adminNavItems,
} from '@/config/sidebarItems'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarVisible = ref(true)
const collapsed = ref(false)
const windowWidth = ref(null)

const currentYear = new Date().getFullYear()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.user?.role === 'admin')
const user = computed(() => authStore.user)

const checkWindowWidth = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value <= 768) {
    collapsed.value = true
    sidebarVisible.value = false
    return
  }
  collapsed.value = false
  sidebarVisible.value = true
}

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const isActive = (name: string) => route.name === name

const shouldShow = (item: (typeof guestNavItems)[0] | (typeof authenticatedNavItems)[0] | (typeof adminNavItems)[0]) => {
  if (item.requiresAuth && !isAuthenticated.value) return false
  if (item.requiresAdmin && !isAdmin.value) return false
  if (item.requiresPermission && !user.value?.permissions?.[item.requiresPermission]) return false
  return true
}

const allNavItems = computed(() => {
  const items = [...guestNavItems]
  if (isAuthenticated.value) {
    items.push(...authenticatedNavItems.filter(shouldShow))
    if (isAdmin.value) {
      items.push(...adminNavItems.filter(shouldShow))
    }
  }
  return items
})

const logout = async () => {
  await authStore.logout()
  router.push({ name: 'home' })
}

onMounted(() => {
  checkWindowWidth()
  window.addEventListener('resize', checkWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkWindowWidth)
})
</script>

<template>
  <VaLayout>
    <VaSidebar
      v-model="sidebarVisible"
      :width="250"
      :minimized-width="70"
      :minimized="collapsed"
      color="background"
      class="app-sidebar"
    >
      <template #default>
        <div class="sidebar-header">
          <img
            class="logo"
            src="@/assets/images/logo.jpg"
            alt="Logo"
            @click="router.push({ name: 'home' })"
          />
          <span v-if="!collapsed" class="brand">Reservations</span>
        </div>
        <VaSidebarItem
          v-for="item in allNavItems"
          :key="item.routeName"
          :active="isActive(item.routeName)"
          :to="{ name: item.routeName }"
        >
          <VaIcon :name="item.icon" />
          <span v-if="!collapsed" class="sidebar-item-text">{{ item.text }}</span>
        </VaSidebarItem>
      </template>
    </VaSidebar>

    <VaNavbar class="app-navbar">
      <template #left>
        <VaButton
          :icon="collapsed ? 'va-arrow-right' : 'va-arrow-left'"
          preset="secondary"
          size="small"
          @click="toggleCollapse"
        />
      </template>
      <template #center>
        <span class="navbar-title">Restaurant Reservations</span>
      </template>
      <template #right>
        <template v-if="isAuthenticated">
          <VaChip color="primary" class="user-chip">{{ user?.username }}</VaChip>
          <VaButton preset="secondary" size="small" @click="logout">Logout</VaButton>
        </template>
        <VaButton v-else :to="{ name: 'login' }" size="small">Login</VaButton>
      </template>
    </VaNavbar>

    <main id="main-content" role="main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.name" />
        </Transition>
      </RouterView>
    </main>

    <template #bottom>
      <footer class="app-footer">
        <img
          class="secondary-logo"
          src="@/assets/images/secondary-logo.png"
          alt="secondary-logo"
        />
        <div class="line"></div>
        <div class="copyright">© Vibespot Technologies Ltd. {{ currentYear }}.</div>
        <div class="copyright">Made by: Kobina John Sanni</div>
      </footer>
    </template>
  </VaLayout>
</template>

<style>
.app-sidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  min-height: 70px;
}

.logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.brand {
  font-family: 'Inter-Bold';
  font-size: 17px;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: -0.4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.sidebar-item-text {
  font-family: 'Inter-Medium';
  font-size: 13px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-chip {
  margin-right: 8px;
}

.navbar-title {
  font-family: 'Inter-Bold';
  font-size: 20px;
  color: #04030f;
}

.app-footer {
  background-color: #04030f;
  font-family: 'Montserrat-Normal';
  font-weight: lighter;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 35px;
  width: 100%;
  padding: 100px var(--x-spacing-mobile);
}

.secondary-logo {
  height: 50px;
  width: 50px;
  cursor: pointer;
  border-radius: 8px;
}

.line {
  height: 1px;
  width: 70%;
  background-color: #f8e9f2;
  margin-left: 50px;
  margin-right: 50px;
}

.copyright {
  color: #b9bab8;
  font-size: 10px;
}

@media screen and (min-width: 1024px) {
  .app-footer {
    padding: 100px var(--x-spacing-desktop);
  }
  .copyright {
    font-size: 14px;
  }
}
</style>
