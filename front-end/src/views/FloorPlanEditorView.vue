<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import tableAPI from "@/services/tableAPI";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";
import PageHeader from "@/components/PageHeader.vue";

const tables = ref([]);
const loading = ref(true);
const errorMsg = ref("");
const savingId = ref(null);
const canvasRef = ref(null);
const CARD = 150;
const GAP = 24;
const STEP = CARD + GAP;

const statusOf = (t) =>
  t.isBlocked ? "blocked" : t.isOccupied ? "occupied" : "free";

const layout = ref({});

const load = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await tableAPI.getTables();
    const list = res.data.collection || [];
    tables.value = list;
    const lay = {};
    list.forEach((t, i) => {
      if (t.posX != null && t.posY != null) {
        lay[t.id] = { x: t.posX, y: t.posY };
      } else {
        lay[t.id] = {
          x: 24 + (i % 6) * STEP,
          y: 24 + Math.floor(i / 6) * STEP,
        };
      }
    });
    layout.value = lay;
  } catch (err) {
    errorMsg.value = getApiErrorMessage(err, "Failed to load tables");
  } finally {
    loading.value = false;
  }
};

let drag = null;
const onPointerDown = (e, t) => {
  if (savingId.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  drag = {
    id: t.id,
    originX: layout.value[t.id].x,
    originY: layout.value[t.id].y,
    offsetX: e.clientX - rect.left - layout.value[t.id].x,
    offsetY: e.clientY - rect.top - layout.value[t.id].y,
  };
  e.currentTarget.setPointerCapture?.(e.pointerId);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
};

const onPointerMove = (e) => {
  if (!drag) return;
  const rect = canvasRef.value.getBoundingClientRect();
  let x = e.clientX - rect.left - drag.offsetX;
  let y = e.clientY - rect.top - drag.offsetY;
  x = Math.max(0, Math.round(x));
  y = Math.max(0, Math.round(y));
  layout.value[drag.id] = { x, y };
};

const onPointerUp = async () => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  if (!drag) return;
  const { id, originX, originY } = drag;
  const pos = layout.value[id];
  drag = null;
  if (pos.x === originX && pos.y === originY) return;
  savingId.value = id;
  try {
    await tableAPI.updatePosition(id, pos.x, pos.y);
  } catch (err) {
    logger.error("Failed to save table position", { error: err.message });
  } finally {
    savingId.value = null;
  }
};

const autoArrange = async () => {
  const lay = {};
  tables.value.forEach((t, i) => {
    lay[t.id] = {
      x: 24 + (i % 6) * STEP,
      y: 24 + Math.floor(i / 6) * STEP,
    };
  });
  layout.value = lay;
  for (const t of tables.value) {
    const p = lay[t.id];
    try {
      await tableAPI.updatePosition(t.id, p.x, p.y);
    } catch (err) {
      logger.error("Failed to arrange table", { error: err.message });
    }
  }
};

onMounted(load);
onUnmounted(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
});
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Floor Plan Editor"
      subtitle="Design and customize table layout"
    />
    <div class="content-wrapper">
      <div class="toolbar">
        <p class="hint">
          Drag tables to set their permanent positions on the floor plan.
        </p>
        <button
          class="btn btn-secondary"
          @click="autoArrange"
          :disabled="loading"
        >
          Auto-arrange grid
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading tables...</p>
      </div>
      <div v-else-if="errorMsg" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ errorMsg }}</p>
      </div>
      <div v-else class="canvas" ref="canvasRef">
        <div
          v-for="t in tables"
          :key="t.id"
          class="table-card"
          :class="[statusOf(t), { saving: savingId === t.id }]"
          :style="{ left: layout[t.id].x + 'px', top: layout[t.id].y + 'px' }"
          @pointerdown="onPointerDown($event, t)"
        >
          <span class="table-name">{{ t.name }}</span>
          <span class="table-meta">{{ t.capacity }} seats</span>
          <span class="table-status">{{ statusOf(t) }}</span>
          <span v-if="savingId === t.id" class="saving-badge">saving…</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.hint {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--secondary-gray, #6c757d);
  margin: 0;
}
.canvas {
  position: relative;
  min-height: 600px;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  background: #fafafa;
  box-shadow: var(--card-shadow, none);
  overflow: hidden;
}
.table-card {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 12px;
  background: var(--primary-white, #fff);
  border-left: 4px solid #22c55e;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  padding: 14px;
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: box-shadow 0.15s;
}
.table-card:active {
  cursor: grabbing;
}
.table-card.occupied {
  border-left-color: #ef4444;
}
.table-card.blocked {
  border-left-color: #6c757d;
  opacity: 0.8;
}
.table-card.saving {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
.table-name {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black, #111);
}
.table-meta {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray, #6c757d);
}
.table-status {
  font-family: "Inter-Medium";
  font-size: 12px;
  text-transform: capitalize;
  color: #6c757d;
}
.saving-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 11px;
  color: var(--primary-blue, #3b82f6);
}
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--secondary-gray, #6c757d);
  font-family: "Inter-Light";
  border-radius: 12px;
}
.error-state {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--lighter-gray, #eee);
  border-top-color: var(--primary-blue, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
}
.btn-secondary {
  background-color: #f3f4f6;
  color: var(--primary-black, #111);
}
.btn-secondary:hover {
  background-color: #e5e7eb;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
