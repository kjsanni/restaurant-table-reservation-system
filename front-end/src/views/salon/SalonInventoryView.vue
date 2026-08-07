<script setup lang="ts">
import { ref, onMounted } from "vue";
import inventoryItemAPI from "@/services/inventoryItemAPI";
import inventoryTransferAPI from "@/services/inventoryTransferAPI";
import locationAPI from "@/services/locationAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";
import { useToastStore } from "@/stores/toast";
import { useSalonCrudView } from "@/composables/useSalonCrudView";
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
  locationId?: number | null;
  location?: { id: number; name: string };
}

const alerts = ref<InventoryItem[]>([]);
const locations = ref<Array<{ id: number; name: string }>>([]);
const selectedLocationId = ref<number | "">("");

const {
  list: items,
  loading,
  showForm,
  editingId,
  form,
  load: loadItems,
  resetForm,
  submitForm,
  edit: editItem,
} = useSalonCrudView<InventoryItem>({
  api: inventoryItemAPI,
  entityName: "Inventory Item",
  defaultForm: {
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
    locationId: null,
  },
  editMapper: (item) => ({
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
    locationId: item.locationId || null,
  }),
});

const loadAlerts = async () => {
  try {
    const res = await inventoryItemAPI.getLowStock();
    alerts.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load low stock alerts", { error: err });
  }
};

const deleteItem = async (id: number) => {
  try {
    await inventoryItemAPI.delete(id);
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

const loadLocations = async () => {
  try {
    const res = await locationAPI.list();
    locations.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load locations", { error: err });
  }
};

const showTransfer = ref(false);
const transferItem = ref<InventoryItem | null>(null);
const transferForm = ref({ toLocationId: null, quantity: 0, notes: "" });
const submittingTransfer = ref(false);

const openTransfer = (item: InventoryItem) => {
  transferItem.value = item;
  transferForm.value = { toLocationId: null, quantity: 0, notes: "" };
  showTransfer.value = true;
};

const submitTransfer = async () => {
  if (
    !transferItem.value ||
    !transferForm.value.toLocationId ||
    !transferForm.value.quantity
  )
    return;
  submittingTransfer.value = true;
  try {
    await inventoryTransferAPI.create({
      inventoryItemId: transferItem.value.id,
      fromLocationId: transferItem.value.locationId,
      toLocationId: transferForm.value.toLocationId,
      quantity: transferForm.value.quantity,
      notes: transferForm.value.notes,
    });
    showTransfer.value = false;
    transferItem.value = null;
    await loadItems();
    toastStore.add(t("salon.transferCreated", "Transfer created"), "success");
  } catch (err) {
    logger.error("Failed to create transfer", { error: err });
    toastStore.add(
      t("salon.transferFailed", "Failed to create transfer"),
      "error"
    );
  } finally {
    submittingTransfer.value = false;
  }
};

onMounted(() => {
  loadItems();
  loadAlerts();
  loadLocations();
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
        <p>{{ t("salon.loadingInventory") }}</p>
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
              {{ t("salon.sku") }}
              <input v-model="form.sku" class="field-input" />
            </label>
            <label>
              {{ t("salon.category", "Category") }}
              <input v-model="form.category" class="field-input" />
            </label>
            <label>
              {{ t("salon.location", "Location") }}
              <select v-model="form.locationId" class="field-input">
                <option value="">
                  {{ t("salon.selectLocation", "Select location") }}
                </option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                  {{ loc.name }}
                </option>
              </select>
            </label>
            <label>
              {{ t("salon.qty", "Qty") }}
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
              {{ t("salon.cost", "Cost Price") }}
              <input
                v-model.number="form.costPrice"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              {{ t("salon.sell", "Selling Price") }}
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
              {{ t("salon.reorder", "Reorder Level") }}
              <input
                v-model.number="form.reorderLevel"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              {{ t("salon.expiryDate", "Expiry Date") }}
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
              {{ t("salon.notes", "Note") }}
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
          <div class="panel-head" style="margin-bottom: 12px">
            <h3>{{ t("salon.campaignsList", "Inventory Items") }}</h3>
            <select
              v-if="locations.length"
              v-model="selectedLocationId"
              class="field-input"
              style="width: auto"
              @change="loadItems"
            >
              <option value="">
                {{ t("salon.allLocations", "All locations") }}
              </option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </div>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.name", "Name") }}</th>
                <th>{{ t("salon.sku", "SKU") }}</th>
                <th>{{ t("salon.category", "Category") }}</th>
                <th>{{ t("salon.location", "Location") }}</th>
                <th>{{ t("salon.qty", "Qty") }}</th>
                <th>{{ t("salon.cost", "Cost") }}</th>
                <th>{{ t("salon.sell", "Sell") }}</th>
                <th>{{ t("salon.reorder", "Reorder") }}</th>
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
                  {{
                    item.location?.name ||
                    (item.locationId ? `#${item.locationId}` : "—")
                  }}
                </td>
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
                  <button class="btn-primary-sm" @click="openTransfer(item)">
                    {{ t("salon.transfer", "Transfer") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="10" class="empty-state">
                  {{ t("salon.noCampaigns", "No inventory items yet") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showTransfer"
    class="modal-overlay"
    @click.self="showTransfer = false"
  >
    <div class="modal">
      <h2>{{ t("salon.transferItem", "Transfer Item") }}</h2>
      <p class="transfer-item-name">{{ transferItem?.name }}</p>
      <div class="form-group">
        <label>{{ t("salon.fromLocation", "From Location") }}</label>
        <input
          :value="
            transferItem?.location?.name || t('salon.unassigned', 'Unassigned')
          "
          disabled
          class="field-input"
        />
      </div>
      <div class="form-group">
        <label>{{ t("salon.toLocation", "To Location") }}</label>
        <select v-model="transferForm.toLocationId" class="field-input">
          <option value="">
            {{ t("salon.selectLocation", "Select location") }}
          </option>
          <option v-for="loc in locations" :key="loc.id" :value="loc.id">
            {{ loc.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t("salon.quantity", "Quantity") }}</label>
        <input
          v-model.number="transferForm.quantity"
          type="number"
          min="1"
          :max="transferItem?.quantity || 0"
          class="field-input"
        />
      </div>
      <div class="form-group">
        <label>{{ t("salon.notes", "Notes") }}</label>
        <textarea
          v-model="transferForm.notes"
          class="field-input"
          rows="2"
        ></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" @click="showTransfer = false">
          {{ t("salon.cancelBtn", "Cancel") }}
        </button>
        <button
          class="btn-primary"
          @click="submitTransfer"
          :disabled="submittingTransfer"
        >
          {{ t("salon.transfer", "Transfer") }}
        </button>
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
