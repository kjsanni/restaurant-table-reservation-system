<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="About" subtitle="Restaurant Table Reservation System" />
    <div class="content-wrapper">
      <div class="about">
        <h1>About This System</h1>
        <p>
          This is a comprehensive restaurant table reservation and management
          system built with Vue 3 and Node.js.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: calc(100vh - 64px);
  background: var(--background);
}

.content-wrapper {
  margin-top: 12px;
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
}

.about {
  background: white;
  padding: 40px;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  max-width: 800px;
  margin: 0 auto;
}

.about h1 {
  font-family: "Inter-Bold";
  font-size: 28px;
  color: var(--primary);
  margin-bottom: 16px;
}

.about p {
  font-family: "Inter-Light";
  font-size: 16px;
  color: var(--ink-muted);
  line-height: 1.6;
}

@media screen and (min-width: 1024px) {
  .content-wrapper {
    margin-left: var(--space-8);
    margin-right: var(--space-8);
  }
}
</style>
