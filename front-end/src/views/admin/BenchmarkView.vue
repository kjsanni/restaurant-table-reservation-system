<script setup lang="ts">
import { ref, onMounted } from "vue";
import benchmarkAPI from "@/services/benchmarkAPI";
import logger from "@/utils/logger";

interface BenchmarkSummary {
  tenantCount: number;
  avgNoShowRate: number;
  avgFulfilmentRate: number;
  avgCancellationRate: number;
  avgPartySize: number;
  avgReservationsPerTenant: number;
}

interface BenchmarkData {
  totalTenantsAnalyzed: number;
  totalTenantsExcluded: number;
  anonymityThreshold: number;
  overall: BenchmarkSummary | null;
  byPlan: Record<string, BenchmarkSummary>;
  byRestaurantType: Record<string, BenchmarkSummary>;
}

const data = ref<BenchmarkData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const planFilter = ref("");

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await benchmarkAPI.getPlatformBenchmarks(
      planFilter.value || undefined
    );
    data.value = res.data;
  } catch (err) {
    logger.error("benchmarks-load", { error: err });
    error.value = "Failed to load benchmarks.";
  } finally {
    loading.value = false;
  }
}

function fmtPct(v: number | undefined) {
  if (v === undefined || v === null) return "—";
  return `${v}%`;
}

function fmtNum(v: number | undefined) {
  if (v === undefined || v === null) return "—";
  return v.toLocaleString();
}

onMounted(load);
</script>

<template>
  <div class="main-wrapper">
    <div class="content-wrapper">
      <header class="topbar">
        <h1 class="page-title">Benchmarks</h1>
        <p class="page-desc">Cross-tenant anonymized operational benchmarks</p>
      </header>

      <div class="filters">
        <label>
          Plan filter
          <select v-model="planFilter" @change="load">
            <option value="">All plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <p>Loading benchmarks…</p>
      </div>

      <template v-else-if="data">
        <section class="summary-cards" v-if="data.overall">
          <div class="card">
            <p class="card-label">Tenants Analyzed</p>
            <p class="card-value">{{ data.totalTenantsAnalyzed }}</p>
            <p class="card-meta">
              {{ data.totalTenantsExcluded }} excluded (anonymity threshold)
            </p>
          </div>
          <div class="card">
            <p class="card-label">Avg No-Show Rate</p>
            <p class="card-value">{{ fmtPct(data.overall.avgNoShowRate) }}</p>
          </div>
          <div class="card">
            <p class="card-label">Avg Fulfilment Rate</p>
            <p class="card-value">
              {{ fmtPct(data.overall.avgFulfilmentRate) }}
            </p>
          </div>
          <div class="card">
            <p class="card-label">Avg Cancellation Rate</p>
            <p class="card-value">
              {{ fmtPct(data.overall.avgCancellationRate) }}
            </p>
          </div>
          <div class="card">
            <p class="card-label">Avg Party Size</p>
            <p class="card-value">{{ data.overall.avgPartySize }}</p>
          </div>
          <div class="card">
            <p class="card-label">Avg Reservations / Tenant</p>
            <p class="card-value">
              {{ fmtNum(data.overall.avgReservationsPerTenant) }}
            </p>
          </div>
        </section>

        <section v-if="Object.keys(data.byPlan).length" class="section">
          <h2 class="section-title">By Plan</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Tenants</th>
                  <th>No-Show</th>
                  <th>Fulfilment</th>
                  <th>Cancellation</th>
                  <th>Avg Party Size</th>
                  <th>Avg Reservations</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, key) in data.byPlan" :key="key">
                  <td>{{ key }}</td>
                  <td>{{ row?.tenantCount ?? "—" }}</td>
                  <td>{{ fmtPct(row?.avgNoShowRate) }}</td>
                  <td>{{ fmtPct(row?.avgFulfilmentRate) }}</td>
                  <td>{{ fmtPct(row?.avgCancellationRate) }}</td>
                  <td>{{ row?.avgPartySize ?? "—" }}</td>
                  <td>{{ fmtNum(row?.avgReservationsPerTenant) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          v-if="Object.keys(data.byRestaurantType).length"
          class="section"
        >
          <h2 class="section-title">By Restaurant Type</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Tenants</th>
                  <th>No-Show</th>
                  <th>Fulfilment</th>
                  <th>Cancellation</th>
                  <th>Avg Party Size</th>
                  <th>Avg Reservations</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, key) in data.byRestaurantType" :key="key">
                  <td>{{ key }}</td>
                  <td>{{ row?.tenantCount ?? "—" }}</td>
                  <td>{{ fmtPct(row?.avgNoShowRate) }}</td>
                  <td>{{ fmtPct(row?.avgFulfilmentRate) }}</td>
                  <td>{{ fmtPct(row?.avgCancellationRate) }}</td>
                  <td>{{ row?.avgPartySize ?? "—" }}</td>
                  <td>{{ fmtNum(row?.avgReservationsPerTenant) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <div v-else class="empty-state">
        <p>No benchmark data available yet.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: var(--text-2xl, 1.5rem);
  font-weight: 600;
  margin: 0;
}
.page-desc {
  color: var(--text-muted, #6b7280);
  margin: var(--space-1, 0.25rem) 0 0;
}
.topbar {
  margin-bottom: var(--space-6, 1.5rem);
}
.filters {
  display: flex;
  gap: var(--space-4, 1rem);
  margin-bottom: var(--space-4, 1rem);
}
.filters label {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 0.25rem);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
}
.filters select {
  padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 0.5rem);
  background: var(--surface, #ffffff);
  color: var(--text-primary, #111827);
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-4, 1rem);
  margin-bottom: var(--space-6, 1.5rem);
}
.card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 0.75rem);
  padding: var(--space-4, 1rem);
}
.card-label {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-muted, #6b7280);
  margin: 0;
}
.card-value {
  font-size: var(--text-2xl, 1.5rem);
  font-weight: 700;
  margin: var(--space-1, 0.25rem) 0 0;
}
.card-meta {
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-muted, #6b7280);
  margin: var(--space-1, 0.25rem) 0 0;
}
.section {
  margin-bottom: var(--space-6, 1.5rem);
}
.section-title {
  font-size: var(--text-lg, 1.125rem);
  font-weight: 600;
  margin: 0 0 var(--space-3, 0.75rem);
}
.table-wrap {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 0.75rem);
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
}
.data-table th {
  background: var(--background-warm, #f9fafb);
  font-weight: 600;
  font-size: var(--text-sm, 0.875rem);
}
.loading-state {
  text-align: center;
  padding: var(--space-8, 2rem);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle, #e5e7eb);
  border-top-color: var(--brand-600, #8b5e3c);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-3, 0.75rem);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-8, 2rem);
  color: var(--text-muted, #6b7280);
}
.alert {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-radius: var(--radius-md, 0.5rem);
  margin-bottom: var(--space-4, 1rem);
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
</style>
