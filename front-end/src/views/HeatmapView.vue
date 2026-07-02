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
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}

.content-wrapper {
  margin-top: 12px;
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
}
</style>
