<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import tableAPI from "@/services/tableAPI";
import floorPlanAPI from "@/services/floorPlanAPI";
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
const floorPlans = ref([]);
const selectedFloorPlanId = ref(null);
const zones = ref([]);
const drawingZone = ref(false);
const zoneStart = ref(null);
const currentZone = ref(null);

const ZONE_COLORS = [
  "#dbeafe",
  "#dcfce7",
  "#fef3c7",
  "#fce7f3",
  "#e9d5ff",
  "#ccfbf1",
];

const loadFloorPlans = async () => {
  try {
    const res = await floorPlanAPI.getFloorPlans();
    floorPlans.value = res?.data?.floorPlans ?? [];
    if (floorPlans.value.length > 0 && !selectedFloorPlanId.value) {
      selectedFloorPlanId.value = floorPlans.value[0].id;
    }
  } catch (err) {
    logger.error("Failed to load floor plans", { error: err.message });
  }
};

const loadZones = async () => {
  if (!selectedFloorPlanId.value) return;
  try {
    const plan = floorPlans.value.find(
      (p) => p.id === selectedFloorPlanId.value
    );
    zones.value = plan?.zones || [];
  } catch (err) {
    logger.error("Failed to load zones", { error: err.message });
  }
};

const saveZones = async () => {
  if (!selectedFloorPlanId.value) return;
  try {
    await floorPlanAPI.updateFloorPlan(selectedFloorPlanId.value, {
      zones: zones.value,
    });
  } catch (err) {
    logger.error("Failed to save zones", { error: err.message });
  }
};

const startZoneDraw = (e) => {
  if (!drawingZone.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  zoneStart.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  currentZone.value = {
    x: zoneStart.value.x,
    y: zoneStart.value.y,
    width: 0,
    height: 0,
    color: ZONE_COLORS[zones.value.length % ZONE_COLORS.length],
    name: `Zone ${zones.value.length + 1}`,
  };
};

const onCanvasMouseMove = (e) => {
  if (!drawingZone.value || !zoneStart.value || !currentZone.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const width = x - zoneStart.value.x;
  const height = y - zoneStart.value.y;
  currentZone.value = {
    ...currentZone.value,
    x: width < 0 ? x : zoneStart.value.x,
    y: height < 0 ? y : zoneStart.value.y,
    width: Math.abs(width),
    height: Math.abs(height),
  };
};

const finishZoneDraw = () => {
  if (!drawingZone.value || !currentZone.value) {
    drawingZone.value = false;
    zoneStart.value = null;
    currentZone.value = null;
    return;
  }
  if (currentZone.value.width > 20 && currentZone.value.height > 20) {
    zones.value.push({ ...currentZone.value });
    saveZones();
  }
  drawingZone.value = false;
  zoneStart.value = null;
  currentZone.value = null;
};

const removeZone = (index) => {
  zones.value.splice(index, 1);
  saveZones();
};

const toggleDrawZone = () => {
  drawingZone.value = !drawingZone.value;
  if (drawingZone.value) {
    zoneStart.value = null;
    currentZone.value = null;
    window.addEventListener("mousemove", onCanvasMouseMove);
    window.addEventListener("mouseup", finishZoneDraw);
  } else {
    zoneStart.value = null;
    currentZone.value = null;
    window.removeEventListener("mousemove", onCanvasMouseMove);
    window.removeEventListener("mouseup", finishZoneDraw);
  }
};

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

onMounted(async () => {
  await load();
  await loadFloorPlans();
  await loadZones();
});

onUnmounted(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("mousemove", onCanvasMouseMove);
  window.removeEventListener("mouseup", finishZoneDraw);
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
        <div class="toolbar-left">
          <p class="hint">
            Drag tables to set their permanent positions on the floor plan.
          </p>
          <select
            v-if="floorPlans.length"
            v-model="selectedFloorPlanId"
            class="form-select"
            style="width: auto; min-width: 180px"
            @change="loadZones"
          >
            <option v-for="plan in floorPlans" :key="plan.id" :value="plan.id">
              {{ plan.name }}
            </option>
          </select>
        </div>
        <div class="toolbar-right">
          <button
            class="btn"
            :class="drawingZone ? 'btn-primary' : 'btn-secondary'"
            @click="toggleDrawZone"
            :disabled="loading"
          >
            {{ drawingZone ? "Drawing Zone..." : "Draw Zone" }}
          </button>
          <button
            class="btn btn-secondary"
            @click="autoArrange"
            :disabled="loading"
          >
            Auto-arrange grid
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading tables...</p>
      </div>
      <div v-else-if="errorMsg" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ errorMsg }}</p>
      </div>
      <div v-else class="canvas" ref="canvasRef" @mousedown="startZoneDraw">
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

        <div
          v-for="(zone, idx) in zones"
          :key="'zone-' + idx"
          class="zone-rect"
          :style="{
            left: zone.x + 'px',
            top: zone.y + 'px',
            width: zone.width + 'px',
            height: zone.height + 'px',
            backgroundColor: zone.color + '66',
            borderColor: zone.color,
          }"
        >
          <span class="zone-label">{{ zone.name }}</span>
          <button
            class="zone-remove"
            @click.stop="removeZone(idx)"
            title="Remove zone"
          >
            ×
          </button>
        </div>

        <div
          v-if="currentZone"
          class="zone-rect zone-drawing"
          :style="{
            left: currentZone.x + 'px',
            top: currentZone.y + 'px',
            width: currentZone.width + 'px',
            height: currentZone.height + 'px',
            backgroundColor: currentZone.color + '66',
            borderColor: currentZone.color,
          }"
        ></div>
      </div>

      <div v-if="zones.length" class="zones-list">
        <div class="zones-header">Zones</div>
        <div
          v-for="(zone, idx) in zones"
          :key="'zone-list-' + idx"
          class="zone-item"
        >
          <span
            class="zone-color-dot"
            :style="{ backgroundColor: zone.color }"
          ></span>
          <input
            type="text"
            class="zone-name-input"
            v-model="zone.name"
            @blur="saveZones"
          />
          <button class="zone-remove-btn" @click="removeZone(idx)">
            Remove
          </button>
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
.btn-primary {
  background: var(--accent);
  color: white;
  border: 1px solid var(--accent);
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover, var(--accent));
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.zone-rect {
  position: absolute;
  border: 2px dashed;
  border-radius: var(--radius-md);
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: var(--space-2);
}
.zone-rect.zone-drawing {
  pointer-events: none;
  opacity: 0.8;
}
.zone-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ink-secondary);
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  pointer-events: none;
}
.zone-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  background: none;
  border: none;
  color: var(--rose-600);
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  line-height: 1;
}
.zones-list {
  margin-top: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}
.zones-header {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  margin-right: var(--space-2);
}
.zone-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-1) var(--space-3);
}
.zone-color-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.zone-name-input {
  border: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink);
  width: 120px;
}
.zone-name-input:focus {
  outline: none;
  border-bottom: 1px solid var(--accent);
}
.zone-remove-btn {
  background: none;
  border: none;
  color: var(--rose-600);
  font-size: var(--text-xs);
  cursor: pointer;
  font-weight: 600;
}
</style>
