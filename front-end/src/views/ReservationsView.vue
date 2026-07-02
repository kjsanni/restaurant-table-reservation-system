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
  background: linear-gradient(180deg, #fffef8 0%, #fff8f0 100%);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: 16px var(--x-spacing-mobile);
  padding: 0;
}

.loading-state {
  padding: 60px;
  display: flex;
  justify-content: center;
  background: linear-gradient(180deg, #fffef8 0%, #fff8f0 100%);
  min-height: 100vh;
}

@media screen and (min-width: 1024px) {
  .content-wrapper {
    margin: 60px var(--x-spacing-desktop);
  }
}
</style>
