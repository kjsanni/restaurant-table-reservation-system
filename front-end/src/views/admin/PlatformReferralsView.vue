<template>
  <div class="referrals-view">
    <div class="page-header">
      <div>
        <h1>Platform Referrals</h1>
        <p class="subtitle">Referral program tracking and rewards</p>
      </div>
      <button class="btn-primary" @click="openCreate">Add Referral</button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="referrals.length === 0" class="empty-state">
        No referrals
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Referrer</th>
              <th>Referred</th>
              <th>Status</th>
              <th>Reward</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="referral in referrals" :key="referral.id">
              <td>{{ referral.referrer?.name || "—" }}</td>
              <td>{{ referral.referred?.name || "—" }}</td>
              <td>
                <span class="badge" :class="statusClass(referral.status)">
                  {{ referral.status }}
                </span>
              </td>
              <td>{{ formatCurrency(referral.rewardAmount) }}</td>
              <td>
                <button class="btn-sm" @click="editReferral(referral)">
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing?.id ? "Edit" : "New" }} Referral</h2>
        <form @submit.prevent="save">
          <div class="field">
            <label>Referrer Venue ID</label>
            <input
              v-model="form.referrerTenantId"
              type="number"
              class="field-input"
              required
            />
          </div>
          <div class="field">
            <label>Referred Venue ID</label>
            <input
              v-model="form.referredTenantId"
              type="number"
              class="field-input"
              required
            />
          </div>
          <div class="field">
            <label>Status</label>
            <select v-model="form.status" class="field-input">
              <option value="pending">Pending</option>
              <option value="converted">Converted</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div class="field">
            <label>Reward Amount</label>
            <input
              v-model="form.rewardAmount"
              type="number"
              step="0.01"
              class="field-input"
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const referrals = ref([]);
const showModal = ref(false);
const editing = ref(null);
const form = ref({
  referrerTenantId: null,
  referredTenantId: null,
  status: "pending",
  rewardAmount: null,
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listPlatformReferrals();
    referrals.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  form.value = {
    referrerTenantId: null,
    referredTenantId: null,
    status: "pending",
    rewardAmount: null,
  };
  showModal.value = true;
};

const editReferral = (referral) => {
  editing.value = referral;
  form.value = { ...referral };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editing.value = null;
};

const save = async () => {
  if (editing.value?.id) {
    await adminAPI.updatePlatformReferral(editing.value.id, form.value);
  } else {
    await adminAPI.createPlatformReferral(form.value);
  }
  closeModal();
  load();
};

const statusClass = (status) => {
  switch (status) {
    case "paid":
      return "badge-success";
    case "converted":
      return "badge-info";
    default:
      return "badge-warning";
  }
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "GHS",
  }).format(value);
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.referrals-view {
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
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
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
.btn-sm {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--white);
  cursor: pointer;
  font-size: var(--text-xs);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}
.badge-success {
  color: var(--green-600);
}
.badge-info {
  color: var(--accent-600);
}
.badge-warning {
  color: var(--amber-600);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  width: 100%;
  max-width: 480px;
}
.modal h2 {
  margin: 0 0 var(--space-4) 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}
.field label {
  font-size: var(--text-sm);
  font-weight: 600;
}
.field-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
</style>
