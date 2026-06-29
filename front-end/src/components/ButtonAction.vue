<script setup>
import { computed } from "vue";

const props = defineProps({
  text: String,
  color: String,
});

const cssProps = computed(() => {
  return {
    "--main-color": props.color,
  };
});
</script>

<template>
  <button class="wrapper" :style="cssProps">
    <slot name="icon"></slot>
    <div>{{ props.text }}</div>
  </button>
</template>

<style scoped>
.wrapper {
  background-color: var(--primary-white);
  border: 1px solid var(--main-color);
  color: var(--main-color);
  width: 100%;
  text-align: center;
  font-family: "Inter-Medium";
  border-radius: var(--btn-radius);
  padding: var(--btn-padding);
  transition: background-color 0.2s ease, color 0.2s ease;
  cursor: pointer;
}
.wrapper:hover {
  background-color: var(--main-color);
  color: var(--snow-white);
}
</style>
