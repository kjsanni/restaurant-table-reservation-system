<template>
  <div class="plans-page">
    <div class="page-header">
      <div>
        <h1>Subscription Plans</h1>
        <p class="subtitle">
          Define pricing, limits, and features for tenant plans
        </p>
      </div>
      <button @click="openCreateModal" class="btn-primary">+ New Plan</button>
    </div>

    <div class="table-wrapper">
      <table class="plans-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Price</th>
            <th>Max Tables</th>
            <th>Max Reservations / mo</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in plans" :key="plan.id">
            <td>{{ plan.name }}</td>
            <td>
              <code>{{ plan.slug }}</code>
            </td>
            <td>{{ plan.currency }} {{ formatPrice(plan.price) }}</td>
            <td>{{ plan.maxTables === Infinity ? "∞" : plan.maxTables }}</td>
            <td>
              {{
                plan.maxReservationsPerMonth === Infinity
                  ? "∞"
                  : plan.maxReservationsPerMonth
              }}
            </td>
            <td>
              <span
                :class="[
                  'status-badge',
                  plan.isActive ? 'active' : 'cancelled',
                ]"
              >
                {{ plan.isActive ? "Active" : "Inactive" }}
              </span>
            </td>
            <td class="actions">
              <button @click="editPlan(plan)" class="btn-small">Edit</button>
              <button @click="deletePlan(plan)" class="btn-small danger">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingPlan ? "Edit Plan" : "New Plan" }}</h2>
        <form @submit.prevent="submitPlan">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="form.name" required :disabled="!!editingPlan" />
          </div>
          <div class="form-group">
            <label>Slug *</label>
            <input v-model="form.slug" required :disabled="!!editingPlan" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Price (per month) *</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div class="form-group">
              <label>Currency *</label>
              <select v-model="form.currency">
                <option value="GHS">GHS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Max Tables *</label>
              <input
                v-model.number="form.maxTables"
                type="number"
                min="1"
                required
              />
            </div>
            <div class="form-group">
              <label>Max Reservations / mo *</label>
              <input
                v-model.number="form.maxReservationsPerMonth"
                type="number"
                min="1"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="form.isActive">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ editingPlan ? "Save Changes" : "Create Plan" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import planAPI from "@/services/planAPI";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const plans = ref([]);
const showModal = ref(false);
const editingPlan = ref(null);
const form = ref({
  name: "",
  slug: "",
  price: 0,
  currency: "GHS",
  maxTables: 10,
  maxReservationsPerMonth: 500,
  isActive: true,
  sortOrder: 0,
});

const loadPlans = async () => {
  const response = await planAPI.listPlans();
  plans.value = response.data.collection || [];
};

const openCreateModal = () => {
  editingPlan.value = null;
  form.value = {
    name: "",
    slug: "",
    price: 0,
    currency: "GHS",
    maxTables: 10,
    maxReservationsPerMonth: 500,
    isActive: true,
    sortOrder: plans.value.length,
  };
  showModal.value = true;
};

const editPlan = (plan) => {
  editingPlan.value = plan;
  form.value = {
    name: plan.name,
    slug: plan.slug,
    price: plan.price,
    currency: plan.currency,
    maxTables: plan.maxTables,
    maxReservationsPerMonth: plan.maxReservationsPerMonth,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingPlan.value = null;
};

const submitPlan = async () => {
  try {
    if (editingPlan.value) {
      await planAPI.updatePlan(editingPlan.value.id, form.value);
    } else {
      await planAPI.createPlan(form.value);
    }
    await loadPlans();
    closeModal();
  } catch (err) {
    alert(err.response?.data?.message || "Failed to save plan");
  }
};

const deletePlan = async (plan) => {
  if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
  try {
    await planAPI.deletePlan(plan.id);
    await loadPlans();
  } catch (err) {
    alert(err.response?.data?.message || "Failed to delete plan");
  }
};

const formatPrice = (val) => {
  if (val == null) return "Custom";
  return Number(val).toFixed(2);
};

onMounted(() => {
  loadPlans();
});
</script>

<style scoped>
.plans-page {
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
.plans-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.plans-table th,
.plans-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.plans-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.plans-table tbody tr:hover {
  background: var(--surface-sunken);
}
.plans-table code {
  background: var(--neutral-100);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: var(--text-xs);
}
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.active {
  background: var(--earth-100);
  color: var(--earth-600);
}
.status-badge.cancelled {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.actions {
  display: flex;
  gap: var(--space-2);
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
.btn-small.danger {
  background: var(--rose-500);
  color: var(--white);
  border-color: var(--rose-500);
}
.btn-small.danger:hover {
  background: var(--rose-600);
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
  max-width: 520px;
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
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
