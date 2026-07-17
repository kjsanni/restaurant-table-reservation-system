<script setup>
import { ref, computed, onMounted } from "vue";
import tableAPI from "@/services/tableAPI";
import reservationAPI from "@/services/reservationAPI";
import waitlistAPI from "@/services/waitlistAPI";
import paymentAPI from "@/services/paymentAPI";
import floorPlanAPI from "@/services/floorPlanAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";
import PageHeader from "@/components/PageHeader.vue";

const tables = ref([]);
const reservations = ref([]);
const waitlist = ref([]);
const loading = ref(true);
const draggingReservation = ref(null);
const draggingWaitlist = ref(null);
const assignPopupOpen = ref(false);
const selectedTable = ref(null);
const selectedLinkedTables = ref([]);
const errorPopupOpen = ref(false);
const errorMessage = ref("");
const showAddTable = ref(false);
const newTableName = ref("");
const newTableCapacity = ref(4);
const addError = ref("");

const SECTIONS = ["main", "bar", "patio", "terrace", "private"];
const sectionFilter = ref("all");
const floorPlans = ref([]);
const selectedFloorPlan = ref("all");
const displayTables = computed(() => {
  let list = tables.value;
  if (sectionFilter.value !== "all") {
    list = list.filter((t) => (t.section || "main") === sectionFilter.value);
  }
  if (selectedFloorPlan.value !== "all") {
    list = list.filter(
      (t) => String(t.floorPlanId) === String(selectedFloorPlan.value)
    );
  }
  return list;
});
const sectionCounts = computed(() => {
  const counts = { all: tables.value.length };
  for (const s of SECTIONS) {
    counts[s] = tables.value.filter((t) => (t.section || "main") === s).length;
  }
  return counts;
});

const loadFloorPlans = async () => {
  try {
    const res = await floorPlanAPI.getFloorPlans();
    floorPlans.value = res?.data?.floorPlans ?? [];
  } catch (err) {
    logger.error("Failed to load floor plans", { error: err.message });
  }
};

const showNewPlanDialog = ref(false);
const newPlanName = ref("");

const createFloorPlan = async () => {
  if (!newPlanName.value) return;
  try {
    const res = await floorPlanAPI.createFloorPlan(newPlanName.value.trim());
    const plan = res?.data?.floorPlan;
    if (plan) floorPlans.value = [...floorPlans.value, plan];
    selectedFloorPlan.value = plan.id;
    newPlanName.value = "";
    showNewPlanDialog.value = false;
  } catch (err) {
    logger.error("Failed to create floor plan", { error: err.message });
  }
};

const removeFloorPlan = async (id) => {
  try {
    await floorPlanAPI.deleteFloorPlan(id);
    floorPlans.value = floorPlans.value.filter((f) => f.id !== id);
    if (String(selectedFloorPlan.value) === String(id))
      selectedFloorPlan.value = "all";
  } catch (err) {
    logger.error("Failed to delete floor plan", { error: err.message });
  }
};

const showServerOverlay = ref(false);
const STAFF_COLORS = [
  "#2563eb",
  "#16a34a",
  "#db2777",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#4f46e5",
];
const staffColorMap = computed(() => {
  const map = {};
  const allStaff = [];
  tables.value.forEach((t) =>
    (t.users || []).forEach((s) => {
      if (!allStaff.find((x) => x.id === s.id)) allStaff.push(s);
    })
  );
  allStaff.forEach((s, i) => {
    map[s.id] = STAFF_COLORS[i % STAFF_COLORS.length];
  });
  return map;
});
const firstStaff = (table) =>
  table.users && table.users.length ? table.users[0] : null;
const serverOverlayStyle = (table) => {
  if (!showServerOverlay.value) return {};
  const staff = firstStaff(table);
  if (!staff) return {};
  return {
    borderColor: staffColorMap.value[staff.id],
    boxShadow: `0 0 0 2px ${staffColorMap.value[staff.id]}55`,
  };
};

