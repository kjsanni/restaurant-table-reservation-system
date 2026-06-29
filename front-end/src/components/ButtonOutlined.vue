<script setup>
const props = defineProps({
  text: String,
});
</script>

<template>
  <button class="wrapper">
    <slot name="icon"></slot>
    <div>{{ props.text }}</div>
  </button>
</template>

<style scoped>
.wrapper {
  color: var(--primary-black);
  background-color: var(--light-pink);
  border: 1px solid var(--primary-black);
  width: 100%;
  text-align: center;
  font-family: "Inter-Bold";
  border-radius: var(--btn-radius);
  padding: var(--btn-padding);
  transition: background-color 0.2s ease, color 0.2s ease;
  cursor: pointer;
}
.wrapper:hover {
  background-color: var(--primary-black);
  color: var(--snow-white);
}
</style>
