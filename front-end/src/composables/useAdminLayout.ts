import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/stores/auth";

export const useAdminLayout = () => {
  const authStore = useAuthStore();

  const collapsed = ref(false);
  const sidebarVisible = ref(true);
  const windowWidth = ref<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

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

  onMounted(() => {
    checkWindowWidth();
    window.addEventListener("resize", checkWindowWidth);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", checkWindowWidth);
  });

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed<User | null>(
    () => authStore.user as unknown as User | null
  );

  const shouldShow = (item: {
    platformOnly?: boolean;
    tenantOnly?: boolean;
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    requiresPermission?: string;
    requiresFeature?: string;
    requiresServiceMode?: string;
    requiresVertical?: string;
    requiresId?: boolean;
  }) => {
    if (item.platformOnly && !authStore.isSuperAdmin) return false;
    if (
      item.tenantOnly &&
      !authStore.tenantModeEnabled &&
      !authStore.isSuperAdmin
    )
      return false;
    if (item.requiresAuth && !isAuthenticated.value) return false;
    if (item.requiresAdmin && user.value?.role !== "admin") return false;
    if (
      item.requiresPermission &&
      !authStore.isSuperAdmin &&
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
      item.requiresServiceMode &&
      !authStore.capabilities?.serviceModes?.includes(item.requiresServiceMode)
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

  return {
    collapsed,
    sidebarVisible,
    windowWidth,
    toggleSidebar,
    isAuthenticated,
    user,
    shouldShow,
  };
};
