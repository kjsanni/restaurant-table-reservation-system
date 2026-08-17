<template>
  <div class="revenue-view">
    <div class="page-header">
      <div>
        <h1>Revenue Reports</h1>
        <p class="subtitle">
          Venue revenue trends, revenue by plan, LTV, and cohort analysis
        </p>
      </div>
    </div>

    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'mrr' }]"
        @click="activeTab = 'mrr'"
      >
        Revenue Trends
      </button>
      <button
        :class="['tab', { active: activeTab === 'plan' }]"
        @click="activeTab = 'plan'"
      >
        Revenue by Plan
      </button>
      <button
        :class="['tab', { active: activeTab === 'ltv' }]"
        @click="activeTab = 'ltv'"
      >
        LTV by Venue
      </button>
      <button
        :class="['tab', { active: activeTab === 'cohorts' }]"
        @click="activeTab = 'cohorts'"
      >
        Cohorts
      </button>
      <button
        :class="['tab', { active: activeTab === 'adoption' }]"
        @click="activeTab = 'adoption'"
      >
        Feature Adoption
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading revenue data...</p>
    </div>

    <div v-else-if="activeTab === 'mrr'" class="tab-panel">
      <div class="summary-cards">
        <div class="card" v-hover-lift>
          <div class="card-label">Current Revenue</div>
          <div class="card-value">{{ formatCurrency(mrrData.currentMrr) }}</div>
        </div>
        <div class="card" v-hover-lift>
          <div class="card-label">New Tenants (Last 12M)</div>
          <div class="card-value success">{{ mrrData.newTenantsTotal }}</div>
        </div>
        <div class="card" v-hover-lift>
          <div class="card-label">Cancelled (Last 12M)</div>
          <div class="card-value danger">{{ mrrData.cancelledTotal }}</div>
        </div>
        <div class="card" v-hover-lift>
          <div class="card-label">Avg Churn Rate</div>
          <div class="card-value warning">{{ mrrData.avgChurnRate }}%</div>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="revenue-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>MRR</th>
              <th>New Tenants</th>
              <th>Cancelled</th>
              <th>Churn Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in mrrData.rows" :key="row.month">
              <td>{{ row.month }}</td>
              <td>{{ formatCurrency(row.revenue) }}</td>
              <td>{{ row.newVenues }}</td>
              <td>{{ row.cancelled }}</td>
              <td>
                <span
                  :class="{
                    warning: row.churnRate >= 5,
                    danger: row.churnRate >= 10,
                  }"
                >
                  {{ row.churnRate }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'plan'" class="tab-panel">
      <div class="table-wrapper">
        <table class="revenue-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Venue Count</th>
              <th>MRR</th>
              <th>% of Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in revenueByPlanData.rows" :key="row.plan">
              <td>{{ row.plan }}</td>
              <td>{{ row.tenantCount }}</td>
              <td>{{ formatCurrency(row.mrr) }}</td>
              <td>{{ row.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'ltv'" class="tab-panel">
      <div class="table-wrapper">
        <table class="revenue-table">
          <thead>
            <tr>
              <th>Venue</th>
              <th>Plan</th>
              <th>Months Active</th>
              <th>LTV</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ltvData.rows" :key="row.tenantId">
              <td>
                <button @click="viewTenant(row.tenantId)" class="link-btn">
                  {{ row.tenantName }}
                </button>
              </td>
              <td>{{ row.plan }}</td>
              <td>{{ row.monthsActive }}</td>
              <td>{{ formatCurrency(row.ltv) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'cohorts'" class="tab-panel">
      <div class="table-wrapper">
        <table class="revenue-table">
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Signups</th>
              <th>Cohort Revenue</th>
              <th>Avg Revenue / Venue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in cohortData.rows" :key="row.cohort">
              <td>{{ row.cohort }}</td>
              <td>{{ row.signups }}</td>
              <td>{{ formatCurrency(row.cohortRevenue) }}</td>
              <td>{{ formatCurrency(row.avgRevenuePerVenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'adoption'" class="tab-panel">
      <div class="table-wrapper">
        <table class="revenue-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Tenants Using</th>
              <th>Adoption Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in adoptionData.rows" :key="row.name">
              <td>{{ row.name }}</td>
              <td>{{ row.count }}</td>
              <td>
                <div class="adoption-bar">
                  <div
                    class="adoption-fill"
                    :style="{ width: row.adoptionRate + '%' }"
                  ></div>
                  <span class="adoption-text">{{ row.adoptionRate }}%</span>
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import revenueAPI from "@/services/revenueAPI";

const router = useRouter();
const activeTab = ref("mrr");
const loading = ref(true);
const mrrData = ref({
  rows: [],
  currentMrr: 0,
  newTenantsTotal: 0,
  cancelledTotal: 0,
  avgChurnRate: 0,
});
const revenueByPlanData = ref({ rows: [] });
const ltvData = ref({ rows: [] });
const cohortData = ref({ rows: [] });
const adoptionData = ref({ rows: [] });

const loadMrrTrends = async () => {
  loading.value = true;
  try {
    const response = await revenueAPI.getMrrTrends();
    const data = response.data || {};
    mrrData.value = {
      rows: data.rows || [],
      currentMrr:
        (data.currentMrr ?? data.rows?.[data.rows.length - 1]?.mrr) || 0,
      newTenantsTotal: data.newTenantsTotal || 0,
      cancelledTotal: data.cancelledTotal || 0,
      avgChurnRate: data.avgChurnRate || 0,
    };
  } catch {
    mrrData.value = {
      rows: [],
      currentMrr: 0,
      newTenantsTotal: 0,
      cancelledTotal: 0,
      avgChurnRate: 0,
    };
  } finally {
    loading.value = false;
  }
};

const loadRevenueByPlan = async () => {
  try {
    const response = await revenueAPI.getRevenueByPlan();
    revenueByPlanData.value = {
      rows: response.data?.rows || response.data || [],
    };
  } catch {
    revenueByPlanData.value = { rows: [] };
  }
};

const loadLtv = async () => {
  try {
    const response = await revenueAPI.getLtv();
    ltvData.value = { rows: response.data?.rows || response.data || [] };
  } catch {
    ltvData.value = { rows: [] };
  }
};

const loadCohorts = async () => {
  try {
    const response = await revenueAPI.getCohortAnalysis();
    cohortData.value = {
      rows: response.data?.collection || response.data || [],
    };
  } catch {
    cohortData.value = { rows: [] };
  }
};

const loadFeatureAdoption = async () => {
  try {
    const response = await revenueAPI.getFeatureAdoption();
    adoptionData.value = {
      rows: response.data?.collection || response.data || [],
    };
  } catch {
    adoptionData.value = { rows: [] };
  }
};

const viewTenant = (id) => {
  router.push(`/super-admin/tenants/${id}`);
};

const formatCurrency = (val) => {
  if (val == null) return "—";
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

onMounted(() => {
  loadMrrTrends();
  loadRevenueByPlan();
  loadLtv();
  loadCohorts();
  loadFeatureAdoption();
});
</script>

<style scoped>
.revenue-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.tabs {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}
.tab {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: none;
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all var(--duration-150) var(--ease-in-out);
}
.tab:hover {
  color: var(--ink);
  border-bottom-color: var(--border);
}
.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.tab-panel {
  animation: fadeIn var(--duration-200) var(--ease-in-out);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin-bottom: var(--space-2);
  font-weight: 500;
}
.card-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.card-value.success {
  color: var(--earth-600);
}
.card-value.warning {
  color: var(--accent-600);
}
.card-value.danger {
  color: var(--rose-600);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.revenue-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.revenue-table th,
.revenue-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.revenue-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.revenue-table tbody tr:hover {
  background: var(--surface-sunken);
}
.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  text-decoration: underline;
  padding: 0;
}
.link-btn:hover {
  color: var(--accent-600);
}
.warning {
  color: var(--accent-600);
  font-weight: 600;
}
.danger {
  color: var(--rose-600);
  font-weight: 600;
}
.adoption-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background: var(--border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.adoption-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, var(--brand-600), var(--accent));
  border-radius: var(--radius-full);
}
.adoption-text {
  position: relative;
  display: block;
  text-align: center;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ink);
  line-height: 20px;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-muted);
}
</style>
