<script setup>
import { ref, computed } from "vue";
import PopupBox from "@/components/PopupBox.vue";
import RESERVATION_STATUS from "@/constants/reservationStatus";

const props = defineProps({
  tables: {
    type: Array,
    default: () => [],
  },
  reservations: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["assign"]);

const draggingReservation = ref(null);
const assignPopupOpen = ref(false);
const selectedTable = ref(null);
const selectedLinkedTables = ref([]);
const touchedTable = ref(null);

const layoutDefaults = () => {
  const stored = localStorage.getItem("floorPlanLayout");
  return stored ? JSON.parse(stored) : {};
};

const tablePositions = computed(() => {
  const defaults = layoutDefaults();
  return props.tables.reduce((acc, table) => {
    const pos = defaults[table.id] || { x: 0, y: 0 };
    acc[table.id] = pos;
    return acc;
  }, {});
});

const savePositions = (positions) => {
  localStorage.setItem("floorPlanLayout", JSON.stringify(positions));
};

const moveTable = (tableId, dx, dy) => {
  const current = tablePositions.value[tableId] || { x: 0, y: 0 };
  const updated = { x: current.x + dx, y: current.y + dy };
  const all = { ...tablePositions.value, [tableId]: updated };
  savePositions(all);
};

const onTouchStart = (reservation, event) => {
  draggingReservation.value = reservation;
  touchedTable.value = null;
};

const onTouchMove = (event) => {
  if (!draggingReservation.value || !event.touches[0]) return;
  const touch = event.touches[0];
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!element) return;
  const block = element.closest(".table-block");
  if (!block || !block.parentNode) return;
  const idx = Array.from(block.parentNode.children).indexOf(block);
  const table = props.tables[idx];
  if (!table || !allowDrop(table)) return;
  if (touchedTable.value?.id !== table.id) {
    touchedTable.value = table;
  }
};

const onTouchEnd = () => {
  if (draggingReservation.value && touchedTable.value) {
    onTableClick(touchedTable.value);
  }
  touchedTable.value = null;
};

const onTableTouchEnd = (table, event) => {
  if (draggingReservation.value) {
    onTableClick(table);
  }
};

const pendingReservations = computed(() => {
  return (props.reservations || []).filter(
    (r) => r.resStatus === RESERVATION_STATUS.PENDING && !r.tableId
  );
});

const calculateCount = (people) => {
  if (!people) return 1;
  return Math.max(1, Math.ceil(people / 6));
};

const freeTablesList = computed(() => {
  return (props.tables || [])
    .filter((t) => !t.isOccupied && !t.isBlocked && !t.reservationId)
    .sort((a, b) => a.id - b.id);
});

const tableMergeDisplayName = () => {
  const primary = selectedTable.value
    ? selectedTable.value.name || `T${selectedTable.value.id}`
    : null;
  if (!primary) return "";
  const linked = selectedLinkedTables.value.map((t) => t.name || `T${t.id}`);
  if (!linked.length) return primary;
  return `${primary} + ${linked.join(" + ")}`;
};

const dragNeedsMerge = computed(() => {
  if (!draggingReservation.value) return false;
  return calculateCount(draggingReservation.value.people) > 1;
});

const tableStatus = (table) => {
  if (table.isBlocked) return "blocked";
  if (table.isOccupied || table.reservationId) return "occupied";
  return "free";
};

const statusColor = (status) => {
  switch (status) {
    case "occupied":
      return "#f43f5e";
    case "blocked":
      return "#9a9389";
    default:
      return "#4d7c0f";
  }
};

const reservationForTable = (table) => {
  return props.reservations.find((r) => r.id === table.reservationId);
};

const allowDrop = (table) => {
  return tableStatus(table) === "free";
};

const onDragStart = (reservation, event) => {
  draggingReservation.value = reservation;
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", reservation.id);
    event.dataTransfer.setData("application/json", JSON.stringify(reservation));
    event.dataTransfer.effectAllowed = "move";
  }
};

