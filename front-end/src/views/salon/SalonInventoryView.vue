<script setup lang="ts">
import { ref, onMounted } from "vue";
import inventoryItemAPI from "@/services/inventoryItemAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";
import { useToastStore } from "@/stores/toast";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const { t } = useI18n();
const toastStore = useToastStore();

interface InventoryItem {
  id: number;
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  unit?: string;
  costPrice?: string | number;
  sellingPrice?: string | number;
  currency?: string;
  reorderLevel?: number;
  expiryDate?: string;
  isActive: boolean;
  note?: string;
}

const items = ref<InventoryItem[]>([]);
const alerts = ref<InventoryItem[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  name: "",
  sku: "",
  category: "",
  quantity: 0,
  unit: "pcs",
  costPrice: 0,
  sellingPrice: 0,
  currency: "GHS",
  reorderLevel: 5,
  expiryDate: "",
  isActive: true,
  note: "",
});

const loadItems = async () => {
  loading.value = true;
  try {
    const res = await inventoryItemAPI.getItems({ limit: 100 });
    items.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load inventory items", { error: err });
  } finally {
    loading.value = false;
  }
};

const loadAlerts = async () => {
  try {
    const res = await inventoryItemAPI.getLowStock();
    alerts.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load low stock alerts", { error: err });
  }
};

const resetForm = () => {
  form.value = {
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    unit: "pcs",
    costPrice: 0,
    sellingPrice: 0,
    currency: "GHS",
    reorderLevel: 5,
    expiryDate: "",
    isActive: true,
    note: "",
  };
  editingId.value = null;
};

const submitForm = async () => {
  try {
    const payload = { ...form.value };
    if (editingId.value) {
      const res = await inventoryItemAPI.updateItem(editingId.value, payload);
      const idx = items.value.findIndex((it) => it.id === editingId.value);
      if (idx !== -1) items.value[idx] = res.data.data;
    } else {
      const res = await inventoryItemAPI.createItem(payload);
      items.value.push(res.data.data);
    }
    showForm.value = false;
    resetForm();
  } catch (err) {
    logger.error("Failed to save inventory item", { error: err });
  }
};

const editItem = (item: InventoryItem) => {
  editingId.value = item.id;
  form.value = {
    name: item.name,
    sku: item.sku || "",
    category: item.category || "",
    quantity: Number(item.quantity),
    unit: item.unit || "pcs",
    costPrice: Number(item.costPrice || 0),
    sellingPrice: Number(item.sellingPrice || 0),
    currency: item.currency || "GHS",
    reorderLevel: Number(item.reorderLevel || 5),
    expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : "",
    isActive: item.isActive,
    note: item.note || "",
  };
  showForm.value = true;
};

const deleteItem = async (id: number) => {
  try {
    await inventoryItemAPI.deleteItem(id);
    items.value = items.value.filter((it) => it.id !== id);
    toastStore.add(t("salon.itemDeleted", "Item deleted"), "success");
  } catch (err) {
    logger.error("Failed to delete inventory item", { error: err });
    toastStore.add(t("salon.deleteFailed", "Failed to delete item"), "error");
  }
};

const formatCurrency = (value: number, currency = "GHS") => {
  return `${currency} ${Number(value).toFixed(2)}`;
};

onMounted(() => {
  loadItems();
  loadAlerts();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.marketing", "Inventory") }}</h1>
        <p>
          {{
            t(
              "salon.createScheduleSend",
              "Track stock, pricing, and reorder levels"
            )
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
        <p>Loading inventory...</p>
      </div>

      <div v-else class="stack">
        <div v-if="alerts.length" class="settings-card alert-card">
          <h3>{{ t("salon.lowStockAlerts", "Low Stock Alerts") }}</h3>
          <div class="alert-list">
            <div v-for="item in alerts" :key="item.id" class="alert-item">
              <span class="alert-icon">⚠️</span>
              <div>
                <strong>{{ item.name }}</strong>
                <span
                  >{{ t("salon.quantityLabel", "Qty") }}: {{ item.quantity }} /
                  {{ t("salon.reorderLevel", "Reorder") }}:
                  {{ item.reorderLevel }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <h3>
            {{
              editingId
                ? t("salon.updateCampaign", "Edit Item")
                : t("salon.createCampaign", "New Item")
            }}
          </h3>
          <div class="grid">
            <label class="full">
              {{ t("salon.name", "Name") }}
              <input v-model="form.name" class="field-input" />
            </label>
            <label>
              SKU
              <input v-model="form.sku" class="field-input" />
            </label>
            <label>
              Category
              <input v-model="form.category" class="field-input" />
            </label>
            <label>
              Quantity
              <input
                v-model.number="form.quantity"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              Unit
              <input v-model="form.unit" class="field-input" />
            </label>
            <label>
              Cost Price
              <input
                v-model.number="form.costPrice"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              Selling Price
              <input
                v-model.number="form.sellingPrice"
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
              Reorder Level
              <input
                v-model.number="form.reorderLevel"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              Expiry Date
              <input
                v-model="form.expiryDate"
                class="field-input"
                type="date"
              />
            </label>
            <label>
              Active
              <select v-model="form.isActive" class="field-input">
                <option :value="true">
                  {{ t("salon.activeLabel", "Active") }}
                </option>
                <option :value="false">
                  {{ t("salon.inactiveLabel", "Inactive") }}
                </option>
              </select>
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
                  : t("salon.createCampaign", "Create Item")
              }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.campaignsList", "Inventory Items") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.name", "Name") }}</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Cost</th>
                <th>Sell</th>
                <th>Reorder</th>
                <th>{{ t("salon.status", "Status") }}</th>
                <th>{{ t("salon.actions", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>
                  <strong>{{ item.name }}</strong>
                </td>
                <td>{{ item.sku || "—" }}</td>
                <td>{{ item.category || "—" }}</td>
                <td>
                  <span
                    :class="{
                      'text-danger': alerts.some((a) => a.id === item.id),
                    }"
                  >
                    {{ item.quantity }}
                  </span>
                </td>
                <td>
                  {{
                    formatCurrency(Number(item.costPrice || 0), item.currency)
                  }}
                </td>
                <td>
                  {{
                    formatCurrency(
                      Number(item.sellingPrice || 0),
                      item.currency
                    )
                  }}
                </td>
                <td>{{ item.reorderLevel }}</td>
                <td>
                  <span :class="['pill', item.isActive ? 't-true' : 't-false']">
                    {{
                      item.isActive
                        ? t("salon.activeLabel", "Active")
                        : t("salon.inactiveLabel", "Inactive")
                    }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-secondary-sm" @click="editItem(item)">
                    {{ t("salon.edit", "Edit") }}
                  </button>
                  <button class="btn-danger-sm" @click="deleteItem(item.id)">
                    {{ t("salon.delete", "Delete") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="9" class="empty-state">
                  {{ t("salon.noCampaigns", "No inventory items yet") }}
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
.pill {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}
.t-true {
  background: #ecfdf5;
  color: #047857;
}
.t-false {
  background: var(--neutral-100);
  color: var(--neutral-700);
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
.alert-card {
  border-left: 4px solid #f59e0b;
}
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #fffbeb;
  border-radius: var(--radius-md);
}
.alert-icon {
  font-size: 18px;
}
.alert-item div {
  display: flex;
  flex-direction: column;
}
.alert-item strong {
  font-size: 14px;
  color: var(--neutral-900);
}
.alert-item span {
  font-size: 12px;
  color: var(--neutral-600);
}
.text-danger {
  color: #dc2626;
  font-weight: 700;
}
</style>
