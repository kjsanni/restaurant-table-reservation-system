<script setup>
import { ref } from "vue";
import Heatmap2D from "@/components/Heatmap2D.vue";
import { useToday, useDaysAgo } from "@/composables/useReservationCalendar";

const mode = ref("date-hour");
const today = useToday();
const thirtyDaysAgo = useDaysAgo(30);
const from = ref(thirtyDaysAgo.daysAgo.value);
const to = ref(today.value);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-inner">
        <h1 class="topbar-title">Reservation Heatmap</h1>
      </div>
    </div>
    <div class="content-wrapper">
      <Heatmap2D :mode="mode" :from="from" :to="to" />
    </div>
  </div>
</template>

<style scoped>
.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: var(--space-5) var(--page-margin-x);
}
.topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.topbar-title {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}

.main-wrapper {
  min-height: 100vh;
  background: var(--background);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-6) var(--space-6);
  padding: 0;
  max-width: 1400px;
  width: 100%;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin: var(--space-8) var(--space-8);
  }
}
</style>
