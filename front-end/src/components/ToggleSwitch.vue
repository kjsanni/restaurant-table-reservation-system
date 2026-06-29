<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const onChange = (event) => {
  const value = event.target.checked;
  emit("update:modelValue", value);
  emit("change", value);
};
</script>

<template>
  <label class="toggle-switch">
    <input type="checkbox" :checked="modelValue" @change="onChange" />
    <span class="slider"></span>
  </label>
</template>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--lighter-gray);
  transition: 0.3s;
  border-radius: 24px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: var(--primary-white);
  transition: 0.3s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: var(--primary-green);
}
input:checked + .slider:before {
  transform: translateX(26px);
}
</style>
