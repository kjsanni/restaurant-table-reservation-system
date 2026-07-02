<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, computed, onMounted } from "vue";
import { VaModal, VaButton } from "vuestic-ui";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import tableAPI from "@/services/tableAPI";
import reservationAPI from "@/services/reservationAPI";
import { getApiErrorMessage } from "@/utils/apiError";

const tables = ref([]);
const reservations = ref([]);
const loading = ref(true);
const loadError = ref("");
const draggingReservation = ref(null);
const assignPopupOpen = ref(false);
const selectedTable = ref(null);
const errorPopupOpen = ref(false);
const errorMessage = ref("");
const mergePopupOpen = ref(false);
const merging = ref(false);
const touchMode = ref(false);
const layoutMode = ref("auto");

const layoutModes = [
  { label: "Auto Grid", value: "auto" },
  { label: "Compact", value: "compact" },
  { label: "Wide", value: "wide" },
];

const pendingReservations = computed(() => {
  return (reservations.value || []).filter(
    (r) => r.resStatus === "pending" && !r.tableId
  );
});

const loadData = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const [tRes, rRes] = await Promise.all([
      tableAPI.getTables(),
      reservationAPI.getReservations(),
    ]);
    tables.value = tRes.data.collection;
    reservations.value = rRes.data.collection;
  } catch (err) {
    loadError.value =
      err.response?.data?.message ||
      err.message ||
      "Failed to load data. Please try again.";
  } finally {
    loading.value = false;
  }
};

const tableStatus = (table) => {
  if (table.isBlocked) return "blocked";
  if (table.isOccupied || table.reservationId) return "occupied";
  return "free";
};

const statusColor = (status) => {
  switch (status) {
    case "occupied":
      return "#ef4444";
    case "blocked":
      return "#6c757d";
    default:
      return "#22c55e";
  }
};

const reservationForTable = (table) => {
  return reservations.value.find((r) => r.id === table.reservationId);
};

const allowDrop = (table) => {
  return tableStatus(table) === "free" && !table.parentTableId;
};

const gridMinWidth = computed(() => {
  switch (layoutMode.value) {
    case "compact":
      return "140px";
    case "wide":
      return "220px";
    default:
      return "170px";
  }
});

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
  touchMode.value = false;
};

const onTouchStart = (reservation, event) => {
  touchMode.value = true;
  draggingReservation.value = reservation;
  event.preventDefault();
};

const onTouchMove = (event) => {
  if (!draggingReservation.value || !touchMode.value) return;
  const touch = event.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  document
    .querySelectorAll(".table-block.drag-over")
    .forEach((elem) => elem.classList.remove("drag-over"));
  const tableBlock = el?.closest(".table-block");
  if (tableBlock) {
    tableBlock.classList.add("drag-over");
  }
};

const onTouchEnd = (event) => {
  if (!draggingReservation.value || !touchMode.value) return;
  const touch = event.changedTouches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const tableBlock = el?.closest(".table-block");
  document
    .querySelectorAll(".table-block.drag-over")
    .forEach((elem) => elem.classList.remove("drag-over"));
  if (tableBlock) {
    const tableId = parseInt(tableBlock.dataset.tableId);
    const table = tables.value.find((t) => t.id === tableId);
    if (table && allowDrop(table)) {
      selectedTable.value = table;
      assignPopupOpen.value = true;
    }
  }
  draggingReservation.value = null;
  touchMode.value = false;
};

const onTableDragOver = (table, event) => {
  if (allowDrop(table)) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }
};

const onDragEnter = (table) => {
  if (allowDrop(table)) {
    const idx = tables.value.findIndex((t) => t.id === table.id);
    const el = document.querySelectorAll(".table-block")[idx];
    el?.classList.add("drag-over");
  }
};

const onDragLeave = (table) => {
  const idx = tables.value.findIndex((t) => t.id === table.id);
  const el = document.querySelectorAll(".table-block")[idx];
  el?.classList.remove("drag-over");
};

