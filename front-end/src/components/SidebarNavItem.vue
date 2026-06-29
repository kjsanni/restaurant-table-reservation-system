<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { computed } from "vue";

const props = defineProps({
  routeName: String,
  text: String,
  requiresAuth: {
    type: Boolean,
    default: false,
  },
  requiresAdmin: {
    type: Boolean,
    default: false,
  },
  requiresPermission: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.user?.role === "admin");
const hasPermission = computed(() => {
  if (!props.requiresPermission) return true;
  return authStore.user?.permissions?.[props.requiresPermission] === true;
});

const shouldShow = computed(() => {
  if (props.requiresAuth && !isAuthenticated.value) return false;
  if (props.requiresAdmin && !isAdmin.value) return false;
  if (props.requiresPermission && !hasPermission.value) return false;
  return true;
});

const changeRoute = () => router.push({ name: props.routeName });
</script>

<template>
  <div
    v-if="shouldShow"
    :class="['sidebar-nav-item', { active: isActive }]"
    @click="changeRoute"
    :title="text"
  >
    <span class="nav-icon">
      <slot name="icon" />
    </span>
    <span v-if="text" class="nav-label">{{ text }}</span>
  </div>
</template>

<style scoped>
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  white-space: nowrap;
  position: relative;
}

.sidebar-nav-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
}

.sidebar-nav-item.active {
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.2) 0%,
    rgba(59, 130, 246, 0.05) 100%
  );
  color: #ffffff;
  font-family: "Inter-Bold";
  border-left: 3px solid #3b82f6;
  padding-left: 9px;
}

.sidebar-nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: #3b82f6;
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.nav-label {
  font-size: 13px;
  font-family: "Inter-Medium";
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.1px;
}
</style>
