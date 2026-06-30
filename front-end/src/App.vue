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
  VaConfig,
} from 'vuestic-ui'
import { Icon } from '@iconify/vue'
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
  <VaConfig>
    <VaLayout>
      <template #left>
        <VaSidebar
          v-model="sidebarVisible"
          width="250"
          minimized-width="70"
          :minimized="collapsed"
          color="primary"
          class="app-sidebar"
        >
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
            <Icon :icon="item.icon" width="18" height="18" />
            <span v-if="!collapsed" class="sidebar-item-text">{{ item.text }}</span>
          </VaSidebarItem>
        </VaSidebar>
      </template>

      <template #top>
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
      </template>

      <template #default>
        <main>
          <RouterView v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <component :is="Component" :key="$route.name" />
            </Transition>
          </RouterView>

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
        </main>
      </template>
    </VaLayout>
  </VaConfig>
</template>