const showAnalytics = ref(false);
const monthlyRevenue = ref(null);
const loadAnalytics = async () => {
  try {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    const res = await paymentAPI.getRevenueStats(from, to);
    monthlyRevenue.value =
      res?.data?.totalRevenue ?? res?.data?.revenue ?? null;
  } catch {
    monthlyRevenue.value = null;
  }
};

const floorAnalytics = computed(() => {
  const all = tables.value;
  const total = all.length;
  const occupied = all.filter((t) => !t.isBlocked && t.isOccupied).length;
  const blocked = all.filter((t) => t.isBlocked).length;
  const free = total - occupied - blocked;
  const occupancyRate = total ? Math.round((occupied / total) * 100) : 0;
  const resToday = (reservations.value || []).filter((r) => {
    const d = new Date();
    const today = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      .toISOString()
      .slice(0, 10);
    return r.resDate === today;
  });
  const avgParty =
    resToday.length && resToday.reduce((s, r) => s + (r.people || 0), 0)
      ? Math.round(
          (resToday.reduce((s, r) => s + (r.people || 0), 0) /
            resToday.length) *
            10
        ) / 10
      : 0;
  const turnover = occupied
    ? Math.round((resToday.length / occupied) * 10) / 10
    : 0;
  return {
    total,
    occupied,
    blocked,
    free,
    occupancyRate,
    todayCount: resToday.length,
    avgParty,
    turnover,
  };
});

const toggleAnalytics = async () => {
  showAnalytics.value = !showAnalytics.value;
  if (showAnalytics.value) await loadAnalytics();
};

const printFloorPlan = () => {
  window.print();
};

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

const waitlistReservations = computed(() => {
  return (waitlist.value || []).filter(
    (w) => w.status === "waiting" || w.resStatus === "waiting"
  );
});

const loadData = async () => {
  loading.value = true;
  try {
    const [tRes, rRes, wRes] = await Promise.all([
      tableAPI.getTables(),
      reservationAPI.getReservations(),
      waitlistAPI.getEntries().catch(() => ({ data: { waitlist: [] } })),
    ]);
    tables.value = tRes.data.collection;
    reservations.value = rRes.data.collection;
    waitlist.value = wRes.data.waitlist || wRes.data.collection || [];
    await loadFloorPlans();
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
  if (draggingWaitlist.value) {
    if (!allowDrop(table)) return;
    selectedTable.value = table;
    selectedLinkedTables.value = [];
    assignPopupOpen.value = true;
    return;
  }
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
  if (!allowDrop(table)) return;

  if (draggingWaitlist.value) {
    selectedTable.value = table;
    selectedLinkedTables.value = [];
    assignPopupOpen.value = true;
    return;
  }
  if (!draggingReservation.value) return;

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
  draggingWaitlist.value = null;
  selectedLinkedTables.value = [];
};

const onWaitlistDragStart = (entry, event) => {
  draggingWaitlist.value = entry;
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", String(entry.id));
    event.dataTransfer.effectAllowed = "move";
  }
};