const onDragEnd = () => {
  document
    .querySelectorAll(".table-block.drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
};

const onTableDragOver = (table, event) => {
  if (allowDrop(table)) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }
};

const onTableDragEnter = (table) => {
  if (allowDrop(table)) {
    const idx = props.tables.findIndex((t) => t.id === table.id);
    const el = document.querySelectorAll(".table-block")[idx];
    el?.classList.add("drag-over");
  }
};

const onTableDragLeave = (table) => {
  const idx = props.tables.findIndex((t) => t.id === table.id);
  const el = document.querySelectorAll(".table-block")[idx];
  el?.classList.remove("drag-over");
};

const onTableClick = (table) => {
  if (!draggingReservation.value) return;
  if (!allowDrop(table)) return;
  if (selectedTable.value?.id === table.id) return;

  const requiredCount = calculateCount(draggingReservation.value.people);

  if (!selectedTable.value) {
    selectedTable.value = table;
    selectedLinkedTables.value = requiredCount > 1 ? [] : [];
  } else {
    const alreadySelected = selectedLinkedTables.value.find(
      (t) => t.id === table.id
    );
    if (alreadySelected) return;

    selectedLinkedTables.value.push(table);
  }

  if (
    selectedLinkedTables.value.length > 0 &&
    selectedLinkedTables.value.length + 1 >= requiredCount
  ) {
    assignPopupOpen.value = true;
  }
};

