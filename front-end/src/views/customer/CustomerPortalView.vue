<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useTenantResolver } from "@/composables/useTenantResolver";
import CustomerPortalHomeView from "@/views/customer/CustomerPortalHomeView.vue";

const route = useRoute();
const { resolveFromPath } = useTenantResolver();

onMounted(async () => {
  try {
    await resolveFromPath(route.params.tenantSlug as string);
  } catch {
    // ignore tenant resolution failures; portal home still renders
  }
});
</script>

<template>
  <CustomerPortalHomeView />
</template>