const onWaitlistDragEnd = () => {
  draggingWaitlist.value = null;
  document
    .querySelectorAll(".table-block.drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
};

const confirmWaitlistAssign = async () => {
  if (!draggingWaitlist.value) return;
  try {
    await waitlistAPI.seatEntry(draggingWaitlist.value.id);
    assignPopupOpen.value = false;
    draggingWaitlist.value = null;
    selectedTable.value = null;
    selectedLinkedTables.value = [];
    await loadData();
  } catch (err) {
    logger.error("Assign waitlist error", { error: err.message });
    errorMessage.value = getApiErrorMessage(
      err,
      "Failed to seat waitlist entry"
    );
    errorPopupOpen.value = true;
  }
};

const openAddTable = () => {
  showAddTable.value = true;
  addError.value = "";
  newTableName.value = `T${(tables.value.length || 0) + 1}`;
  newTableCapacity.value = 4;
};

const closeAddTable = () => {
  showAddTable.value = false;
};

const confirmAddTable = async () => {
  addError.value = "";
  if (!newTableName.value.trim()) {
    addError.value = "Table name is required.";
    return;
  }
  try {
    await tableAPI.registerTable({
      name: newTableName.value.trim(),
      capacity: Number(newTableCapacity.value) || 4,
      floorPlanId:
        selectedFloorPlan.value === "all"
          ? null
          : Number(selectedFloorPlan.value),
    });
    showAddTable.value = false;
    await loadData();
  } catch (err) {
    addError.value = getApiErrorMessage(err, "Failed to add table");
  }
};

const removeTable = async (table) => {
  if (table.isOccupied || table.reservationId) {
    errorMessage.value = "Unseat the table before removing it.";
    errorPopupOpen.value = true;
    return;
  }
  try {
    await tableAPI.deleteTable(table.id);
    await loadData();
  } catch (err) {
    errorMessage.value = getApiErrorMessage(err, "Failed to remove table");
    errorPopupOpen.value = true;
  }
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

          <div v-if="waitlistReservations.length" class="waitlist-section">
            <div class="panel-header waitlist-header">
              <h2>Waitlist</h2>
              <span class="badge waitlist-badge">{{
                waitlistReservations.length
              }}</span>
            </div>
            <div class="pending-list">
              <div
                v-for="entry in waitlistReservations"
                :key="entry.id"
                class="pending-card waitlist-card"
                draggable="true"
                @dragstart="onWaitlistDragStart(entry, $event)"
                @dragend="onWaitlistDragEnd"
              >
                <div class="pending-header">
                  <span class="pending-avatar">
                    {{
                      (entry.customerName ||
                        entry.name ||
                        "G")[0]?.toUpperCase()
                    }}
                  </span>
                  <div class="pending-title">
                    <span class="pending-name">{{
                      entry.customerName || entry.name || "Guest"
                    }}</span>
                    <span class="pending-meta">
                      {{ entry.partySize || entry.people }} guests
                    </span>
                  </div>
                </div>
                <div class="drag-hint">Drag onto a free table</div>
              </div>
            </div>
          </div>
        </aside>

        <main class="plan-panel">
          <div class="floorplan-switcher">
            <label class="fp-label">Floor Plan</label>
            <select v-model="selectedFloorPlan" class="fp-select">
              <option value="all">All plans</option>
              <option v-for="fp in floorPlans" :key="fp.id" :value="fp.id">
                {{ fp.name }}
              </option>
            </select>
            <button
              class="btn btn-secondary btn-sm"
              @click="showNewPlanDialog = true"
            >
              + New
            </button>
            <button
              v-if="selectedFloorPlan !== 'all'"
              class="btn btn-secondary btn-sm"
              @click="removeFloorPlan(selectedFloorPlan)"
              title="Delete plan"
            >
              🗑
            </button>
          </div>
          <div class="plan-toolbar">
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
            <button class="btn btn-primary btn-sm" @click="openAddTable">
              + Add Table
            </button>
            <button
              class="btn btn-secondary btn-sm"
              :class="{ active: showServerOverlay }"
              @click="showServerOverlay = !showServerOverlay"
            >
              👤 Server Overlay
            </button>
            <button
              class="btn btn-secondary btn-sm"
              :class="{ active: showAnalytics }"
              @click="toggleAnalytics"
            >
              📊 Analytics
            </button>
            <button class="btn btn-secondary btn-sm" @click="printFloorPlan">
              🖨 Print
            </button>
          </div>
          <div class="section-filters">
            <button
              class="section-chip"
              :class="{ active: sectionFilter === 'all' }"
              @click="sectionFilter = 'all'"
            >
              All <span class="chip-count">{{ sectionCounts.all }}</span>
            </button>
            <button
              v-for="s in SECTIONS"
              :key="s"
              class="section-chip"
              :class="{ active: sectionFilter === s }"
              @click="sectionFilter = s"
            >
              {{ s }} <span class="chip-count">{{ sectionCounts[s] }}</span>
            </button>
          </div>
          <div v-if="showAnalytics" class="analytics-panel">
            <div class="analytics-metric">
              <span class="analytics-value"
                >{{ floorAnalytics.occupancyRate }}%</span
              >
              <span class="analytics-label">Occupancy</span>
            </div>
            <div class="analytics-metric">
              <span class="analytics-value"
                >{{ floorAnalytics.occupied }}/{{ floorAnalytics.total }}</span
              >
              <span class="analytics-label">Occupied</span>
            </div>
            <div class="analytics-metric">
              <span class="analytics-value">{{ floorAnalytics.free }}</span>
              <span class="analytics-label">Free</span>
            </div>
            <div class="analytics-metric">
              <span class="analytics-value">{{ floorAnalytics.blocked }}</span>
              <span class="analytics-label">Blocked</span>
            </div>
            <div class="analytics-metric">
              <span class="analytics-value">{{
                floorAnalytics.todayCount
              }}</span>
              <span class="analytics-label">Reservations today</span>
            </div>
            <div class="analytics-metric">
              <span class="analytics-value">{{ floorAnalytics.turnover }}</span>
              <span class="analytics-label">Turnover / table</span>
            </div>
            <div class="analytics-metric">
              <span class="analytics-value">{{ floorAnalytics.avgParty }}</span>
              <span class="analytics-label">Avg party size</span>
            </div>
            <div class="analytics-metric">
              <span class="analytics-value">{{
                monthlyRevenue != null
                  ? "$" + Math.round(monthlyRevenue).toLocaleString()
                  : "—"
              }}</span>
              <span class="analytics-label">Month revenue</span>
            </div>
          </div>
          <div class="plan-grid">
            <div
              v-for="table in displayTables"
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
              :style="serverOverlayStyle(table)"
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
                <span class="zone-badge">{{ table.section || "main" }}</span>
                <span
                  v-if="showServerOverlay && firstStaff(table)"
                  class="server-overlay-tag"
                  :style="{
                    backgroundColor: staffColorMap[firstStaff(table).id],
                  }"
                >
                  {{ firstStaff(table).username }}
                </span>
                <div class="table-top-right">
                  <span class="capacity">🪑 {{ table.capacity }}</span>
                  <button
                    class="remove-table-btn"
                    title="Remove table"
                    @click.stop="removeTable(table)"
                  >
                    ×
                  </button>
                </div>
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
            <p class="assign-text" v-if="draggingReservation">
              Assign <strong>{{ draggingReservation?.name }}</strong> ({{
                draggingReservation?.people
              }}
              guests) to
              <strong>{{ tableMergeDisplayName() }}</strong
              >?
            </p>
            <p class="assign-text" v-else-if="draggingWaitlist">
              Seat
              <strong>{{
                draggingWaitlist?.customerName || draggingWaitlist?.name
              }}</strong>
              ({{ draggingWaitlist?.partySize || draggingWaitlist?.people }}
              guests) at
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
              <button
                v-if="draggingReservation"
                class="btn btn-primary"
                @click="confirmAssign"
              >
                Assign
              </button>
              <button
                v-else-if="draggingWaitlist"
                class="btn btn-primary"
                @click="confirmWaitlistAssign"
              >
                Seat
              </button>
            </div>
          </div>
        </template>
      </PopupBox>

      <PopupBox
        :is-open="showAddTable"
        header-text="Add Table"
        :is-closable="true"
        @close-modal="closeAddTable"
      >
        <template #popup-content>
          <div class="assign-content">
            <div class="field-group">
              <label class="field-label">Table Name</label>
              <input
                type="text"
                v-model="newTableName"
                class="action-input"
                placeholder="Table name"
              />
            </div>
            <div class="field-group">
              <label class="field-label">Capacity</label>
              <input
                type="number"
                min="1"
                v-model="newTableCapacity"
                class="action-input"
              />
            </div>
            <div class="field-group" v-if="floorPlans.length">
              <label class="field-label">Floor Plan</label>
              <select v-model="selectedFloorPlan" class="action-input">
                <option value="all">Default (all plans)</option>
                <option v-for="fp in floorPlans" :key="fp.id" :value="fp.id">
                  {{ fp.name }}
                </option>
              </select>
            </div>
            <p v-if="addError" class="assign-error">{{ addError }}</p>
            <div class="popup-actions">
              <button class="btn btn-outline" @click="closeAddTable">
                Cancel
              </button>
              <button class="btn btn-primary" @click="confirmAddTable">
                Add
              </button>
            </div>
          </div>
        </template>
      </PopupBox>

      <PopupBox
        :is-open="showNewPlanDialog"
        header-text="New Floor Plan"
        :is-closable="true"
        @close-modal="showNewPlanDialog = false"
      >
        <template #popup-content>
          <div class="assign-content">
            <div class="field-group">
              <label class="field-label">Plan Name</label>
              <input
                type="text"
                v-model="newPlanName"
                class="action-input"
                placeholder="e.g. Main Floor"
              />
            </div>
            <div class="popup-actions">
              <button
                class="btn btn-outline"
                @click="showNewPlanDialog = false"
              >
                Cancel
              </button>
              <button class="btn btn-primary" @click="createFloorPlan">
                Create
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
  color: var(--ink-muted);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--sky-600);
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
  background: var(--surface);
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
  background: var(--surface);
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
  color: var(--ink);
  margin: 0;
}

