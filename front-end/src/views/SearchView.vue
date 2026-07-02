<script setup>
import PageHeader from "@/components/PageHeader.vue";
import TheSearch from "@/components/TheSearch.vue";
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Search Reservations"
      subtitle="Find reservations by name, phone, email or date"
    />
    <div class="content-wrapper">
      <TheSearch />
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
}

@media screen and (min-width: 1024px) {
  .content-wrapper {
    margin: 0 var(--x-spacing-desktop) 40px;
  }
}
</style>
