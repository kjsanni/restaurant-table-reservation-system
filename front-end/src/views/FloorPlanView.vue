<script setup>
import { ref, computed, onMounted } from "vue";
import tableAPI from "@/services/tableAPI";
import reservationAPI from "@/services/reservationAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";
import PageHeader from "@/components/PageHeader.vue";

const tables = ref([]);
const reservations = ref([]);
const loading = ref(true);
const draggingReservation = ref(null);
const assignPopupOpen = ref(false);
const selectedTable = ref(null);
const selectedLinkedTables = ref([]);
const errorPopupOpen = ref(false);
const errorMessage = ref("");

const pendingReservations = computed(() => {
  return (reservations.value || []).filter(
    (r) => r.resStatus === "pending" && !r.tableId
  );
});

const calculateCount = (people) => {
  if (!people) return 1;
  return Math.max(1, Math.ceil(people / 6));
};

const freeTablesList = computed(() => {
  return (tables.value || [])
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

const loadData = async () => {
  loading.value = true;
  try {
    const [tRes, rRes] = await Promise.all([
      tableAPI.getTables(),
      reservationAPI.getReservations(),
    ]);
    tables.value = tRes.data.collection;
    reservations.value = rRes.data.collection;
  } catch (err) {
    logger.error("Failed to load floor plan", { error: err.message });
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
    const idx = tables.value.findIndex((t) => t.id === table.id);
    const el = document.querySelectorAll(".table-block")[idx];
    el?.classList.add("drag-over");
  }
};

const onTableDragLeave = (table) => {
  const idx = tables.value.findIndex((t) => t.id === table.id);
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

const confirmAssign = async () => {
  if (!draggingReservation.value || !selectedTable.value) return;

  try {
    await reservationAPI.chooseTable(
      draggingReservation.value.id,
      selectedTable.value.id
    );
    assignPopupOpen.value = false;
    draggingReservation.value = null;
    selectedTable.value = null;
    selectedLinkedTables.value = [];
    await loadData();
  } catch (err) {
    logger.error("Assign table error", { error: err.message });
    errorMessage.value = getApiErrorMessage(err, "Failed to assign table");
    errorPopupOpen.value = true;
  }
};

const closeAssign = () => {
  assignPopupOpen.value = false;
  selectedTable.value = null;
  draggingReservation.value = null;
  selectedLinkedTables.value = [];
};

onMounted(loadData);
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Floor Plan" subtitle="Visual table layout and seating" />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading floor plan...</p>
      </div>
      <div v-else class="floor-layout">
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
            <span class="legend-pill free">
              <span class="dot"></span> Free
            </span>
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
              v-for="table in tables"
              :key="table.id"
              :class="[
                'table-block',
                tableStatus(table),
                {
                  selected:
                    selectedTable?.id === table.id ||
                    selectedLinkedTables.some((t) => t.id === table.id),
                },
              ]"
              @dragover.prevent="onTableDragOver(table, $event)"
              @dragenter.prevent="onTableDragEnter(table, $event)"
              @dragleave.prevent="onTableDragLeave(table, $event)"
              @drop.prevent="onDrop(table, $event)"
              @click="onTableClick(table)"
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
              <div class="linked-badge" v-if="table.linkedTableIds?.length">
                Linked: {{ table.linkedTableIds.length + 1 }} tables
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
        <template v-if="dragNeedsMerge">
          <strong>
            {{ draggingReservation?.people }} guests need
            {{ calculateCount(draggingReservation?.people) }} tables.
          </strong>
          Drop on one table, then click extra tables to select them.
        </template>
        <template v-else>
          Drag a pending reservation from the list onto a free table to assign
          it.
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
              <button class="btn btn-outline" @click="closeAssign">
                Cancel
              </button>
              <button class="btn btn-primary" @click="confirmAssign">
                Assign
              </button>
            </div>
          </div>
        </template>
      </PopupBox>

      <PopupBox
        :is-open="errorPopupOpen"
        header-text="Error"
        :is-closable="true"
        @close-modal="errorPopupOpen = false"
      >
        <template #popup-content>
          <div class="error-content">
            <p>{{ errorMessage }}</p>
            <div class="confirm-actions">
              <button class="btn btn-secondary" @click="errorPopupOpen = false">
                OK
              </button>
            </div>
          </div>
        </template>
      </PopupBox>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
  color: var(--restaurant-warm-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--restaurant-border);
  border-top-color: var(--color-info-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.floor-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.sidebar-panel {
  width: 260px;
  min-width: 240px;
  background: var(--restaurant-surface);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  max-height: calc(100vh - 260px);
  overflow-y: auto;
  box-shadow: var(--card-shadow);
}

.plan-panel {
  flex: 1;
  min-width: 0;
  background: var(--restaurant-surface);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.panel-header h2 {
  font-family: "Inter-Bold";
  font-size: 15px;
  color: var(--restaurant-charcoal);
  margin: 0;
}

.badge {
  font-family: "Inter-Medium";
  font-size: 12px;
  background: var(--color-info-600);
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
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px;
  cursor: grab;
  transition: background-color 0.2s ease, box-shadow 0.2s ease,
    transform 0.2s ease;
  user-select: none;
}

.pending-card:hover {
  background: white;
  border-color: var(--color-info-600);
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
  color: var(--color-info-600);
  font-family: "Inter-Bold";
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
  color: var(--restaurant-charcoal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pending-meta {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--restaurant-warm-gray);
}

.pending-notes {
  font-family: "Inter-Light";
  font-size: 12px;
  color: #f59e0b;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-hint {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--restaurant-warm-gray);
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: 24px 0;
  color: var(--restaurant-warm-gray);
  font-family: "Inter-Light";
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

.plan-panel {
  flex: 1;
  min-width: 0;
  background: var(--restaurant-surface);
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
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
  background: #f3f4f6;
  color: var(--restaurant-charcoal);
}

.legend-pill .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-pill.free .dot {
  background-color: #22c55e;
}

.legend-pill.occupied .dot {
  background-color: #ef4444;
}

.legend-pill.blocked .dot {
  background-color: #6c757d;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
}

.table-block {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 14px;
  transition: all 0.2s ease;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.table-block:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.table-block.free {
  border-color: #22c55e;
  background: linear-gradient(180deg, #f6fef9 0%, #ffffff 100%);
}

.table-block.free.drag-over {
  border-color: #16a34a;
  background: #dcfce7;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.35);
  transform: translateY(-1px);
}

.table-block.occupied {
  border-color: #ef4444;
  background: linear-gradient(180deg, #fff5f5 0%, #ffffff 100%);
  opacity: 0.9;
}

.table-block.blocked {
  border-color: #6c757d;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
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
  font-family: "Inter-Bold";
  font-size: 15px;
  color: var(--restaurant-charcoal);
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}

.capacity {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--restaurant-warm-gray);
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
  color: #ef4444;
}

.res-time {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--restaurant-warm-gray);
}

.table-empty {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed #f0f0f0;
  text-align: center;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--restaurant-warm-gray);
}

.selectable:hover {
  border-color: var(--color-info-600);
  background: #f8faff;
}

.table-block.selected {
  border-color: var(--color-info-600);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.linked-badge {
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-family: "Inter-Medium";
  font-size: 11px;
  align-self: flex-start;
}

.legend-pill.merged .dot {
  background-color: #f59e0b;
}

.merge-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
}

.merge-row {
  font-family: "Inter-Medium";
  font-size: 13px;
}

.hint-bar {
  text-align: center;
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--restaurant-warm-gray);
  margin-top: 18px;
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
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
  border-top: 1px solid var(--restaurant-border);
}

.loading {
  text-align: center;
  padding: 60px;
  font-family: "Inter-Light";
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--restaurant-border);
  color: var(--restaurant-charcoal);
  border-radius: 8px;
  padding: 8px 16px;
  font-family: "Inter-Medium";
  font-size: 13px;
}

.btn-outline:hover {
  background-color: #f3f4f6;
}

.btn-primary {
  background-color: var(--color-info-600);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #2563eb;
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

.error-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-content p {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--restaurant-charcoal);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
