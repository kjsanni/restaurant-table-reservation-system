<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useTenantResolver } from "@/composables/useTenantResolver";
import CustomerPortalHomeView from "@/views/customer/CustomerPortalHomeView.vue";
import logger from "@/utils/logger";

const route = useRoute();
const { resolveFromPath } = useTenantResolver();

onMounted(async () => {
  try {
    await resolveFromPath(route.params.tenantSlug as string);
  } catch (err) {
    logger.error("Customer portal tenant resolution failed", err);
  }
});
</script>

<template>
  <CustomerPortalHomeView />
</template>
