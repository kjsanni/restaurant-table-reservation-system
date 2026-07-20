<template>
  <div class="invoice-management">
    <div class="page-header">
      <div>
        <h1>Invoice Management</h1>
        <p class="subtitle">View, create, and manage invoices across tenants</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">
        + New Invoice
      </button>
    </div>

    <div class="filters">
      <select
        v-model="selectedTenantId"
        class="filter-select"
        @change="loadInvoices"
      >
        <option value="0">All Tenants</option>
        <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
          {{ tenant.name }}
        </option>
      </select>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Tenant</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Paid Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id">
            <td>
              <code class="code">{{ invoice.invoiceNumber }}</code>
            </td>
            <td>{{ getTenantName(invoice.tenantId) }}</td>
            <td>{{ formatAmount(invoice.amount) }}</td>
            <td>{{ invoice.currency }}</td>
            <td>
              <span :class="['status-badge', statusClass(invoice.status)]">
                {{ invoice.status }}
              </span>
            </td>
            <td>{{ formatDate(invoice.dueDate) }}</td>
            <td>{{ formatDate(invoice.paidAt) }}</td>
            <td class="actions">
              <button @click="viewInvoice(invoice)" class="btn-small">
                View
              </button>
              <button @click="editInvoice(invoice)" class="btn-small">
                Edit
              </button>
              <button @click="deleteInvoice(invoice)" class="btn-small danger">
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="!loading && invoices.length === 0">
            <td colspan="8" class="empty-state">No invoices found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingInvoice ? "Edit Invoice" : "New Invoice" }}</h2>
        <form @submit.prevent="submitInvoice">
          <div class="form-group">
            <label>Tenant *</label>
            <select
              v-model="form.tenantId"
              required
              :disabled="!!editingInvoice"
            >
              <option value="">Select tenant</option>
              <option
                v-for="tenant in tenants"
                :key="tenant.id"
                :value="tenant.id"
              >
                {{ tenant.name }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Amount *</label>
              <input
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div class="form-group">
              <label>Currency *</label>
              <select v-model="form.currency" required>
                <option value="GHS">GHS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input v-model="form.dueDate" type="date" />
          </div>
          <div class="form-group">
            <label>Line Items (JSON)</label>
            <textarea
              v-model="form.lineItemsJson"
              rows="4"
              placeholder='[{"description": "Service", "amount": 100}]'
            ></textarea>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea
              v-model="form.notes"
              rows="3"
              placeholder="Optional notes"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ editingInvoice ? "Save Changes" : "Create Invoice" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import invoiceAPI from "@/services/invoiceAPI";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const loading = ref(false);
const tenants = ref([]);
const invoices = ref([]);
const selectedTenantId = ref("0");
const showModal = ref(false);
const editingInvoice = ref(null);

const form = ref({
  tenantId: "",
  amount: 0,
  currency: "GHS",
  dueDate: "",
  lineItemsJson: "",
  notes: "",
});

const loadTenants = async () => {
  try {
    const response = await tenantAdminAPI.getAll();
    tenants.value = response.data.collection || [];
  } catch {
    tenants.value = [];
  }
};

const loadInvoices = async () => {
  loading.value = true;
  try {
    const tenantId =
      selectedTenantId.value === "0" ? 0 : Number(selectedTenantId.value);
    const params = selectedTenantId.value === "0" ? {} : { tenantId };
    const response = await invoiceAPI.listInvoices(tenantId, params);
    invoices.value = response.data.collection || response.data.items || [];
  } catch (err) {
    alert(err.response?.data?.message || "Failed to load invoices");
  } finally {
    loading.value = false;
  }
};

const getTenantName = (tenantId) => {
  const tenant = tenants.value.find((t) => t.id === tenantId);
  return tenant?.name || `Tenant #${tenantId}`;
};

const statusClass = (status) => {
  const map = {
    paid: "paid",
    pending: "pending",
    overdue: "overdue",
    draft: "draft",
    void: "void",
    cancelled: "cancelled",
  };
  return map[status] || "pending";
};

const openCreateModal = () => {
  editingInvoice.value = null;
  form.value = {
    tenantId: "",
    amount: 0,
    currency: "GHS",
    dueDate: "",
    lineItemsJson: "",
    notes: "",
  };
  showModal.value = true;
};

const editInvoice = (invoice) => {
  editingInvoice.value = invoice;
  form.value = {
    tenantId: invoice.tenantId,
    amount: invoice.amount,
    currency: invoice.currency || "GHS",
    dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : "",
    lineItemsJson: invoice.lineItems
      ? JSON.stringify(invoice.lineItems, null, 2)
      : "",
    notes: invoice.notes || "",
  };
  showModal.value = true;
};

const viewInvoice = (invoice) => {
  alert(
    `Invoice ${invoice.invoiceNumber}\nTenant: ${getTenantName(
      invoice.tenantId
    )}\nAmount: ${invoice.currency} ${formatAmount(invoice.amount)}\nStatus: ${
      invoice.status
    }\nDue: ${formatDate(invoice.dueDate)}\nPaid: ${formatDate(
      invoice.paidAt
    )}\nNotes: ${invoice.notes || "—"}`
  );
};

const closeModal = () => {
  showModal.value = false;
  editingInvoice.value = null;
};

const submitInvoice = async () => {
  try {
    let lineItems = [];
    if (form.value.lineItemsJson.trim()) {
      try {
        lineItems = JSON.parse(form.value.lineItemsJson);
      } catch {
        alert("Invalid JSON for line items");
        return;
      }
    }

    const payload = {
      tenantId: form.value.tenantId,
      amount: form.value.amount,
      currency: form.value.currency,
      dueDate: form.value.dueDate || undefined,
      lineItems,
      notes: form.value.notes || undefined,
    };

    if (editingInvoice.value) {
      const updates = {
        status: editingInvoice.value.status,
        dueDate: payload.dueDate,
        lineItems: payload.lineItems,
        notes: payload.notes,
      };
      await invoiceAPI.updateInvoice(
        editingInvoice.value.tenantId,
        editingInvoice.value.id,
        updates
      );
    } else {
      await invoiceAPI.createInvoice(payload.tenantId, payload);
    }

    await loadInvoices();
    closeModal();
  } catch (err) {
    alert(err.response?.data?.message || "Failed to save invoice");
  }
};

const deleteInvoice = async (invoice) => {
  if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
  try {
    await invoiceAPI.deleteInvoice(invoice.tenantId, invoice.id);
    await loadInvoices();
  } catch (err) {
    alert(err.response?.data?.message || "Failed to delete invoice");
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const formatAmount = (val) => {
  if (val == null) return "—";
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

onMounted(async () => {
  await loadTenants();
  await loadInvoices();
});
</script>

<style scoped>
.invoice-management {
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
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  min-width: 220px;
}
.filter-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
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
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.paid {
  background: var(--earth-100);
  color: var(--earth-600);
}
.status-badge.pending {
  background: var(--sky-100);
  color: var(--sky-600);
}
.status-badge.overdue {
  background: var(--rose-100);
  color: var(--rose-600);
}
.status-badge.draft {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.status-badge.void,
.status-badge.cancelled {
  background: var(--neutral-100);
  color: var(--neutral-600);
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.form-group textarea {
  resize: vertical;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
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
