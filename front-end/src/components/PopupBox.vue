<script setup>
import CloseIcon from "~icons/bytesize/close";

const props = defineProps({
  isOpen: Boolean,
  headerText: String,
  isClosable: Boolean,
});

const emit = defineEmits(["closeModal"]);
</script>

<template>
  <Transition name="popupAnimation">
    <div class="main-wrapper" v-if="props.isOpen">
      <div
        class="overlay"
        @click.self="props.isClosable ? emit('closeModal') : null"
      >
        <div class="popup-wrapper">
          <div class="header">
            <h1>{{ props.headerText }}</h1>
            <button
              v-if="props.isClosable"
              class="close-btn"
              @click="emit('closeModal')"
            >
              <CloseIcon />
            </button>
          </div>
          <div class="popup-content">
            <slot name="popup-content"></slot>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.main-wrapper {
  position: relative;
  z-index: 20;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--darkened-color);
  overflow-y: auto;
  padding: 5vh 0;
}
button {
  appearance: none;
  background: none;
  cursor: pointer;
}

.popup-wrapper {
  position: relative;
  width: 40%;
  min-width: 420px;
  max-height: 90vh;
  background-color: var(--primary-white);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}

.popup-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.popup-wrapper .header {
  display: flex;
  padding: 15px;
  justify-content: space-between;
  align-items: flex-start;
  gap: 60px;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--primary-white);
  border-radius: 10px 10px 0 0;
  flex-shrink: 0;
}

.header h1 {
  text-align: center;
}

.close-btn {
  position: relative;
  z-index: 20;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--secondary-gray);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  color: var(--primary-black);
  background-color: var(--light-pink);
}

.popupAnimation-enter-from,
.popupAnimation-leave-to {
  opacity: 0;
}
.popupAnimation-enter-active,
.popupAnimation-leave-active {
  transition: opacity 0.1s ease-out;
}
</style>
