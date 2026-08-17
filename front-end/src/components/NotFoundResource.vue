<script setup>
const props = defineProps({
  text: String,
  position: String,
});
</script>

<template>
  <div class="main-wrapper">
    <div class="content">
      <slot class="vector" name="icon"></slot>
      <h1>{{ props.text }}</h1>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  position: relative;
  top: 0;
  left: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: var(--space-2);
  padding: var(--space-12);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: var(--surface);
}

.main-wrapper .content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  color: var(--border);
}
</style>
