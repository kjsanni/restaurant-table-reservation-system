<script setup lang="ts">
import { computed } from "vue";

interface Props {
  status: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  showLabel: true,
});

const statusConfig = {
  pending_payment: {
    label: "Payment Pending",
    color: "pending",
    bg: "#fef3c2",
    text: "#924004",
  },
  pending: {
    label: "Pending Review",
    color: "pending",
    bg: "#e0e7ff",
    text: "#3730a3",
  },
  approved: {
    label: "Approved",
    color: "approved",
    bg: "#dcfce7",
    text: "#166534",
  },
  signed: {
    label: "Signed",
    color: "approved",
    bg: "#dcfce7",
    text: "#166534",
  },
  completed: {
    label: "Completed",
    color: "approved",
    bg: "#dcfce7",
    text: "#166534",
  },
  rejected: {
    label: "Rejected",
    color: "rejected",
    bg: "#fee2e2",
    text: "#991b1b",
  },
  failed: {
    label: "Failed",
    color: "rejected",
    bg: "#fee2e2",
    text: "#991b1b",
  },
  cancelled: {
    label: "Cancelled",
    color: "rejected",
    bg: "#fee2e2",
    text: "#991b1b",
  },
};

const config = computed(() => {
  return (
    statusConfig[props.status as keyof typeof statusConfig] || {
      label: props.status || "Unknown",
      color: "unknown",
      bg: "#f1f5f9",
      text: "#475569",
    }
  );
});

const sizeClasses = {
  sm: { padding: "2px 8px", fontSize: "11px" },
  md: { padding: "4px 12px", fontSize: "12px" },
  lg: { padding: "6px 16px", fontSize: "14px" },
};
</script>

<template>
  <span
    class="wallet-pass-status"
    :class="`status-${config.color} size-${size}`"
    :style="{
      backgroundColor: config.bg,
      color: config.text,
      padding: sizeClasses[size].padding,
      fontSize: sizeClasses[size].fontSize,
    }"
  >
    <span
      v-if="config.color === 'approved'"
      class="mdi mdi:check-circle"
      style="margin-right: 4px; font-size: inherit"
    ></span>
    <span
      v-else-if="config.color === 'pending'"
      class="mdi mdi:clock-outline"
      style="margin-right: 4px; font-size: inherit"
    ></span>
    <span
      v-else-if="config.color === 'rejected'"
      class="mdi mdi:close-circle"
      style="margin-right: 4px; font-size: inherit"
    ></span>
    <template v-if="showLabel">
      {{ config.label }}
    </template>
  </span>
</template>

<style scoped>
.wallet-pass-status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-weight: 600;
  line-height: 1;
}
</style>