.badge {
  font-family: "Inter-Medium";
  font-size: 12px;
  background: var(--sky-600);
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
  border-color: var(--sky-600);
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
  color: var(--sky-600);
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
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pending-meta {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--ink-muted);
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
  color: var(--ink-muted);
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: 24px 0;
  color: var(--ink-muted);
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
  background: var(--surface);
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
  color: var(--ink);
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
  color: var(--ink);
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
  color: var(--ink-muted);
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
  color: var(--ink-muted);
}

.table-empty {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed #f0f0f0;
  text-align: center;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--ink-muted);
}

.selectable:hover {
  border-color: var(--sky-600);
  background: #f8faff;
}

.table-block.selected {
  border-color: var(--sky-600);
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

.plan-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.floorplan-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.fp-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
}
.fp-select {
  padding: 6px 10px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #fff;
}

.section-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.section-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid #d0d7de;
  border-radius: 999px;
  background: #fff;
  font-size: 0.8rem;
  text-transform: capitalize;
  cursor: pointer;
  color: #334155;
}
.section-chip.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.chip-count {
  font-size: 0.72rem;
  opacity: 0.8;
}
.zone-badge {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 4px;
  padding: 1px 5px;
}
.server-overlay-tag {
  font-size: 0.62rem;
  color: #fff;
  border-radius: 4px;
  padding: 1px 6px;
  font-weight: 600;
}
.analytics-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.analytics-metric {
  display: flex;
  flex-direction: column;
  min-width: 80px;
}
.analytics-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}
.analytics-label {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.table-top-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-table-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--rose-600);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast);
}

.remove-table-btn:hover {
  background: var(--rose-50);
  border-color: var(--rose-200);
}

.waitlist-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
}

.waitlist-header {
  margin-bottom: 10px;
}

.waitlist-badge {
  background: var(--accent);
}

.waitlist-card {
  border-left: 3px solid var(--accent);
}

.assign-error {
  color: var(--rose-600);
  font-family: "Inter-Medium";
  font-size: 13px;
  margin: 8px 0;
}

.field-group {
  margin-bottom: 12px;
}

.field-label {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--ink);
  font-family: "Inter-Medium";
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
  color: var(--ink-muted);
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
  border-top: 1px solid var(--border);
}

.loading {
  text-align: center;
  padding: 60px;
  font-family: "Inter-Light";
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
  background-color: #f3f4f6;
}

.btn-primary {
  background-color: var(--sky-600);
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
  color: var(--ink);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media print {
  .sidebar,
  .plan-toolbar,
  .section-filters,
  .analytics-panel,
  .remove-table-btn {
    display: none !important;
  }
  .floor-plan-layout {
    display: block;
  }
  .plan-panel {
    width: 100%;
  }
  .plan-grid {
    break-inside: avoid;
  }
}
</style>
