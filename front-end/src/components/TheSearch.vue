<script setup>
import { ref, computed } from "vue";
import SearchIcon from "~icons/fluent/search-16-regular";
import ClearIcon from "~icons/fluent/dismiss-16-regular";

const props = defineProps({
  modelValue: String,
  loading: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const internalQuery = computed({
  get: () => props.modelValue || "",
  set: (val) => emit("update:modelValue", val),
});

const clear = () => {
  internalQuery.value = "";
};
</script>

<template>
  <div class="search-wrapper">
    <div class="search-bar">
      <span class="search-icon"><SearchIcon /></span>
      <input
        type="search"
        class="search-input"
        placeholder="Search reservations..."
        v-model="internalQuery"
        autofocus
      />
      <button
        v-if="internalQuery"
        type="button"
        class="clear-btn"
        @click="clear"
      >
        <ClearIcon />
      </button>
      <div v-if="loading" class="search-spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.search-wrapper {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-bar:focus-within {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-icon {
  color: var(--secondary-gray);
  display: flex;
  align-items: center;
}

.search-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
  background: transparent;
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--secondary-gray);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: background-color 0.15s;
}

.clear-btn:hover {
  background-color: #f3f4f6;
}

.clear-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.search-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f4f6;
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
