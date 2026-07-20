<template>
  <div class="trial-management">
    <div class="page-header">
      <div>
        <h1>Trial Management</h1>
        <p class="subtitle">
          Extend trials or convert trialing tenants to paid plans
        </p>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Slug</th>
            <th>Plan</th>
            <th>Trial Ends</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tenant in trialingTenants" :key="tenant.id">
            <td>{{ tenant.name }}</td>
            <td>
              <code class="code">{{ tenant.slug }}</code>
            </td>
            <td>{{ tenant.plan }}</td>
            <td>{{ formatDate(tenant.trialEndsAt) }}</td>
            <td class="actions">
              <button @click="openExtendModal(tenant)" class="btn-small">
                Extend
              </button>
              <button
                @click="openConvertModal(tenant)"
                class="btn-small success"
              >
                Convert to Paid
              </button>
            </td>
          </tr>
          <tr v-if="!loading && trialingTenants.length === 0">
            <td colspan="5" class="empty-state">No trialing tenants found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showExtendModal"
      class="modal-overlay"
      @click.self="closeExtendModal"
    >
      <div class="modal">
        <h2>Extend Trial</h2>
        <p class="modal-hint">
          Extend trial for <strong>{{ selectedTenant?.name }}</strong>
        </p>
        <form @submit.prevent="submitExtend">
          <div class="form-group">
            <label>Days to extend *</label>
            <input v-model.number="extendDays" type="number" min="1" required />
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="closeExtendModal"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">Extend Trial</button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showConvertModal"
      class="modal-overlay"
      @click.self="closeConvertModal"
    >
      <div class="modal">
        <h2>Convert to Paid</h2>
        <p class="modal-hint">
          Convert <strong>{{ selectedTenant?.name }}</strong> to a paid
          subscription
        </p>
        <form @submit.prevent="submitConvert">
          <div class="form-group">
            <label>Plan *</label>
            <select v-model="convertForm.planSlug" required>
              <option v-for="plan in plans" :key="plan.slug" :value="plan.slug">
                {{ plan.name }} — {{ plan.currency }}
                {{ formatPrice(plan.price) }} / mo
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Billing Email *</label>
            <input v-model="convertForm.billingEmail" type="email" required />
          </div>
          <div class="form-group">
            <label>Billing Name</label>
            <input v-model="convertForm.billingName" />
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="closeConvertModal"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">Convert to Paid</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import trialAPI from "@/services/trialAPI";
import planAPI from "@/services/planAPI";

const loading = ref(false);
const tenants = ref([]);
const plans = ref([]);
const selectedTenant = ref(null);

const showExtendModal = ref(false);
const extendDays = ref(14);

const showConvertModal = ref(false);
const convertForm = ref({
  planSlug: "",
  billingEmail: "",
  billingName: "",
});

const trialingTenants = computed(() => {
  return tenants.value.filter((t) => t.status === "trialing");
});

const loadTrials = async () => {
  loading.value = true;
  try {
    const response = await tenantAdminAPI.getAll({ status: "trialing" });
    tenants.value = response.data.collection || [];
  } catch (err) {
    alert(err.response?.data?.message || "Failed to load trials");
  } finally {
    loading.value = false;
  }
};

const loadPlans = async () => {
  try {
    const response = await planAPI.listPlans();
    plans.value = response.data.collection || [];
    if (plans.value.length > 0 && !convertForm.value.planSlug) {
      convertForm.value.planSlug = plans.value[0].slug;
    }
  } catch {
    plans.value = [];
  }
};

const openExtendModal = (tenant) => {
  selectedTenant.value = tenant;
  extendDays.value = 14;
  showExtendModal.value = true;
};

const closeExtendModal = () => {
  showExtendModal.value = false;
  selectedTenant.value = null;
};

const submitExtend = async () => {
  if (!selectedTenant.value) return;
  try {
    await trialAPI.extendTrial(selectedTenant.value.id, extendDays.value);
    await loadTrials();
    closeExtendModal();
    alert("Trial extended successfully");
  } catch (err) {
    alert(err.response?.data?.message || "Failed to extend trial");
  }
};

const openConvertModal = (tenant) => {
  selectedTenant.value = tenant;
  convertForm.value = {
    planSlug: plans.value[0]?.slug || "",
    billingEmail: tenant.billingEmail || "",
    billingName: tenant.billingName || "",
  };
  showConvertModal.value = true;
};

const closeConvertModal = () => {
  showConvertModal.value = false;
  selectedTenant.value = null;
};

const submitConvert = async () => {
  if (!selectedTenant.value) return;
  try {
    await trialAPI.convertTrial(selectedTenant.value.id, convertForm.value);
    await loadTrials();
    closeConvertModal();
    alert("Tenant converted to paid successfully");
  } catch (err) {
    alert(err.response?.data?.message || "Failed to convert trial");
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const formatPrice = (val) => {
  if (val == null) return "0.00";
  return Number(val).toFixed(2);
};

onMounted(async () => {
  await loadPlans();
  await loadTrials();
});
</script>

<style scoped>
.trial-management {
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
.table-wrapper {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.data-table tbody tr:hover {
  background: var(--surface-sunken);
}
.code {
  background: var(--neutral-100);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: var(--text-xs);
  font-family: monospace;
}
.empty-state {
  text-align: center;
  color: var(--ink-muted);
  padding: var(--space-8);
}
.actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.btn-small {
  padding: var(--space-1-5) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-small:hover {
  border-color: var(--neutral-300);
  background: var(--surface-sunken);
}
.btn-small.success {
  background: var(--earth-500);
  color: var(--white);
  border-color: var(--earth-500);
}
.btn-small.success:hover {
  background: var(--earth-600);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-primary:hover {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
  box-shadow: var(--shadow-md);
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-secondary:hover {
  border-color: var(--neutral-300);
  background: var(--surface-sunken);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 20, 16, 0.55);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--border);
}
.modal h2 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
}
.modal-hint {
  color: var(--ink-muted);
  margin: 0 0 var(--space-5) 0;
  font-size: var(--text-sm);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--ink);
  font-family: var(--font-sans);
}
.form-group input,
.form-group select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
