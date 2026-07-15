<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import TheReservations from "@/components/TheReservations.vue";
import { VaSkeleton } from "vuestic-ui";
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Reservations"
      subtitle="View calendar and search all bookings"
    />
    <div class="content-wrapper">
      <Suspense>
        <template #default>
          <TheReservations />
        </template>
        <template #fallback>
          <div class="loading-state">
            <VaSkeleton variant="text" :lines="5" />
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.loading-state {
  padding: var(--space-20) var(--space-6);
  display: flex;
  justify-content: center;
  background: var(--background);
  min-height: 60vh;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
</style>
