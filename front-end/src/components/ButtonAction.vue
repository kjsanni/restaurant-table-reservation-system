<script setup>
defineProps({
  text: { type: String, required: true },
  color: { type: String, required: true },
});
</script>

<template>
  <button
    type="button"
    class="action-btn"
    :style="{ backgroundColor: color, borderColor: color }"
  >
    {{ text }}
  </button>
</template>

<style scoped>
.action-btn {
  padding: 6px 14px;
  border: 2px solid transparent;
  border-radius: 8px;
  color: white;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn:hover {
  opacity: 0.9;
}
</style>
