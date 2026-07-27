<script setup lang="ts">
import { ref, onMounted } from "vue";
import pricingRuleAPI from "@/services/pricingRuleAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const { t } = useI18n();

interface PricingRule {
  id: number;
  name: string;
  ruleType: string;
  serviceId?: number;
  packageId?: number;
  value: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  weekDays?: string;
  startTime?: string;
  endTime?: string;
  segmentKey?: string;
  segmentValue?: string;
  isActive: boolean;
  priority: number;
  note?: string;
}

const rules = ref<PricingRule[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  name: "",
  ruleType: "fixed_discount",
  serviceId: "",
  packageId: "",
  value: 0,
  currency: "GHS",
  startDate: "",
  endDate: "",
  weekDays: "",
  startTime: "",
  endTime: "",
  segmentKey: "",
  segmentValue: "",
  isActive: true,
  priority: 0,
  note: "",
});

const loadRules = async () => {
  loading.value = true;
  try {
    const res = await pricingRuleAPI.getRules({ limit: 100 });
    rules.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load pricing rules", { error: err });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    name: "",
    ruleType: "fixed_discount",
    serviceId: "",
    packageId: "",
    value: 0,
    currency: "GHS",
    startDate: "",
    endDate: "",
    weekDays: "",
    startTime: "",
    endTime: "",
    segmentKey: "",
    segmentValue: "",
    isActive: true,
    priority: 0,
    note: "",
  };
  editingId.value = null;
};

const submitForm = async () => {
  try {
    const payload: any = { ...form.value };
    if (!payload.serviceId) payload.serviceId = null;
    else payload.serviceId = Number(payload.serviceId);
    if (!payload.packageId) payload.packageId = null;
    else payload.packageId = Number(payload.packageId);

    if (editingId.value) {
      const res = await pricingRuleAPI.updateRule(editingId.value, payload);
      const idx = rules.value.findIndex((r) => r.id === editingId.value);
      if (idx !== -1) rules.value[idx] = res.data.data;
    } else {
      const res = await pricingRuleAPI.createRule(payload);
      rules.value.push(res.data.data);
    }
    showForm.value = false;
    resetForm();
  } catch (err) {
    logger.error("Failed to save pricing rule", { error: err });
  }
};

const editRule = (rule: PricingRule) => {
  editingId.value = rule.id;
  form.value = {
    name: rule.name,
    ruleType: rule.ruleType,
    serviceId: rule.serviceId?.toString() || "",
    packageId: rule.packageId?.toString() || "",
    value: Number(rule.value),
    currency: rule.currency || "GHS",
    startDate: rule.startDate ? rule.startDate.slice(0, 10) : "",
    endDate: rule.endDate ? rule.endDate.slice(0, 10) : "",
    weekDays: rule.weekDays || "",
    startTime: rule.startTime || "",
    endTime: rule.endTime || "",
    segmentKey: rule.segmentKey || "",
    segmentValue: rule.segmentValue || "",
    isActive: rule.isActive,
    priority: Number(rule.priority),
    note: rule.note || "",
  };
  showForm.value = true;
};

const deleteRule = async (id: number) => {
  if (!confirm(t("salon.confirmDelete", "Delete this pricing rule?"))) return;
  try {
    await pricingRuleAPI.deleteRule(id);
    rules.value = rules.value.filter((r) => r.id !== id);
  } catch (err) {
    logger.error("Failed to delete pricing rule", { error: err });
  }
};

const formatCurrency = (value: number, currency = "GHS") => {
  return `${currency} ${Number(value).toFixed(2)}`;
};

const ruleTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    fixed_discount: "Fixed Discount",
    percentage_discount: "Percentage Discount",
    time_based: "Time Based",
    customer_segment: "Customer Segment",
  };
  return map[type] || type;
};

onMounted(loadRules);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.marketing", "Pricing Rules") }}</h1>
        <p>
          {{
            t(
              "salon.createScheduleSend",
              "Manage discounts, time-based pricing, and customer segments"
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
        <p>Loading pricing rules...</p>
      </div>

      <div v-else class="stack">
        <div class="settings-card">
          <h3>
            {{
              editingId
                ? t("salon.updateCampaign", "Edit Rule")
                : t("salon.createCampaign", "New Pricing Rule")
            }}
          </h3>
          <div class="grid">
            <label class="full">
              {{ t("salon.name", "Name") }}
              <input v-model="form.name" class="field-input" />
            </label>
            <label>
              Rule Type
              <select v-model="form.ruleType" class="field-input">
                <option value="fixed_discount">Fixed Discount</option>
                <option value="percentage_discount">Percentage Discount</option>
                <option value="time_based">Time Based</option>
                <option value="customer_segment">Customer Segment</option>
              </select>
            </label>
            <label>
              Service ID
              <input
                v-model.number="form.serviceId"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              Package ID
              <input
                v-model.number="form.packageId"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              Value
              <input
                v-model.number="form.value"
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
              Start Date
              <input v-model="form.startDate" class="field-input" type="date" />
            </label>
            <label>
              End Date
              <input v-model="form.endDate" class="field-input" type="date" />
            </label>
            <label>
              Week Days
              <input
                v-model="form.weekDays"
                class="field-input"
                placeholder="e.g. 1,2,3,4,5"
              />
            </label>
            <label>
              Start Time
              <input v-model="form.startTime" class="field-input" type="time" />
            </label>
            <label>
              End Time
              <input v-model="form.endTime" class="field-input" type="time" />
            </label>
            <label>
              Segment Key
              <input v-model="form.segmentKey" class="field-input" />
            </label>
            <label>
              Segment Value
              <input v-model="form.segmentValue" class="field-input" />
            </label>
            <label>
              Priority
              <input
                v-model.number="form.priority"
                class="field-input"
                type="number"
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
                  : t("salon.createCampaign", "Create Rule")
              }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.campaignsList", "Pricing Rules") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.name", "Name") }}</th>
                <th>Type</th>
                <th>Value</th>
                <th>Start</th>
                <th>End</th>
                <th>{{ t("salon.status", "Status") }}</th>
                <th>{{ t("salon.actions", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in rules" :key="rule.id">
                <td>
                  <strong>{{ rule.name }}</strong>
                </td>
                <td>{{ ruleTypeLabel(rule.ruleType) }}</td>
                <td>{{ formatCurrency(Number(rule.value), rule.currency) }}</td>
                <td>
                  {{
                    rule.startDate
                      ? new Date(rule.startDate).toLocaleDateString()
                      : "—"
                  }}
                </td>
                <td>
                  {{
                    rule.endDate
                      ? new Date(rule.endDate).toLocaleDateString()
                      : "—"
                  }}
                </td>
                <td>
                  <span :class="['pill', rule.isActive ? 't-true' : 't-false']">
                    {{
                      rule.isActive
                        ? t("salon.activeLabel", "Active")
                        : t("salon.inactiveLabel", "Inactive")
                    }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-secondary-sm" @click="editRule(rule)">
                    {{ t("salon.edit", "Edit") }}
                  </button>
                  <button class="btn-danger-sm" @click="deleteRule(rule.id)">
                    {{ t("salon.delete", "Delete") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!rules.length">
                <td colspan="7" class="empty-state">
                  {{ t("salon.noCampaigns", "No pricing rules yet") }}
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
</style>
