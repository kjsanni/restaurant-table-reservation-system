<script setup>
const props = defineProps({
  collection: Array,
});
</script>

<template>
  <div class="main-wrapper">
    <div class="grid-container">
      <div
        v-for="item in props.collection"
        :key="item.id"
        class="grid-item-container"
      >
        <slot :item="item" name="card"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: all var(--duration-200) var(--ease-out);
}
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  grid-auto-rows: 1fr;
}

@media screen and (min-width: 1024px) {
  .main-wrapper {
    padding: var(--space-8);
  }
  .grid-container {
    gap: var(--space-6);
  }
}
</style>
