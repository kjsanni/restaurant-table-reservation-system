<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import customReportAPI from "@/services/customReportAPI";
import logger from "@/utils/logger";

interface FieldOption {
  key: string;
  label: string;
  type: string;
}

interface FilterOption {
  key: string;
  label: string;
  type: string;
  options?: string[];
}

interface DataSource {
  key: string;
  label: string;
  fields: FieldOption[];
  filters: FilterOption[];
  groupBy: string[];
  aggregates: { key: string; label: string; fn: string; field?: string }[];
}

interface ReportConfig {
  source: string;
  fields: string[];
  filters: Record<string, any>;
  groupBy?: string[];
  aggregate?: { key: string; label: string; fn: string; field?: string };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
}

const sources = ref<DataSource[]>([]);
const loading = ref(true);
const running = ref(false);
const exporting = ref(false);
const reportResult = ref<any>(null);
const error = ref("");

const config = ref<ReportConfig>({
  source: "reservations",
  fields: [],
  filters: {},
  limit: 100,
});

const selectedFields = ref<string[]>([]);
const selectedFilters = ref<Record<string, any>>({});
const selectedGroupBy = ref<string[]>([]);
const selectedAggregate = ref<{
  key: string;
  label: string;
  fn: string;
  field?: string;
} | null>(null);
const sortBy = ref("");
const sortOrder = ref<"asc" | "desc">("asc");
const limit = ref(100);

const currentSource = computed(() =>
  sources.value.find((s) => s.key === config.value.source)
);

const availableFields = computed(() => currentSource.value?.fields || []);
const availableFilters = computed(() => currentSource.value?.filters || []);
const availableGroupBy = computed(() => currentSource.value?.groupBy || []);
const availableAggregates = computed(
  () => currentSource.value?.aggregates || []
);

onMounted(async () => {
  await loadSources();
});

const loadSources = async () => {
  loading.value = true;
  try {
    const res = await customReportAPI.getSources();
    sources.value = (res.data?.sources || []) as DataSource[];
    if (sources.value.length) {
      selectSource(sources.value[0].key);
    }
  } catch (err) {
    error.value = "Failed to load report sources.";
    logger.error("Load report sources failed", { error: err });
  } finally {
    loading.value = false;
  }
};

const selectSource = (key: string) => {
  config.value.source = key;
  const source = sources.value.find((s) => s.key === key);
  if (source) {
    selectedFields.value = source.fields.slice(0, 5).map((f) => f.key);
    selectedFilters.value = {};
    selectedGroupBy.value = [];
    selectedAggregate.value = null;
    sortBy.value = "";
    sortOrder.value = "asc";
  }
  reportResult.value = null;
  error.value = "";
};

const toggleField = (key: string) => {
  const idx = selectedFields.value.indexOf(key);
  if (idx === -1) {
    selectedFields.value.push(key);
  } else {
    selectedFields.value.splice(idx, 1);
  }
  reportResult.value = null;
};

const updateFilter = (key: string, value: any) => {
  if (value === undefined || value === null || value === "") {
    delete selectedFilters.value[key];
  } else {
    selectedFilters.value[key] = value;
  }
  reportResult.value = null;
};

const runReport = async () => {
  running.value = true;
  error.value = "";
  reportResult.value = null;
  try {
    const payload: ReportConfig = {
      source: config.value.source,
      fields: selectedFields.value,
      filters: selectedFilters.value,
      limit: limit.value,
    };
    if (selectedGroupBy.value.length) payload.groupBy = selectedGroupBy.value;
    if (selectedAggregate.value) payload.aggregate = selectedAggregate.value;
    if (sortBy.value) {
      payload.sortBy = sortBy.value;
      payload.sortOrder = sortOrder.value;
    }

    const res = await customReportAPI.runReport(payload);
    reportResult.value = res.data;
  } catch (err) {
    error.value = "Failed to run report.";
    logger.error("Run custom report failed", { error: err });
  } finally {
    running.value = false;
  }
};

const exportCSV = async () => {
  exporting.value = true;
  error.value = "";
  try {
    const payload: ReportConfig = {
      source: config.value.source,
      fields: selectedFields.value,
      filters: selectedFilters.value,
      limit: limit.value,
    };
    if (selectedGroupBy.value.length) payload.groupBy = selectedGroupBy.value;
    if (selectedAggregate.value) payload.aggregate = selectedAggregate.value;
    if (sortBy.value) {
      payload.sortBy = sortBy.value;
      payload.sortOrder = sortOrder.value;
    }

    const res = await customReportAPI.exportCSV(payload);
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    error.value = "Failed to export CSV.";
    logger.error("Export custom report CSV failed", { error: err });
  } finally {
    exporting.value = false;
  }
};

const formatValue = (value: any) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const dt = new Date(value);
    if (!isNaN(dt.getTime())) return dt.toLocaleString();
  }
  return String(value);
};