const onDrop = (table, event) => {
  event.preventDefault();
  document
    .querySelectorAll(".table-block.drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  if (!allowDrop(table) || !draggingReservation.value) return;

  const requiredCount = calculateCount(draggingReservation.value.people);
  selectedTable.value = table;
  selectedLinkedTables.value = [];

  if (requiredCount > 1) {
    const candidates = freeTablesList.value.filter((t) => t.id !== table.id);
    selectedLinkedTables.value = candidates.slice(0, requiredCount - 1);
  }

  assignPopupOpen.value = true;
};

const confirmAssign = () => {
  if (!draggingReservation.value || !selectedTable.value) return;

  emit("assign", {
    reservationId: draggingReservation.value.id,
    tableId: selectedTable.value.id,
  });

  assignPopupOpen.value = false;
  draggingReservation.value = null;
  selectedTable.value = null;
  selectedLinkedTables.value = [];
};

const closeAssign = () => {
  assignPopupOpen.value = false;
  selectedTable.value = null;
  draggingReservation.value = null;
  selectedLinkedTables.value = [];
};
</script>

<template>
  <div class="floor-layout">
    <aside class="sidebar-panel">
      <div class="panel-header">
        <h2>Pending Reservations</h2>
        <span class="badge">{{ pendingReservations.length }}</span>
      </div>
      <div v-if="pendingReservations.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No pending reservations</p>
      </div>
      <div class="pending-list">
        <div
          v-for="res in pendingReservations"
          :key="res.id"
          class="pending-card"
          draggable="true"
          @dragstart="onDragStart(res, $event)"
          @dragend="onDragEnd"
          @touchstart="onTouchStart(res, $event)"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <div class="pending-header">
            <span class="pending-avatar">
              {{ (res.name || "G")[0]?.toUpperCase() }}
            </span>
            <div class="pending-title">
              <span class="pending-name">{{ res.name || "Guest" }}</span>
              <span class="pending-meta">
                {{ res.people }} guests · {{ res.resTime?.slice(0, 5) }}
              </span>
            </div>
          </div>
          <div v-if="res.notes" class="pending-notes">
            {{ res.notes }}
          </div>
          <div class="drag-hint">Drag onto a free table</div>
        </div>
      </div>
    </aside>

    <main class="plan-panel">
      <div class="legend-bar">
        <span class="legend-pill free"> <span class="dot"></span> Free </span>
        <span class="legend-pill occupied">
          <span class="dot"></span> Occupied
        </span>
        <span class="legend-pill blocked">
          <span class="dot"></span> Blocked
        </span>
        <span class="legend-pill merged" v-if="dragNeedsMerge">
          <span class="dot"></span> Merged
        </span>
      </div>
      <div class="plan-grid">
        <div
          v-for="table in props.tables"
          :key="table.id"
          :class="[
            'table-block',
            tableStatus(table),
            {
              selected:
                selectedTable?.id === table.id ||
                selectedLinkedTables.some((t) => t.id === table.id),
              selectable: allowDrop(table) && !!draggingReservation,
              touched: !!touchedTable && touchedTable.id === table.id,
            },
          ]"
          @dragover.prevent="onTableDragOver(table, $event)"
          @dragenter.prevent="onTableDragEnter(table, $event)"
          @dragleave.prevent="onTableDragLeave(table, $event)"
          @drop.prevent="onDrop(table, $event)"
          @click="onTableClick(table)"
          @touchend.prevent="onTableTouchEnd(table, $event)"
        >
          <div class="table-top">
            <div class="table-id-row">
              <span class="table-id">{{ table.name || `T${table.id}` }}</span>
              <span
                class="status-dot"
                :style="{
                  backgroundColor: statusColor(tableStatus(table)),
                }"
              ></span>
            </div>
            <span class="capacity">🪑 {{ table.capacity }}</span>
          </div>
          <div class="linked-badge" v-if="table.linkedTableIds?.length">
            Linked: {{ table.linkedTableIds.length + 1 }} tables
          </div>
          <div v-if="table.reservationId" class="table-reservation">
            <span class="res-name">
              {{ reservationForTable(table)?.name?.split(" ")[0] || "Guest" }}
            </span>
            <span class="res-time">
              {{ reservationForTable(table)?.resTime?.slice(0, 5) }}
            </span>
          </div>
          <div v-else class="table-empty">
            <span>Available</span>
          </div>
        </div>
      </div>
    </main>
  </div>

  <p class="hint-bar">
    <template v-if="dragNeedsMerge">
      <strong>
        {{ draggingReservation?.people }} guests need
        {{ calculateCount(draggingReservation?.people) }} tables.
      </strong>
      Drop on one table, then tap extra tables to select them.
    </template>
    <template v-else>
      Drag or tap a pending reservation, then tap a free table to assign it.
    </template>
  </p>

  <PopupBox
    :is-open="assignPopupOpen"
    header-text="Assign to Table"
    :is-closable="true"
    @close-modal="closeAssign"
  >
    <template #popup-content>
      <div class="assign-content">
        <p class="assign-text">
          Assign <strong>{{ draggingReservation?.name }}</strong> ({{
            draggingReservation?.people
          }}
          guests) to
          <strong>{{ tableMergeDisplayName() }}</strong
          >?
        </p>
        <div v-if="selectedLinkedTables.length" class="merge-rows">
          <div
            class="merge-row"
            v-for="tbl in selectedLinkedTables"
            :key="tbl.id"
          >
            🪑 {{ tbl.name || `T${tbl.id}` }} (cap {{ tbl.capacity }})
          </div>
        </div>
        <div class="popup-actions">
          <button class="btn btn-outline" @click="closeAssign">Cancel</button>
          <button class="btn btn-primary" @click="confirmAssign">Assign</button>
        </div>
      </div>
    </template>
  </PopupBox>
</template>

<style scoped>
.floor-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.sidebar-panel {
  width: 260px;
  min-width: 240px;
  background: var(--primary-white);
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  max-height: calc(100vh - 260px);
  overflow-y: auto;
  box-shadow: var(--card-shadow);
}

