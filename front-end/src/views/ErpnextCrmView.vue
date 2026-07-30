<template>
  <div class="erpnext-view">
    <div class="page-header">
      <h1>ERPNext CRM</h1>
      <p class="subtitle">Customers, leads, campaigns, and opportunities</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading CRM data...</p>
    </div>

    <div v-else class="erpnext-content">
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn-primary" @click="loadCurrentTab">Retry</button>
      </div>

      <div v-else-if="activeTab === 'customers'" class="tab-panel">
        <div class="panel-header">
          <h3>Customers</h3>
          <div class="filters">
            <input
              v-model="custSearch"
              type="search"
              placeholder="Search customers..."
              class="form-input"
            />
            <button class="btn-secondary" @click="loadCustomers">Search</button>
          </div>
        </div>
        <div v-if="customers.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in customers" :key="c.name">
                <td>{{ c.customer_name }}</td>
                <td>{{ c.email_id }}</td>
                <td>{{ c.mobile_no }}</td>
                <td>{{ c.customer_type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No customers found.</div>
      </div>

      <div v-else-if="activeTab === 'leads'" class="tab-panel">
        <div class="panel-header">
          <h3>Leads</h3>
          <div class="filters">
            <input
              v-model="leadSearch"
              type="search"
              placeholder="Search leads..."
              class="form-input"
            />
            <button class="btn-secondary" @click="loadLeads">Search</button>
          </div>
        </div>
        <div v-if="leads.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in leads" :key="l.name">
                <td>{{ l.lead_name }}</td>
                <td>{{ l.email_id }}</td>
                <td>{{ l.lead_source }}</td>
                <td>{{ l.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No leads found.</div>
      </div>

      <div v-else-if="activeTab === 'campaigns'" class="tab-panel">
        <div class="panel-header">
          <h3>Campaigns</h3>
          <div class="filters">
            <input
              v-model="campaignSearch"
              type="search"
              placeholder="Search campaigns..."
              class="form-input"
            />
            <button class="btn-secondary" @click="loadCampaigns">Search</button>
          </div>
        </div>
        <div v-if="campaigns.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in campaigns" :key="c.name">
                <td>{{ c.campaign_name }}</td>
                <td>{{ c.status }}</td>
                <td>{{ c.start_date }}</td>
                <td>{{ c.end_date }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No campaigns found.</div>
      </div>

      <div v-else-if="activeTab === 'opportunities'" class="tab-panel">
        <div class="panel-header">
          <h3>Opportunities</h3>
        </div>
        <div v-if="opportunities.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Source</th>
                <th>Status</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in opportunities" :key="o.name">
                <td>{{ o.party_name || o.customer_name }}</td>
                <td>{{ o.source }}</td>
                <td>{{ o.status }}</td>
                <td>{{ o.opportunity_amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No opportunities found.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import erpnextAPI from "@/services/erpnextAPI";

const loading = ref(true);
const error = ref(null);
const activeTab = ref("customers");

const custSearch = ref("");
const customers = ref([]);

const leadSearch = ref("");
const leads = ref([]);

const campaignSearch = ref("");
const campaigns = ref([]);

const opportunities = ref([]);

const tabs = [
  { key: "customers", label: "Customers" },
  { key: "leads", label: "Leads" },
  { key: "campaigns", label: "Campaigns" },
  { key: "opportunities", label: "Opportunities" },
];

const loadCustomers = async () => {
  try {
    const params = {};
    if (custSearch.value) params.search = custSearch.value;
    const res = await erpnextAPI.getCrmCustomers(params);
    customers.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load customers";
  }
};

const loadLeads = async () => {
  try {
    const params = {};
    if (leadSearch.value) params.search = leadSearch.value;
    const res = await erpnextAPI.getCrmLeads(params);
    leads.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load leads";
  }
};

const loadCampaigns = async () => {
  try {
    const params = {};
    if (campaignSearch.value) params.search = campaignSearch.value;
    const res = await erpnextAPI.getCrmCampaigns(params);
    campaigns.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load campaigns";
  }
};

const loadOpportunities = async () => {
  try {
    const res = await erpnextAPI.getCrmOpportunities();
    opportunities.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load opportunities";
  }
};

const loadCurrentTab = async () => {
  error.value = null;
  if (activeTab.value === "customers") await loadCustomers();
  else if (activeTab.value === "leads") await loadLeads();
  else if (activeTab.value === "campaigns") await loadCampaigns();
  else if (activeTab.value === "opportunities") await loadOpportunities();
};

onMounted(async () => {
  loading.value = true;
  error.value = null;
  await Promise.all([
    loadCustomers(),
    loadLeads(),
    loadCampaigns(),
    loadOpportunities(),
  ]);
  loading.value = false;
});
</script>

<style scoped>
.erpnext-view {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0 0 var(--space-1);
}
.subtitle {
  color: var(--color-text-muted);
  margin: 0;
}
.loading-state {
  text-align: center;
  padding: var(--space-8);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-4);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.tab-nav {
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-4);
}
.tab-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.panel-header h3 {
  margin: 0;
}
.filters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.data-table th,
.data-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--color-surface-alt);
}
.data-table tbody tr:hover {
  background: var(--color-surface-sunken);
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.error-state {
  padding: var(--space-4);
  background: #fef2f2;
  color: #991b1b;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.btn-secondary {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--font-size-sm);
}
</style>
