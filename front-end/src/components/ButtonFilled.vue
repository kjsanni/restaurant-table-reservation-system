<script setup>
defineProps({
  text: { type: String, required: true },
});
</script>

<template>
  <button type="submit" class="btn-filled">
    {{ text }}
  </button>
</template>

<style scoped>
.btn-filled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 14px;
  background: var(--color-info-600);
  color: white;
  transition: all 0.15s;
}
.btn-filled:hover {
  background: #2563eb;
}
</style>
