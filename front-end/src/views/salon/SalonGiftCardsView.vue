<script setup lang="ts">
import { ref, onMounted } from "vue";
import giftCardAPI from "@/services/giftCardAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const { t } = useI18n();

interface GiftCard {
  id: number;
  code: string;
  amount: number;
  balance: number;
  currency: string;
  status: string;
  expiresAt?: string;
  purchasedBy?: { firstName?: string; lastName?: string; email?: string };
  redeemedBy?: { firstName?: string; lastName?: string; email?: string };
  redeemedAt?: string;
  note?: string;
}

const cards = ref<GiftCard[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  code: "",
  amount: 0,
  balance: 0,
  currency: "GHS",
  status: "active",
  expiresAt: "",
  note: "",
});

const generateCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  form.value.code = `GIFT-${timestamp}-${random}`;
};

const loadCards = async () => {
  loading.value = true;
  try {
    const res = await giftCardAPI.getCards({ limit: 100 });
    cards.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load gift cards", { error: err });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    code: "",
    amount: 0,
    balance: 0,
    currency: "GHS",
    status: "active",
    expiresAt: "",
    note: "",
  };
  editingId.value = null;
};

const submitForm = async () => {
  try {
    const payload = { ...form.value };
    if (!payload.code.trim()) {
      generateCode();
    }
    if (editingId.value) {
      const res = await giftCardAPI.updateCard(editingId.value, payload);
      const idx = cards.value.findIndex((c) => c.id === editingId.value);
      if (idx !== -1) cards.value[idx] = res.data.data;
    } else {
      const res = await giftCardAPI.createCard(payload);
      cards.value.push(res.data.data);
    }
    showForm.value = false;
    resetForm();
  } catch (err) {
    logger.error("Failed to save gift card", { error: err });
  }
};

const editCard = (card: GiftCard) => {
  editingId.value = card.id;
  form.value = {
    code: card.code,
    amount: Number(card.amount),
    balance: Number(card.balance),
    currency: card.currency || "GHS",
    status: card.status,
    expiresAt: card.expiresAt ? card.expiresAt.slice(0, 10) : "",
    note: card.note || "",
  };
  showForm.value = true;
};

const deleteCard = async (id: number) => {
  if (!confirm(t("salon.confirmDelete", "Delete this gift card?"))) return;
  try {
    await giftCardAPI.deleteCard(id);
    cards.value = cards.value.filter((c) => c.id !== id);
  } catch (err) {
    logger.error("Failed to delete gift card", { error: err });
  }
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: "Active",
    redeemed: "Redeemed",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return map[status] || status;
};

const formatCurrency = (value: number, currency = "GHS") => {
  return `${currency} ${Number(value).toFixed(2)}`;
};

onMounted(loadCards);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.marketing", "Gift Cards") }}</h1>
        <p>
          {{
            t("salon.createScheduleSend", "Manage gift card sales and balances")
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
        <p>Loading gift cards...</p>
      </div>

      <div v-else class="stack">
        <div class="settings-card">
          <h3>
            {{
              editingId
                ? t("salon.updateCampaign", "Edit Gift Card")
                : t("salon.createCampaign", "New Gift Card")
            }}
          </h3>
          <div class="grid">
            <label class="full">
              {{ t("salon.name", "Code") }}
              <input
                v-model="form.code"
                class="field-input"
                placeholder="GIFT-..."
              />
            </label>
            <label>
              {{ t("salon.amount", "Amount") }}
              <input
                v-model.number="form.amount"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              {{ t("salon.balance", "Balance") }}
              <input
                v-model.number="form.balance"
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
              {{ t("salon.status", "Status") }}
              <select v-model="form.status" class="field-input">
                <option value="active">Active</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              Expires At
              <input v-model="form.expiresAt" class="field-input" type="date" />
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
                  : t("salon.createCampaign", "Create Gift Card")
              }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.campaignsList", "Gift Cards") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>{{ t("salon.amount", "Amount") }}</th>
                <th>{{ t("salon.balance", "Balance") }}</th>
                <th>{{ t("salon.status", "Status") }}</th>
                <th>Expires</th>
                <th>{{ t("salon.actions", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="card in cards" :key="card.id">
                <td>
                  <strong>{{ card.code }}</strong>
                </td>
                <td>{{ formatCurrency(card.amount, card.currency) }}</td>
                <td>{{ formatCurrency(card.balance, card.currency) }}</td>
                <td>
                  <span :class="['pill', `t-${card.status}`]">
                    {{ statusLabel(card.status) }}
                  </span>
                </td>
                <td>
                  {{
                    card.expiresAt
                      ? new Date(card.expiresAt).toLocaleDateString()
                      : "—"
                  }}
                </td>
                <td class="actions">
                  <button class="btn-secondary-sm" @click="editCard(card)">
                    {{ t("salon.edit", "Edit") }}
                  </button>
                  <button class="btn-danger-sm" @click="deleteCard(card.id)">
                    {{ t("salon.delete", "Delete") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!cards.length">
                <td colspan="6" class="empty-state">
                  {{ t("salon.noCampaigns", "No gift cards yet") }}
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
.t-active {
  background: #ecfdf5;
  color: #047857;
}
.t-redeemed {
  background: #fff7ed;
  color: #c2410c;
}
.t-expired {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.t-cancelled {
  background: #fef2f2;
  color: #b91c1c;
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
