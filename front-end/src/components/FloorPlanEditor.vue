<script setup>
import { ref } from "vue";
import tableAPI from "@/services/tableAPI";
import logger from "@/utils/logger";

const props = defineProps({
  tables: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["tables-updated"]);

const floorPlanWidth = 800;
const floorPlanHeight = 600;
const gridSize = 20;
const loading = ref(false);

let dragState = {
  active: false,
  table: null,
  offsetX: 0,
  offsetY: 0,
};

const handleTableMouseDown = (event, table) => {
  event.preventDefault();
  event.stopPropagation();
  const floorplanRect = document
    .querySelector(".floorplan")
    ?.getBoundingClientRect();
  if (!floorplanRect) return;

  dragState.active = true;
  dragState.table = table;
  dragState.offsetX =
    event.clientX - floorplanRect.left - (table.positionX || 0);
  dragState.offsetY =
    event.clientY - floorplanRect.top - (table.positionY || 0);

  const moveHandler = (e) => {
    if (!dragState.active || !dragState.table) return;
    e.preventDefault();
    const x = e.clientX - floorplanRect.left - dragState.offsetX;
    const y = e.clientY - floorplanRect.top - dragState.offsetY;
    const gridX = Math.round(x / gridSize) * gridSize;
    const gridY = Math.round(y / gridSize) * gridSize;
    dragState.table._dragX = Math.max(0, Math.min(floorPlanWidth - 120, gridX));
    dragState.table._dragY = Math.max(0, Math.min(floorPlanHeight - 80, gridY));
  };

  const upHandler = async () => {
    if (dragState.active && dragState.table) {
      const finalX = dragState.table._dragX ?? dragState.table.positionX ?? 0;
      const finalY = dragState.table._dragY ?? dragState.table.positionY ?? 0;
      await updateTablePosition(dragState.table.id, finalX, finalY);
    }
    dragState.active = false;
    dragState.table = null;
    document.removeEventListener("mousemove", moveHandler);
    document.removeEventListener("mouseup", upHandler);
  };

  document.addEventListener("mousemove", moveHandler);
  document.addEventListener("mouseup", upHandler);
};

const updateTablePosition = async (tableId, positionX, positionY) => {
  loading.value = true;
  try {
    await tableAPI.updateTablePosition(tableId, positionX, positionY);
    emit("tables-updated");
  } catch (err) {
    logger.error("Failed to update position", { error: err.message });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="floorplan-wrapper">
    <p class="floorplan-help">
      Drag tables to reposition them on the floor plan. Positions snap to grid.
    </p>
    <div
      class="floorplan"
      :style="{ width: floorPlanWidth + 'px', height: floorPlanHeight + 'px' }"
    >
      <div class="grid-background"></div>
      <div
        v-for="table in props.tables"
        :key="table.id"
        class="floorplan-table"
        :class="{
          blocked: table.isBlocked,
          occupied: !table.isBlocked && table.isOccupied,
          available: !table.isBlocked && !table.isOccupied,
        }"
        :style="{
          left: (table._dragX ?? table.positionX ?? 0) + 'px',
          top: (table._dragY ?? table.positionY ?? 0) + 'px',
        }"
        @mousedown="handleTableMouseDown($event, table)"
      >
        <span class="floorplan-table-name">{{ table.name }}</span>
        <span class="floorplan-table-capacity">{{ table.capacity }} seats</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.floorplan-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;
}

.floorplan-help {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
  margin: 0 0 12px 0;
}

.floorplan {
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.grid-background {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(to right, #e2e8f0 1px, transparent 1px),
    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.floorplan-table {
  position: absolute;
  width: 120px;
  height: 80px;
  background: white;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  transition: all 0.15s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  touch-action: none;
  -webkit-user-drag: none;
}

.floorplan-table:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: scale(1.03);
}

.floorplan-table.available {
  border-color: #22c55e;
}

.floorplan-table.occupied {
  border-color: #ef4444;
  background: #fef2f2;
}

.floorplan-table.blocked {
  border-color: #6c757d;
  background: #f3f4f6;
  opacity: 0.7;
}

.floorplan-table-name {
  font-family: "Inter-Bold";
  font-size: 14px;
  color: var(--primary-black);
}

.floorplan-table-capacity {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
}
</style>
