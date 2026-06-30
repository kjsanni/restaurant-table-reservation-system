<script setup>
import TheReservations from "@/components/TheReservations.vue";
import { VaSkeleton } from "vuestic-ui";
</script>

<template>
  <div class="main-wrapper">
    <Suspense>
      <template #default>
        <TheReservations />
      </template>
      <template #fallback>
        <VaSkeleton variant="text" :lines="5" />
      </template>
    </Suspense>
  </div>
</template>

<style scoped></style>
