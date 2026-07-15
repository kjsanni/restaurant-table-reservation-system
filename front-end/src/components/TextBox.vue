<script setup>
defineProps({
  textBoxType: { type: String, default: "text" },
  id: { type: String, default: "" },
  labelText: { type: String, default: "" },
  placeholderText: { type: String, default: "" },
  errors: { type: Object, default: () => ({}) },
  input: { type: [String, Number], default: "" },
  isModal: { type: Boolean, default: false },
});
const emit = defineEmits(["update:input"]);
</script>

<template>
  <div class="text-box-container">
    <label v-if="labelText" :for="id" class="text-box-label">{{
      labelText
    }}</label>
    <input
      :id="id"
      :type="textBoxType"
      :placeholder="placeholderText"
      :value="input"
      @input="emit('update:input', $event.target.value)"
      class="text-box-input"
    />
  </div>
</template>

<style scoped>
.text-box-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.text-box-label {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--ink-muted);
}
.text-box-input {
  padding: 10px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  background: white;
}
.text-box-input:focus {
  outline: none;
  border-color: var(--sky-600);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
</style>
