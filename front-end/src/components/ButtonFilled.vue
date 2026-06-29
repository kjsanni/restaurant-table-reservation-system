<script setup>
const props = defineProps({
  text: String,
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <button class="wrapper" :disabled="props.disabled">
    <slot name="icon"></slot>
    <div>{{ props.text }}</div>
  </button>
</template>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background-color: var(--primary-black);
  width: 100%;
  color: var(--snow-white);
  text-align: center;
  font-family: "Inter-Bold";
  border-radius: var(--btn-radius);
  padding: var(--btn-padding);
  transition: background-color 0.2s ease;
  cursor: pointer;
}
.wrapper:hover {
  background-color: var(--darker-gray);
}
.wrapper:disabled {
  background-color: var(--lighter-gray);
  cursor: not-allowed;
}
</style>