const columns = computed(() => {
  if (!reportResult.value?.data?.length) return [];
  return Object.keys(reportResult.value.data[0]);
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Custom Report Builder</h1>
        <p>Design and run custom reports across your data</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading report sources…</div>

      <template v-else>
        <div class="builder">
          <div class="panel">
            <h3>Data Source</h3>
            <div class="source-list">
              <button
                v-for="source in sources"
                :key="source.key"
                class="source-btn"
                :class="{ 'source-btn--active': config.source === source.key }"
                @click="selectSource(source.key)"
              >
                {{ source.label }}
              </button>
            </div>

            <h3 class="section-title">Fields</h3>
            <div class="field-list">
              <label
                v-for="field in availableFields"
                :key="field.key"
                class="field-checkbox"
              >
                <input
                  type="checkbox"
                  :checked="selectedFields.includes(field.key)"
                  @change="toggleField(field.key)"
                />
                <span>{{ field.label }}</span>
              </label>
            </div>

            <h3 class="section-title">Filters</h3>
            <div class="filter-list">
              <div
                v-for="filter in availableFilters"
                :key="filter.key"
                class="filter-row"
              >
                <label>{{ filter.label }}</label>
                <input
                  v-if="
                    filter.type === 'date' ||
                    filter.type === 'number' ||
                    filter.type === 'text'
                  "
                  :type="filter.type"
                  :value="selectedFilters[filter.key] || ''"
                  @input="
                    updateFilter(
                      filter.key,
                      ($event.target as HTMLInputElement).value
                    )
                  "
                />
                <select
                  v-else-if="filter.type === 'select'"
                  :value="selectedFilters[filter.key] || ''"
                  @change="
                    updateFilter(
                      filter.key,
                      ($event.target as HTMLSelectElement).value
                    )
                  "
                >
                  <option value="">All</option>
                  <option v-for="opt in filter.options" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>
            </div>

            <h3 class="section-title">Group & Aggregate</h3>
            <div class="group-agg">
              <div class="form-row">
                <label>
                  Group By
                  <select v-model="selectedGroupBy" multiple size="4">
                    <option
                      v-for="field in availableGroupBy"
                      :key="field"
                      :value="field"
                    >
                      {{ field }}
                    </option>
                  </select>
                </label>
                <label>
                  Aggregate
                  <select v-model="selectedAggregate" size="4">
                    <option :value="null">None</option>
                    <option
                      v-for="agg in availableAggregates"
                      :key="agg.key"
                      :value="agg"
                    >
                      {{ agg.label }}
                    </option>
                  </select>
                </label>
              </div>
            </div>

            <h3 class="section-title">Sort & Limit</h3>
            <div class="sort-limit">
              <div class="form-row">
                <label>
                  Sort By
                  <select v-model="sortBy">
                    <option value="">None</option>
                    <option
                      v-for="field in availableFields"
                      :key="field.key"
                      :value="field.key"
                    >
                      {{ field.label }}
                    </option>
                  </select>
                </label>
                <label>
                  Order
                  <select v-model="sortOrder">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </label>
                <label>
                  Limit
                  <input
                    v-model.number="limit"
                    type="number"
                    min="1"
                    max="1000"
                  />
                </label>
              </div>
            </div>

            <div class="actions">
              <button
                class="btn-primary"
                :disabled="running || !selectedFields.length"
                @click="runReport"
              >
                {{ running ? "Running..." : "Run Report" }}
              </button>
              <button
                class="btn-secondary"
                :disabled="exporting || !reportResult"
                @click="exportCSV"
              >
                {{ exporting ? "Exporting..." : "Export CSV" }}
              </button>
            </div>
          </div>

          <div class="results">
            <div v-if="error" class="error" role="alert">{{ error }}</div>

            <div v-if="reportResult" class="result-card">
              <div class="result-header">
                <h3>Results</h3>
                <span class="result-meta">
                  {{ reportResult.total || 0 }} records
                </span>
              </div>

              <div class="table-wrapper">
                <table class="report-table">
                  <thead>
                    <tr>
                      <th v-for="col in columns" :key="col">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in reportResult.data" :key="idx">
                      <td v-for="col in columns" :key="col">
                        {{ formatValue(row[col]) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-else-if="!error" class="state">
              Configure your report and click "Run Report" to see results.
            </div>
          </div>
        </div>
      </template>
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

.state {
  padding: 18px;
  border-radius: var(--radius-xl);
  border: 1px dashed var(--neutral-300);
  color: var(--neutral-600);
  text-align: center;
}

.builder {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .builder {
    grid-template-columns: 320px 1fr;
  }
}

.panel {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  height: fit-content;
}

.panel h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--neutral-900);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.section-title {
  margin-top: var(--space-4);
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.source-btn {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.source-btn:hover {
  border-color: var(--brand-600);
}

.source-btn--active {
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border-color: transparent;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 14px;
  color: var(--neutral-800);
  cursor: pointer;
}

.field-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--brand-600);
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-row label {
  font-size: 12px;
  color: var(--neutral-600);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.filter-row input,
.filter-row select {
  padding: 8px 10px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
}

.filter-row input:focus,
.filter-row select:focus {
  outline: none;
  border-color: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.form-row label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--neutral-600);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.form-row input,
.form-row select {
  padding: 8px 10px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.results {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  min-height: 200px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--neutral-900);
}

.result-meta {
  font-size: 13px;
  color: var(--neutral-600);
}

.error {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: #fef2f2;
  color: #991b1b;
  font-size: 14px;
  margin-bottom: var(--space-4);
}

.table-wrapper {
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.report-table th,
.report-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--neutral-200);
}

.report-table th {
  background: var(--neutral-50);
  font-weight: 700;
  color: var(--neutral-900);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.report-table td {
  color: var(--neutral-800);
  white-space: nowrap;
}

.report-table tbody tr:hover {
  background: var(--neutral-50);
}
</style>
