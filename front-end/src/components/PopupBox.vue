<script setup>
const props = defineProps({
  isOpen: { type: Boolean, required: true },
  headerText: { type: String, required: true },
  isClosable: { type: Boolean, default: true },
});
const emit = defineEmits(["close-modal"]);
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="popup-overlay" @click.self="emit('close-modal')">
      <div class="popup-window">
        <div class="popup-header">
          <h3 class="popup-title">{{ headerText }}</h3>
          <button
            v-if="isClosable"
            type="button"
            class="popup-close"
            @click="emit('close-modal')"
          >
            ×
          </button>
        </div>
        <div class="popup-body">
          <slot name="popup-content" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.popup-window {
  background: var(--primary-white);
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.popup-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  margin: 0;
}
.popup-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--secondary-gray);
}
.popup-body {
  padding: 20px;
}
</style>
