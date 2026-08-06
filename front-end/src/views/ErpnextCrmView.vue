<template>
  <ErpnextBaseView
    title="ERPNext CRM"
    subtitle="Customers, leads, campaigns, and opportunities"
    :tabs="tabs"
    v-model:activeTab="activeTab"
    :loading="loading"
    :error="error"
    loading-text="Loading CRM data..."
    @retry="loadCurrentTab"
  >
    <template #tab-content="{ activeTab }">
      <div v-if="activeTab === 'customers'" class="tab-panel">
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

      <div v-if="activeTab === 'leads'" class="tab-panel">
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

      <div v-if="activeTab === 'campaigns'" class="tab-panel">
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

      <div v-if="activeTab === 'opportunities'" class="tab-panel">
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
    </template>
  </ErpnextBaseView>
</template>

<script setup>
import { ref, onMounted } from "vue";
import erpnextAPI from "@/services/erpnextAPI";
import ErpnextBaseView from "@/components/erpnext/ErpnextBaseView.vue";
import "@/components/erpnext/erpnext-view-shared.css";

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
