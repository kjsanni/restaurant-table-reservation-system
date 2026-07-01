<script setup>
import { computed } from "vue";
import { VaButton, VaCard, VaChip } from "vuestic-ui";

const props = defineProps({
  slots: Array,
  modelValue: Object,
});
const emit = defineEmits(["update:modelValue"]);

const selectedSlot = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (val) emit("update:modelValue", val);
  },
});

const selectSlot = (slot) => {
  if (!slot.available) return;
  selectedSlot.value = slot;
};
</script>

<template>
  <VaCard>
    <VaCardContent>
      <div class="time-slot-grid">
        <VaButton
          v-for="slot in slots"
          :key="slot.time"
          :disabled="!slot.available || slot.reserved"
          :color="slot.selected ? 'success' : 'primary'"
          size="large"
          class="time-slot-btn"
          @click="selectSlot(slot)"
        >
          <template #default>
            <span class="slot-time">{{ slot.time }}</span>
            <VaChip
              v-if="!slot.available"
              color="secondary"
              size="small"
              class="slot-status"
            >
              Unavailable
            </VaChip>
            <VaChip
              v-else-if="slot.reserved"
              color="danger"
              size="small"
              class="slot-status"
            >
              Reserved
            </VaChip>
            <VaChip
              v-else-if="slot.selected"
              color="success"
              size="small"
              class="slot-status"
            >
              Selected
            </VaChip>
          </template>
        </VaButton>
      </div>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
.time-slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.time-slot-btn {
  height: auto;
  min-height: 56px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.slot-time {
  font-family: "Inter-Medium";
  font-size: 15px;
}

.slot-status {
  font-size: 10px;
  font-family: "Inter-Medium";
}
</style>
