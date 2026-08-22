<template>
  <div class="geographic-view">
    <div class="page-header">
      <div>
        <h1>Geographic Distribution</h1>
        <p class="subtitle">Venue count by region or country</p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Total Venues</div>
        <div class="card-value">{{ totalVenues }}</div>
      </div>
      <div class="card">
        <div class="card-label">Regions</div>
        <div class="card-value">{{ distribution.length }}</div>
      </div>
      <div class="card">
        <div class="card-label">Top Region</div>
        <div class="card-value">{{ topRegion?.region || "—" }}</div>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="distribution.length === 0" class="empty-state">
        No geographic data available
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Region / Country</th>
              <th>Venues</th>
              <th>Share</th>
              <th>Distribution</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in distribution" :key="item.region">
              <td>{{ item.region }}</td>
              <td>{{ item.count }}</td>
              <td>{{ percentage(item.count) }}%</td>
              <td>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: percentage(item.count) + '%' }"
                  ></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getGeographicDistribution } from "@/services/revenueAPI";

const loading = ref(false);
const distribution = ref([]);

const totalVenues = computed(() =>
  distribution.value.reduce((sum, item) => sum + item.count, 0)
);

const topRegion = computed(() => distribution.value[0] || null);

const percentage = (count) => {
  if (totalVenues.value === 0) return 0;
  return Math.round((count / totalVenues.value) * 100);
};

const load = async () => {
  loading.value = true;
  try {
    const res = await getGeographicDistribution();
    distribution.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.geographic-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.card-label {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin-bottom: var(--space-1);
}
.card-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  font-size: var(--text-sm);
}
.bar-track {
  width: 100%;
  height: 8px;
  background: var(--border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-600), var(--accent));
  border-radius: var(--radius-full);
}
</style>