const onDrop = (table, event) => {
  event.preventDefault();
  document
    .querySelectorAll(".table-block.drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  if (!allowDrop(table) || !draggingReservation.value) return;
  selectedTable.value = table;
  assignPopupOpen.value = true;
};

const confirmAssign = async () => {
  if (!draggingReservation.value || !selectedTable.value) return;
  const reservation = draggingReservation.value;
  const table = selectedTable.value;

  if (reservation.people > 4 && reservation.people > table.capacity) {
    assignPopupOpen.value = false;
    mergePopupOpen.value = true;
    return;
  }

  try {
    await reservationAPI.chooseTable(reservation.id, selectedTable.value.id);
    assignPopupOpen.value = false;
    draggingReservation.value = null;
    selectedTable.value = null;
    await loadData();
  } catch (err) {
    errorMessage.value = getApiErrorMessage(err, "Failed to assign table");
    errorPopupOpen.value = true;
  }
};

const findTablesToMerge = (requiredSeats, includeTable) => {
  const available = tables.value.filter(
    (t) =>
      !t.isBlocked &&
      !t.isOccupied &&
      !t.parentTableId &&
      t.id !== includeTable.id
  );

  available.sort((a, b) => b.capacity - a.capacity);

  let totalCapacity = includeTable.capacity;
  const selected = [includeTable];

  for (const table of available) {
    if (totalCapacity >= requiredSeats) break;
    selected.push(table);
    totalCapacity += table.capacity;
  }

  return totalCapacity >= requiredSeats ? selected : null;
};

const performMergeAssign = async () => {
  if (!draggingReservation.value || !selectedTable.value) return;
  merging.value = true;

  try {
    const tablesToMerge = findTablesToMerge(
      draggingReservation.value.people,
      selectedTable.value
    );

    if (!tablesToMerge) {
      errorMessage.value =
        `Not enough free tables to seat ` +
        `${draggingReservation.value.people} guests.`;
      errorPopupOpen.value = true;
      mergePopupOpen.value = false;
      assignPopupOpen.value = false;
      return;
    }

    const mergeResult = await tableAPI.mergeTables(
      tablesToMerge.map((t) => t.id)
    );
    const parentTableId = mergeResult.data.item.parentTable.id;

    await reservationAPI.chooseTable(
      draggingReservation.value.id,
      parentTableId
    );

    mergePopupOpen.value = false;
    assignPopupOpen.value = false;
    draggingReservation.value = null;
    selectedTable.value = null;
    await loadData();
  } catch (err) {
    errorMessage.value = getApiErrorMessage(
      err,
      "Failed to merge and assign tables"
    );
    errorPopupOpen.value = true;
  } finally {
    merging.value = false;
  }
};

const closeAssign = () => {
  assignPopupOpen.value = false;
  selectedTable.value = null;
  draggingReservation.value = null;
};

onMounted(loadData);
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Floor Plan" />
    <div class="content-wrapper">
      <div v-if="loadError" class="error-banner" role="alert">
        <span class="error-icon">⚠️</span>
        <span>{{ loadError }}</span>
        <button class="error-retry" @click="loadData">Retry</button>
      </div>
      <div v-if="loading" class="loading-state">
        <LoadingSpinner text="Loading floor plan..." />
      </div>
      <div v-else class="floor-layout">
        <aside class="sidebar-panel">
          <div class="panel-header">
            <h2>Pending Reservations</h2>
            <span class="badge">{{ pendingReservations.length }}</span>
          </div>
          <div class="layout-selector">
            <label class="layout-label">Layout:</label>
            <select v-model="layoutMode" class="layout-select">
              <option
                v-for="mode in layoutModes"
                :key="mode.value"
                :value="mode.value"
              >
                {{ mode.label }}
              </option>
            </select>
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
              <div class="drag-hint">Drag or tap to assign</div>
            </div>
          </div>
        </aside>

        <main class="plan-panel">
          <div class="legend-bar">
            <span class="legend-pill free">
              <span class="dot"></span> Free
            </span>
            <span class="legend-pill occupied">
              <span class="dot"></span> Occupied
            </span>
            <span class="legend-pill blocked">
              <span class="dot"></span> Blocked
            </span>
          </div>
          <div
            class="plan-grid"
            :style="{
              gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`,
            }"
          >
            <div
              v-for="table in tables"
              :key="table.id"
              :class="['table-block', tableStatus(table)]"
              :data-table-id="table.id"
              @dragover.prevent="onTableDragOver(table, $event)"
              @dragenter.prevent="onDragEnter(table)"
              @dragleave="onDragLeave(table)"
              @drop.prevent="onDrop(table, $event)"
            >
              <div class="table-top">
                <div class="table-id-row">
                  <span class="table-id">{{
                    table.name || `T${table.id}`
                  }}</span>
                  <span
                    class="status-dot"
                    :style="{
                      backgroundColor: statusColor(tableStatus(table)),
                    }"
                  ></span>
                </div>
                <span class="capacity">🪑 {{ table.capacity }}</span>
              </div>
              <div v-if="table.reservationId" class="table-reservation">
                <span class="res-name">
                  {{
                    reservationForTable(table)?.name?.split(" ")[0] || "Guest"
                  }}
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
        Drag a pending reservation from the list onto a free table to assign it.
        For parties larger than a single table, you will be prompted to merge
        tables. Touch devices: tap and hold a reservation, then tap a free
        table.
      </p>

      <VaModal v-model="assignPopupOpen" title="Assign to Table" size="small">
        <template #content>
          <div class="assign-content">
            <p class="assign-text">
              Assign <strong>{{ draggingReservation?.name }}</strong> ({{
                draggingReservation?.people
              }}
              guests) to
              <strong
                >Table {{ selectedTable?.name || selectedTable?.id }}</strong
              >?
            </p>
            <div class="popup-actions">
              <VaButton preset="secondary" @click="closeAssign"
                >Cancel</VaButton
              >
              <VaButton preset="primary" @click="confirmAssign"
                >Assign</VaButton
              >
            </div>
          </div>
        </template>
      </VaModal>

      <VaModal
        v-model="mergePopupOpen"
        title="Merge Tables Needed?"
        size="small"
      >
        <template #content>
          <div class="assign-content">
            <p class="assign-text">
              Table
              <strong>{{ selectedTable?.name || selectedTable?.id }}</strong>
              only has <strong>{{ selectedTable?.capacity }}</strong> seats, but
              the reservation needs
              <strong>{{ draggingReservation?.people }}</strong> seats. Do you
              want to merge tables?
            </p>
            <div class="popup-actions">
              <VaButton
                preset="secondary"
                @click="
                  () => {
                    mergePopupOpen = false;
                    assignPopupOpen = true;
                  }
                "
                >Cancel</VaButton
              >
              <VaButton
                preset="primary"
                @click="performMergeAssign"
                :loading="merging"
              >
                {{ merging ? "Merging..." : "Merge & Assign" }}
              </VaButton>
            </div>
          </div>
        </template>
      </VaModal>

      <VaModal v-model="errorPopupOpen" title="Error" size="small">
        <template #content>
          <div class="error-content">
            <p>{{ errorMessage }}</p>
            <div class="confirm-actions">
              <VaButton preset="secondary" @click="errorPopupOpen = false"
                >OK</VaButton
              >
            </div>
          </div>
        </template>
      </VaModal>
    </div>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
  color: var(--restaurant-secondary);
  font-family: "Inter-Light";
}

.floor-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.sidebar-panel {
  width: 240px;
  min-width: 220px;
  background: white;
  border: 1px solid var(--restaurant-border);
  border-radius: 10px;
  padding: 16px;
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  box-shadow: var(--card-shadow);
}

.plan-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border: 1px solid var(--restaurant-border);
  border-radius: 10px;
  padding: 16px;
  box-shadow: var(--card-shadow);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.panel-header h2 {
  font-family: "Inter-Bold";
  font-size: 14px;
  color: var(--restaurant-primary);
  margin: 0;
}

.badge {
  font-family: "Inter-Medium";
  font-size: 11px;
  background: var(--restaurant-primary);
  color: white;
  padding: 2px 8px;
  border-radius: 999px;
}

.layout-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.layout-label {
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--restaurant-secondary);
}

.layout-select {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--restaurant-border);
  border-radius: 6px;
  font-family: "Inter-Light";
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 20px 0;
  color: var(--restaurant-secondary);
  font-family: "Inter-Light";
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.empty-icon {
  font-size: 20px;
  opacity: 0.5;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pending-card {
  background: #f8fafc;
  border: 1px solid var(--restaurant-border);
  border-radius: 8px;
  padding: 10px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.pending-card:hover {
  background: white;
  border-color: var(--restaurant-accent);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.pending-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.pending-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--restaurant-accent);
  color: white;
  font-family: "Inter-Bold";
  font-size: 12px;
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
  font-size: 12px;
  color: var(--restaurant-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pending-meta {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--restaurant-secondary);
}

.pending-notes {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--restaurant-warning);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-hint {
  font-family: "Inter-Light";
  font-size: 10px;
  color: var(--restaurant-secondary);
  opacity: 0.6;
}

.legend-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: "Inter-Medium";
  font-size: 11px;
  background: #f1f5f9;
  color: var(--restaurant-primary);
}

.legend-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-pill.free .dot {
  background-color: var(--restaurant-success);
}

.legend-pill.occupied .dot {
  background-color: var(--restaurant-danger);
}

.legend-pill.blocked .dot {
  background-color: var(--restaurant-secondary);
}

.plan-grid {
  display: grid;
  gap: 12px;
}

.table-block {
  background: white;
  border: 1px solid var(--restaurant-border);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-block:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
}

.table-block.free {
  border-left: 3px solid var(--restaurant-success);
}

.table-block.free.drag-over {
  border-color: var(--restaurant-success);
  background: #f0fdf4;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.3);
}

.table-block.occupied {
  border-left: 3px solid var(--restaurant-danger);
}

.table-block.blocked {
  border-left: 3px solid var(--restaurant-secondary);
}

.table-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-id-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.table-id {
  font-family: "Inter-Bold";
  font-size: 14px;
  color: var(--restaurant-primary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.capacity {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--restaurant-secondary);
}

.table-reservation {
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid var(--restaurant-border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.res-name {
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--restaurant-danger);
}

.res-time {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--restaurant-secondary);
}

.table-empty {
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px dashed var(--restaurant-border);
  text-align: center;
  font-family: "Inter-Medium";
  font-size: 11px;
  color: var(--restaurant-secondary);
}

.hint-bar {
  text-align: center;
  font-family: "Lora", Georgia, serif;
  font-size: 13px;
  color: var(--restaurant-warm-gray);
  margin-top: 20px;
  line-height: 1.5;
}

.assign-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assign-text {
  font-family: "Lora", Georgia, serif;
  font-size: 14px;
  color: var(--restaurant-warm-gray);
  line-height: 1.6;
  margin: 0;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  margin-top: 8px;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.error-content p {
  font-family: "Lora", Georgia, serif;
  font-size: 14px;
  color: var(--restaurant-warm-gray);
  margin: 0;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  margin-bottom: 20px;
  font-family: "Inter-Medium";
  font-size: 14px;
  color: #991b1b;
}

.error-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.error-retry {
  margin-left: auto;
  padding: 6px 14px;
  border: 1px solid #dc2626;
  border-radius: 6px;
  background: white;
  color: #dc2626;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.error-retry:hover {
  background: #fef2f2;
}

@media screen and (max-width: 860px) {
  .floor-layout {
    flex-direction: column;
  }

  .sidebar-panel {
    width: 100%;
    min-width: 100%;
    max-height: 240px;
  }
}
</style>
