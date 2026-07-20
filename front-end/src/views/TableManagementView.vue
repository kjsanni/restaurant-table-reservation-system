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
  if (s === "blocked") return "blocked";
  return "free";
};

const statusLabel = (status: string) => {
  const s = (status || "free").toLowerCase();
  if (s === "occupied") return "Occupied";
  if (s === "blocked") return "Blocked";
  return "Free";
};

const sectionLabel = (section: string) => {
  if (!section) return "Main Floor";
  return section.charAt(0).toUpperCase() + section.slice(1);
};

const tableMeta = (table: any) => {
  const seats = table.capacity || table.seats || "—";
  const section = sectionLabel(table.section);
  if (table.isBlocked) return `${seats} seats · ${section} · Blocked`;
  if (table.reservationId || table.isOccupied)
    return `${seats} seats · ${section} · Guest seated`;
  return `${seats} seats · ${section} · Available now`;
};

const loadTables = async () => {
  loading.value = true;
  try {
    const res = await tableAPI.getTables();
    tables.value = res.data.collection || res.data.tables || [];
  } catch (err) {
    logger.error("Failed to load tables", { error: err });
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
        <h1>Tables</h1>
        <p>Manage table inventory and status</p>
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
        <p>Loading tables...</p>
      </div>

      <div v-else class="table-grid">
        <div v-for="table in tables" :key="table.id" class="table-card">
          <div class="table-head">
            <div class="table-name">Table {{ table.id }}</div>
            <span
              :class="[
                'table-badge',
                statusClass(
                  table.status || table.isOccupied ? 'occupied' : 'free'
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
          <div class="table-meta">
            {{ tableMeta(table) }}
          </div>
        </div>
        <div v-if="!tables.length" class="empty-state">No tables found.</div>
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

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.table-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 22px;
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.table-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px rgba(26, 20, 16, 0.08);
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-name {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--neutral-900);
}

.table-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.table-badge.free {
  background: var(--earth-100);
  color: var(--earth-600);
}
.table-badge.occupied {
  background: var(--accent-100);
  color: var(--accent-600);
}
.table-badge.blocked {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.table-meta {
  font-size: 13px;
  color: var(--neutral-600);
  line-height: 1.5;
}

.table-meta b {
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
