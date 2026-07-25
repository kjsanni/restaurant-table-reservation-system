<script setup lang="ts">
import { ref, onMounted } from "vue";
import expenseAPI from "@/services/expenseAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const { t } = useI18n();

interface Expense {
  id: number;
  category: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod?: string;
  reference?: string;
  note?: string;
}

const expenses = ref<Expense[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  category: "",
  amount: 0,
  currency: "GHS",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "",
  reference: "",
  note: "",
});

const loadExpenses = async () => {
  loading.value = true;
  try {
    const res = await expenseAPI.getExpenses({ limit: 100 });
    expenses.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load expenses", { error: err });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    category: "",
    amount: 0,
    currency: "GHS",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "",
    reference: "",
    note: "",
  };
  editingId.value = null;
};

const submitForm = async () => {
  try {
    const payload = { ...form.value };
    if (editingId.value) {
      const res = await expenseAPI.updateExpense(editingId.value, payload);
      const idx = expenses.value.findIndex((ex) => ex.id === editingId.value);
      if (idx !== -1) expenses.value[idx] = res.data.data;
    } else {
      const res = await expenseAPI.createExpense(payload);
      expenses.value.push(res.data.data);
    }
    showForm.value = false;
    resetForm();
  } catch (err) {
    logger.error("Failed to save expense", { error: err });
  }
};

const editExpense = (expense: Expense) => {
  editingId.value = expense.id;
  form.value = {
    category: expense.category,
    amount: Number(expense.amount),
    currency: expense.currency || "GHS",
    date: expense.date
      ? expense.date.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    paymentMethod: expense.paymentMethod || "",
    reference: expense.reference || "",
    note: expense.note || "",
  };
  showForm.value = true;
};

const deleteExpense = async (id: number) => {
  if (!confirm(t("salon.confirmDelete", "Delete this expense?"))) return;
  try {
    await expenseAPI.deleteExpense(id);
    expenses.value = expenses.value.filter((ex) => ex.id !== id);
  } catch (err) {
    logger.error("Failed to delete expense", { error: err });
  }
};

const formatCurrency = (value: number, currency = "GHS") => {
  return `${currency} ${Number(value).toFixed(2)}`;
};

const totalExpenses = () => {
  return expenses.value.reduce((sum, ex) => sum + Number(ex.amount || 0), 0);
};

onMounted(loadExpenses);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.marketing", "Expenses") }}</h1>
        <p>
          {{
            t("salon.createScheduleSend", "Track salon expenses and spending")
          }}
        </p>
      </div>
      <div class="topbar-right">
        <LocaleSwitcher />
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading expenses...</p>
      </div>

      <div v-else class="stack">
        <div class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Total Expenses</span>
            <span class="summary-value">{{
              formatCurrency(totalExpenses(), expenses[0]?.currency || "GHS")
            }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Entries</span>
            <span class="summary-value">{{ expenses.length }}</span>
          </div>
        </div>

        <div class="settings-card">
          <h3>
            {{
              editingId
                ? t("salon.updateCampaign", "Edit Expense")
                : t("salon.createCampaign", "New Expense")
            }}
          </h3>
          <div class="grid">
            <label class="full">
              Category
              <input v-model="form.category" class="field-input" />
            </label>
            <label>
              Amount
              <input
                v-model.number="form.amount"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              {{ t("salon.currency", "Currency") }}
              <select v-model="form.currency" class="field-input">
                <option value="GHS">GHS</option>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label>
              Date
              <input v-model="form.date" class="field-input" type="date" />
            </label>
            <label>
              Payment Method
              <input v-model="form.paymentMethod" class="field-input" />
            </label>
            <label>
              Reference
              <input v-model="form.reference" class="field-input" />
            </label>
            <label class="full">
              Note
              <textarea v-model="form.note" class="field-input" rows="2" />
            </label>
          </div>
          <div class="form-actions">
            <button v-if="editingId" class="btn-secondary" @click="resetForm">
              {{ t("salon.cancelBtn", "Cancel") }}
            </button>
            <button class="btn-primary" @click="submitForm">
              {{
                editingId
                  ? t("salon.save", "Save")
                  : t("salon.createCampaign", "Create Expense")
              }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.campaignsList", "Expenses") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Reference</th>
                <th>{{ t("salon.actions", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenses" :key="expense.id">
                <td>
                  <strong>{{ expense.category }}</strong>
                </td>
                <td>
                  {{ formatCurrency(Number(expense.amount), expense.currency) }}
                </td>
                <td>
                  {{
                    expense.date
                      ? new Date(expense.date).toLocaleDateString()
                      : "—"
                  }}
                </td>
                <td>{{ expense.paymentMethod || "—" }}</td>
                <td>{{ expense.reference || "—" }}</td>
                <td class="actions">
                  <button
                    class="btn-secondary-sm"
                    @click="editExpense(expense)"
                  >
                    {{ t("salon.edit", "Edit") }}
                  </button>
                  <button
                    class="btn-danger-sm"
                    @click="deleteExpense(expense.id)"
                  >
                    {{ t("salon.delete", "Delete") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!expenses.length">
                <td colspan="6" class="empty-state">
                  {{ t("salon.noCampaigns", "No expenses yet") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
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
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.summary-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}
.summary-item {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 16px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.summary-label {
  display: block;
  font-size: 12px;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.summary-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--neutral-900);
  margin-top: 4px;
}
.settings-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.settings-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.grid label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.full {
  grid-column: 1 / -1;
}
.field-input {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  width: 100%;
}
textarea.field-input {
  resize: vertical;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.report-table th,
.report-table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--neutral-200);
}
.report-table th {
  font-size: 12px;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.empty-state {
  text-align: center;
  color: var(--neutral-500);
  padding: 18px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn-primary {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--brand-600);
  color: var(--white);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: none;
  background: #fecaca;
  color: #7f1d1d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>
