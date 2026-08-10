<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import tableAPI from "@/services/tableAPI";
import logger from "@/utils/logger";

interface Table {
  id: number;
  status: string;
  isOccupied?: boolean;
  section?: string;
  capacity?: number;
  seats?: number;
  isBlocked?: boolean;
  reservationId?: number;
  name?: string;
  posX?: number;
  posY?: number;
  Customer?: { name?: string };
  reservation?: { Customer?: { name?: string }; resTime?: string };
}

const router = useRouter();
const tables = ref<Table[]>([]);
const loading = ref(true);
const activeStatus = ref("all");
const activeSection = ref("all");

const sections = computed(() => {
  const s = new Set<string>();
  tables.value.forEach((t) => s.add((t.section || "main").toLowerCase()));
  return Array.from(s).sort();
});

const filteredTables = computed(() => {
  return tables.value.filter((t) => {
    const status = (t.status || (t.isOccupied ? "occupied" : "free")).toLowerCase();
    const section = (t.section || "main").toLowerCase();
    const matchStatus = activeStatus.value === "all" || status === activeStatus.value;
    const matchSection = activeSection.value === "all" || section === activeSection.value;
    return matchStatus && matchSection;
  });
});

const statusCounts = computed(() => {
  const counts: Record<string, number> = { all: tables.value.length };
  tables.value.forEach((t) => {
    const s = (t.status || (t.isOccupied ? "occupied" : "free")).toLowerCase();
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
});

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

const deleteTable = async (table: Table) => {
  if (!confirm(`Delete Table ${table.id}? This cannot be undone.`)) return;
  try {
    await tableAPI.deleteTable(table.id);
    tables.value = tables.value.filter((t) => t.id !== table.id);
  } catch (err) {
    logger.error("Failed to delete table", { error: err });
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
      <div class="filters">
        <div class="filter-group">
          <button
            v-for="status in ['all', 'free', 'occupied', 'blocked']"
            :key="status"
            class="filter-chip"
            :class="[
              activeStatus === status ? 'filter-chip--active' : '',
              status !== 'all' ? `filter-chip--${status}` : ''
            ]"
            @click="activeStatus = status"
          >
            {{ status === 'all' ? 'All' : statusLabel(status) }}
            <span class="filter-count">{{ statusCounts[status] || 0 }}</span>
          </button>
        </div>
        <select
          v-if="sections.length > 1"
          v-model="activeSection"
          class="section-select"
        >
          <option value="all">All Sections</option>
          <option v-for="section in sections" :key="section" :value="section">
            {{ sectionLabel(section) }}
          </option>
        </select>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading tables...</p>
      </div>

      <div v-else-if="!filteredTables.length" class="empty-state">
        <div class="empty-icon">🪑</div>
        <p>No tables found</p>
        <button class="btn-primary" @click="router.push('/table-management/add')">
          + Add Table
        </button>
      </div>

      <div v-else class="table-grid">
        <div v-for="table in filteredTables" :key="table.id" class="table-card">
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
          <div class="table-body">
            <div class="table-meta">
              <span class="meta-item">
                <span class="meta-icon">👥</span>
                {{ table.capacity || table.seats || "—" }} seats
              </span>
              <span class="meta-item">
                <span class="meta-icon">📍</span>
                 {{ sectionLabel(table.section || "main") }}
              </span>
            </div>
            <div v-if="table.isBlocked" class="table-blocked-note">Maintenance</div>
            <div v-else-if="table.reservationId || table.isOccupied" class="table-occupied-note">
              Guest seated
            </div>
            <div v-else class="table-available-note">Available now</div>
          </div>
          <div class="table-actions">
            <button
              class="action-btn"
              @click.stop="router.push(`/table-management/${table.id}`)"
              title="Edit table"
            >
              Edit
            </button>
            <button
              class="action-btn action-btn--danger"
              @click.stop="deleteTable(table)"
              title="Delete table"
            >
              Delete
            </button>
          </div>
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

.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-700);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  background: var(--neutral-50);
  border-color: var(--neutral-300);
}

.filter-chip--active {
  background: var(--brand-700);
  color: var(--white);
  border-color: var(--brand-700);
}

.filter-chip--active.filter-chip--free {
  background: var(--earth-600);
  border-color: var(--earth-600);
}

.filter-chip--active.filter-chip--occupied {
  background: var(--accent-600);
  border-color: var(--accent-600);
}

.filter-chip--active.filter-chip--blocked {
  background: var(--neutral-700);
  border-color: var(--neutral-700);
}

.filter-count {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
}

.filter-chip:not(.filter-chip--active) .filter-count {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.section-select {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-800);
  font-family: var(--font-sans);
  font-size: 13px;
  cursor: pointer;
}

.section-select:focus {
  outline: none;
  border-color: var(--brand-400);
  box-shadow: 0 0 0 3px var(--brand-100);
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
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
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

.table-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--neutral-600);
}

.meta-icon {
  font-size: 14px;
  line-height: 1;
}

.table-blocked-note {
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-600);
  background: var(--neutral-100);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.table-occupied-note {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-600);
  background: var(--accent-100);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.table-available-note {
  font-size: 12px;
  font-weight: 600;
  color: var(--earth-600);
  background: var(--earth-100);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.table-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--neutral-100);
}

.action-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-700);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--neutral-50);
  border-color: var(--neutral-300);
}

.action-btn--danger {
  color: var(--rose-600);
  border-color: var(--rose-200);
}

.action-btn--danger:hover {
  background: var(--rose-50);
  border-color: var(--rose-300);
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
  padding: var(--space-16) var(--space-6);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
  opacity: 0.6;
}

.empty-state p {
  margin: 0 0 var(--space-4);
  font-size: 15px;
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
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}
</style>
