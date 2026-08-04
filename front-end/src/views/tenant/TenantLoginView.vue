<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useTenantResolver } from "@/composables/useTenantResolver";
import LoginView from "@/views/LoginView.vue";

defineOptions({ name: "TenantLoginView" });

const route = useRoute();
const authStore = useAuthStore();
const { resolveFromPath, resolvedTenant } = useTenantResolver();

const tenantSlug = route.params.tenantSlug as string;
const loading = ref(true);

onMounted(async () => {
  const found = await resolveFromPath(tenantSlug);
  loading.value = false;
  if (found) {
    authStore.setTenant({
      id: found.id,
      name: found.name,
      slug: found.slug,
      businessVertical: found.businessVertical,
    });
  }
});
</script>

<template>
  <LoginView mode="tenant">
    <template v-if="loading">
      <div class="tenant-resolve">Resolving tenant…</div>
    </template>
    <template v-else-if="resolvedTenant">
      <div class="tenant-resolve">
        Signing in to <strong>{{ resolvedTenant.name }}</strong>
      </div>
    </template>
    <template v-else>
      <div class="tenant-resolve error">Tenant not found.</div>
    </template>
  </LoginView>
</template>

<style scoped>
.tenant-resolve {
  margin-bottom: 18px;
  font-size: 13px;
  color: var(--neutral-700);
}
.tenant-resolve.error {
  color: var(--rose-600);
}
.tenant-resolve strong {
  color: var(--neutral-900);
}
</style>
