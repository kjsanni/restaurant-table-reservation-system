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
  gap: var(--space-4);
  flex-wrap: wrap;
}
.hint {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0;
}
.canvas {
  position: relative;
  min-height: 600px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  background: var(--surface-sunken);
  box-shadow: var(--card-shadow, none);
  overflow: hidden;
}
.table-card {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: var(--card-radius);
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--earth-600);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-1-5);
  padding: var(--space-4);
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: box-shadow var(--duration-150) var(--ease-in-out),
    transform var(--duration-150) var(--ease-in-out);
}
.table-card:hover {
  box-shadow: var(--shadow-md);
}
.table-card:active {
  cursor: grabbing;
}
.table-card.occupied {
  border-left-color: var(--rose-600);
}
.table-card.blocked {
  border-left-color: var(--neutral-500);
  opacity: 0.8;
}
.table-card.saving {
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.table-name {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
}
.table-meta {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.table-status {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
  text-transform: capitalize;
  color: var(--ink-secondary);
}
.saving-badge {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
  color: var(--accent-text);
}
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-20) var(--space-5);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
  border-radius: var(--card-radius);
}
.error-state {
  background: var(--rose-50);
  border: 1px solid var(--rose-200, #fecaca);
  color: var(--rose-600);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
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
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  transition: all var(--duration-fast) var(--ease-in-out);
}
.btn-secondary {
  background: var(--neutral-50);
  color: var(--ink);
  border: 1px solid var(--border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--neutral-100);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
