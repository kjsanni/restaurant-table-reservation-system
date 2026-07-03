<script setup>
import { computed } from "vue";

const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
});

const statusColors = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  seated: "#22c55e",
  completed: "#6c757d",
  cancelled: "#ef4444",
  missed: "#ef4444",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  missed: "No-Show",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const timelineItems = computed(() => {
  return props.history.map((item) => ({
    id: item.id,
    fromStatus: item.fromStatus,
    toStatus: item.toStatus,
    actorType: item.actorType,
    createdAt: item.createdAt,
    metadata: item.metadata || {},
  }));
});
</script>

<template>
  <div class="timeline">
    <div v-if="!timelineItems.length" class="empty-history">
      No status changes recorded yet.
    </div>
    <div v-else class="timeline-list">
      <div
        v-for="(item, idx) in timelineItems"
        :key="item.id"
        class="timeline-item"
      >
        <div
          class="timeline-dot"
          :style="{ backgroundColor: statusColors[item.toStatus] || '#6c757d' }"
        ></div>
        <div class="timeline-body">
          <div class="timeline-title">
            <span class="status-label">{{
              statusLabels[item.toStatus] || item.toStatus
            }}</span>
            <span v-if="item.fromStatus" class="from-label">
              from {{ statusLabels[item.fromStatus] || item.fromStatus }}
            </span>
          </div>
          <div class="timeline-meta">
            <span>{{ formatDate(item.createdAt) }}</span>
            <span v-if="item.actorType" class="actor">{{
              item.actorType
            }}</span>
          </div>
          <div v-if="item.metadata?.reason" class="timeline-meta">
            Reason: {{ item.metadata.reason }}
          </div>
        </div>
        <div v-if="idx < timelineItems.length - 1" class="timeline-line"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.empty-history {
  text-align: center;
  padding: 24px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
  font-size: 13px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
  z-index: 1;
}

.timeline-line {
  position: absolute;
  left: 5px;
  top: 18px;
  bottom: -12px;
  width: 2px;
  background: #e5e7eb;
}

.timeline-body {
  flex: 1;
  padding-bottom: 18px;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-label {
  font-family: "Inter-Bold";
  font-size: 13px;
  color: var(--primary-black);
  text-transform: capitalize;
}

.from-label {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
}

.timeline-meta {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.actor {
  text-transform: capitalize;
}
</style>
