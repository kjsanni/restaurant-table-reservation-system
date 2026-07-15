<script setup>
import PageHeader from "@/components/PageHeader.vue";
import { ref, onMounted } from "vue";
import Heatmap2D from "@/components/Heatmap2D.vue";

const mode = ref("date-hour");
const from = ref(null);
const to = ref(null);

onMounted(() => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  from.value = thirtyDaysAgo.toISOString().split("T")[0];
  to.value = today;
});
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Reservation Heatmap" />
    <div class="content-wrapper">
      <Heatmap2D :mode="mode" :from="from" :to="to" />
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--restaurant-background);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-6) var(--x-spacing-mobile);
  padding: 0;
  max-width: 1400px;
  width: 100%;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin: var(--space-8) var(--x-spacing-desktop);
  }
}
</style>
