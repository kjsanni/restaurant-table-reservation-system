<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import tableAPI from "@/services/tableAPI";
import logger from "@/utils/logger";

interface Table {
  id: number;
  status: string;
  isOccupied?: boolean;
}

const router = useRouter();
const tables = ref<Table[]>([]);
const loading = ref(true);

const statusClass = (status: string) => {
  const s = (status || "free").toLowerCase();
  if (s === "occupied") return "occupied";
  if (s === "reserved") return "reserved";
  if (s === "blocked") return "blocked";
  return "free";
};

const statusLabel = (status: string) => {
  const s = (status || "free").toLowerCase();
  if (s === "occupied") return "Occupied";
  if (s === "reserved") return "Reserved";
  if (s === "blocked") return "Blocked";
  return "Free";
};

const sectionLabel = (section: string) => {
  if (!section) return "Main";
  return section.charAt(0).toUpperCase() + section.slice(1);
};

const tableMeta = (table: any) => {
  const seats = table.capacity || table.seats || "—";
  const section = sectionLabel(table.section);
  if (table.isBlocked) return `${seats} seats · ${section} · Maintenance`;
  if (table.reservationId || table.isOccupied) {
    const guest =
      table.Customer?.name || table.reservation?.Customer?.name || "Guest";
    const time = table.reservation?.resTime?.slice(0, 5) || "";
    return `${seats} seats · ${section} · ${guest}${time ? " · " + time : ""}`;
  }
  return `${seats} seats · ${section} · Available now`;
};

const loadTables = async () => {
  loading.value = true;
  try {
    const res = await tableAPI.getTables();
    tables.value = res.data.collection || res.data.tables || [];
  } catch (err) {
    logger.error("Failed to load floor plan", { error: err });
  } finally {
    loading.value = false;
  }
};

onMounted(loadTables);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Floor Plan</h1>
        <p>Visual table layout and seating</p>
      </div>
      <div class="topbar-right">
        <button
          class="btn-primary"
          @click="router.push('/table-management/add')"
        >
          + Add Table
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading floor plan...</p>
      </div>

      <div v-else class="floor">
        <div class="legend">
          <span class="legend-pill"
            ><span
              class="legend-dot"
              style="background: var(--earth-500)"
            ></span>
            Free</span
          >
          <span class="legend-pill"
            ><span
              class="legend-dot"
              style="background: var(--accent-500)"
            ></span>
            Occupied</span
          >
          <span class="legend-pill"
            ><span class="legend-dot" style="background: var(--sky-500)"></span>
            Reserved</span
          >
          <span class="legend-pill"
            ><span
              class="legend-dot"
              style="background: var(--neutral-500)"
            ></span>
            Blocked</span
          >
        </div>

        <div class="plan">
          <div v-for="table in tables" :key="table.id" class="tbl">
            <div class="tbl-head">
              <div class="tbl-name">Table {{ table.id }}</div>
              <span
                :class="[
                  'tbl-status',
                  statusClass(
                    table.status || (table.isOccupied ? 'occupied' : 'free')
                  ),
                ]"
              >
                {{
                  statusLabel(
                    table.status || (table.isOccupied ? "occupied" : "free")
                  )
                }}
              </span>
            </div>
            <div class="tbl-meta">{{ tableMeta(table) }}</div>
          </div>
          <div v-if="!tables.length" class="empty-state">No tables found.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}

.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.floor {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 28px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}

.legend {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.legend-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.plan {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

@media (max-width: 1024px) {
  .plan {
    grid-template-columns: repeat(2, 1fr);
  }
}

.tbl {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 16px;
  background: var(--neutral-50);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tbl:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(26, 20, 16, 0.06);
}

.tbl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tbl-name {
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--neutral-900);
}

.tbl-status {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tbl-status.free {
  background: var(--earth-100);
  color: var(--earth-600);
}
.tbl-status.occupied {
  background: var(--accent-100);
  color: var(--accent-600);
}
.tbl-status.reserved {
  background: var(--sky-100);
  color: var(--sky-600);
}
.tbl-status.blocked {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.tbl-meta {
  font-size: 12px;
  color: var(--neutral-600);
  line-height: 1.5;
}

.tbl-meta b {
  color: var(--neutral-900);
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-6);
  gap: var(--space-4);
}

.spinner {
  width: 36px;
  height: 36px;
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

.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--space-10);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  grid-column: 1 / -1;
}

.btn-primary {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}
</style>
