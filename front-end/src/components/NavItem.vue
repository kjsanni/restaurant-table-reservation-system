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
  <div v-if="shouldShow" class="nav-item" @click="changeRoute">
    <slot name="icon"></slot>
    <div>{{ props.text }}</div>
  </div>
</template>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: 0.3s;
}

.nav-item:hover {
  color: var(--primary-gray);
}
</style>
