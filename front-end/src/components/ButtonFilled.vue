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
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: white;
  transition: all 0.15s;
}
.btn-filled:hover {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
}
</style>