.plan-panel {
  flex: 1;
  min-width: 0;
  background: var(--primary-white);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.panel-header h2 {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 15px;
  color: var(--primary-black);
  margin: 0;
}

.badge {
  font-family: "Inter-Medium";
  font-size: 12px;
  background: var(--primary-blue);
  color: white;
  padding: 2px 10px;
  border-radius: 999px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pending-card {
  background: var(--neutral-50);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px;
  cursor: grab;
  transition: background-color 0.2s ease, box-shadow 0.2s ease,
    transform 0.2s ease;
  user-select: none;
  touch-action: none;
}

.pending-card:hover {
  background: white;
  border-color: var(--primary-blue);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.12);
  transform: translateY(-1px);
}

.pending-card:active {
  cursor: grabbing;
  transform: translateY(0);
}

.pending-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.pending-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
  color: var(--primary-blue);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pending-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pending-name {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pending-meta {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 12px;
  color: var(--secondary-gray);
}

.pending-notes {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 12px;
  color: var(--accent-600);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-hint {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 11px;
  color: var(--secondary-gray);
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: 24px 0;
  color: var(--secondary-gray);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 22px;
  opacity: 0.6;
}

.legend-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-family: "Inter-Medium";
  font-size: 12px;
  background: var(--neutral-100);
  color: var(--primary-black);
}

.legend-pill .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-pill.free .dot {
  background-color: var(--earth-500);
}

.legend-pill.occupied .dot {
  background-color: var(--rose-500);
}

.legend-pill.blocked .dot {
  background-color: var(--neutral-500);
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
}

.table-block {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px;
  transition: all 0.2s ease;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  touch-action: manipulation;
}

.table-block:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.table-block.free {
  border-color: var(--earth-500);
  background: linear-gradient(180deg, var(--earth-50) 0%, var(--surface) 100%);
}

.table-block.free.drag-over {
  border-color: var(--earth-600);
  background: var(--earth-100);
  box-shadow: 0 0 0 3px var(--earth-200);
  transform: translateY(-1px);
}

.table-block.touched {
  border-color: var(--sky-500);
  box-shadow: 0 0 0 3px var(--sky-100);
  transform: translateY(-1px);
}

.table-block.occupied {
  border-color: var(--rose-500);
  background: linear-gradient(180deg, var(--rose-50) 0%, var(--surface) 100%);
  opacity: 0.9;
}

.table-block.blocked {
  border-color: var(--neutral-500);
  background: linear-gradient(180deg, var(--neutral-50) 0%, var(--surface) 100%);
  opacity: 0.7;
}

.table-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-id-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-id {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 15px;
  color: var(--primary-black);
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}

.capacity {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 12px;
  color: var(--secondary-gray);
}

.table-reservation {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.res-name {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--rose-500);
}

.res-time {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 12px;
  color: var(--secondary-gray);
}

.table-empty {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed #f0f0f0;
  text-align: center;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--secondary-gray);
}

.selectable:hover {
  border-color: var(--primary-blue);
  background: #f8faff;
}

.table-block.selected {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.linked-badge {
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--sky-100);
  color: var(--sky-600);
  font-family: "Inter-Medium";
  font-size: 11px;
  align-self: flex-start;
}

.legend-pill.merged .dot {
  background-color: var(--accent-500);
}

.merge-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  background: var(--neutral-50);
}

.merge-row {
  font-family: "Inter-Medium";
  font-size: 13px;
}

.hint-bar {
  text-align: center;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 13px;
  color: var(--ink-muted);
  margin-top: 18px;
  padding: 10px;
  border-radius: 8px;
  background: var(--neutral-50);
}

.assign-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.assign-text {
  font-size: 14px;
  line-height: 1.5;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--border);
  color: var(--ink);
  border-radius: 8px;
  padding: 8px 16px;
  font-family: "Inter-Medium";
  font-size: 13px;
}

.btn-outline:hover {
  background-color: var(--neutral-100);
}

.btn-primary {
  background-color: var(--accent-500);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: background-color var(--duration-150) var(--ease-in-out);
}

.btn-primary:hover {
  background-color: var(--accent-600);
}

@media screen and (max-width: 860px) {
  .floor-layout {
    flex-direction: column;
  }

  .sidebar-panel {
    width: 100%;
    min-width: 100%;
    max-height: 260px;
  }

  .plan-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>
