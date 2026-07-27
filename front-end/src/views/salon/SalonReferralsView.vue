<script setup lang="ts">
import { ref, onMounted } from "vue";
import referralAPI from "@/services/referralAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const { t } = useI18n();

interface Referral {
  id: number;
  code: string;
  status: string;
  rewardType: string;
  rewardValue: number;
  rewardApplied: boolean;
  expiresAt?: string;
  completedAt?: string;
  note?: string;
  referrer?: { firstName?: string; lastName?: string; email?: string };
  referee?: { firstName?: string; lastName?: string; email?: string };
  appointment?: { id?: number; start?: string; status?: string };
}

const referrals = ref<Referral[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  code: "",
  referrerCustomerId: "",
  refereeCustomerId: "",
  rewardType: "fixed_amount",
  rewardValue: 0,
  status: "pending",
  expiresAt: "",
  note: "",
});

const loadReferrals = async () => {
  loading.value = true;
  try {
    const res = await referralAPI.getReferrals({ limit: 100 });
    referrals.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load referrals", { error: err });
  } finally {
    loading.value = false;
  }
};

const generateCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  form.value.code = `REF-${timestamp}-${random}`;
};

const resetForm = () => {
  form.value = {
    code: "",
    referrerCustomerId: "",
    refereeCustomerId: "",
    rewardType: "fixed_amount",
    rewardValue: 0,
    status: "pending",
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
      const res = await referralAPI.updateReferral(editingId.value, payload);
      const idx = referrals.value.findIndex((r) => r.id === editingId.value);
      if (idx !== -1) referrals.value[idx] = res.data.data;
    } else {
      const res = await referralAPI.createReferral(payload);
      referrals.value.push(res.data.data);
    }
    showForm.value = false;
    resetForm();
  } catch (err) {
    logger.error("Failed to save referral", { error: err });
  }
};

const editReferral = (referral: Referral) => {
  editingId.value = referral.id;
  form.value = {
    code: referral.code,
    referrerCustomerId: referral.referrer?.id?.toString() || "",
    refereeCustomerId: referral.referee?.id?.toString() || "",
    rewardType: referral.rewardType || "fixed_amount",
    rewardValue: Number(referral.rewardValue),
    status: referral.status,
    expiresAt: referral.expiresAt ? referral.expiresAt.slice(0, 10) : "",
    note: referral.note || "",
  };
  showForm.value = true;
};

const deleteReferral = async (id: number) => {
  if (!confirm(t("salon.confirmDelete", "Delete this referral?"))) return;
  try {
    await referralAPI.deleteReferral(id);
    referrals.value = referrals.value.filter((r) => r.id !== id);
  } catch (err) {
    logger.error("Failed to delete referral", { error: err });
  }
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Expired",
  };
  return map[status] || status;
};

const customerName = (customer?: { firstName?: string; lastName?: string }) => {
  if (!customer) return "—";
  return (
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
  );
};

onMounted(loadReferrals);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.marketing", "Referrals") }}</h1>
        <p>
          {{ t("salon.createScheduleSend", "Track referrals and rewards") }}
        </p>
      </div>
      <div class="topbar-right">
        <LocaleSwitcher />
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading referrals...</p>
      </div>

      <div v-else class="stack">
        <div class="settings-card">
          <h3>
            {{
              editingId
                ? t("salon.updateCampaign", "Edit Referral")
                : t("salon.createCampaign", "New Referral")
            }}
          </h3>
          <div class="grid">
            <label class="full">
              Code
              <input
                v-model="form.code"
                class="field-input"
                placeholder="REF-..."
              />
            </label>
            <label>
              Referrer Customer ID
              <input
                v-model="form.referrerCustomerId"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              Referee Customer ID
              <input
                v-model="form.refereeCustomerId"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              Reward Type
              <select v-model="form.rewardType" class="field-input">
                <option value="fixed_amount">Fixed Amount</option>
                <option value="percentage">Percentage</option>
                <option value="free_service">Free Service</option>
              </select>
            </label>
            <label>
              Reward Value
              <input
                v-model.number="form.rewardValue"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              Status
              <select v-model="form.status" class="field-input">
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
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
                  : t("salon.createCampaign", "Create Referral")
              }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.campaignsList", "Referrals") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Referrer</th>
                <th>Referee</th>
                <th>Reward</th>
                <th>{{ t("salon.status", "Status") }}</th>
                <th>Expires</th>
                <th>{{ t("salon.actions", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="referral in referrals" :key="referral.id">
                <td>
                  <strong>{{ referral.code }}</strong>
                </td>
                <td>{{ customerName(referral.referrer) }}</td>
                <td>{{ customerName(referral.referee) }}</td>
                <td>{{ referral.rewardType }} — {{ referral.rewardValue }}</td>
                <td>
                  <span :class="['pill', `t-${referral.status}`]">
                    {{ statusLabel(referral.status) }}
                  </span>
                </td>
                <td>
                  {{
                    referral.expiresAt
                      ? new Date(referral.expiresAt).toLocaleDateString()
                      : "—"
                  }}
                </td>
                <td class="actions">
                  <button
                    class="btn-secondary-sm"
                    @click="editReferral(referral)"
                  >
                    {{ t("salon.edit", "Edit") }}
                  </button>
                  <button
                    class="btn-danger-sm"
                    @click="deleteReferral(referral.id)"
                  >
                    {{ t("salon.delete", "Delete") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!referrals.length">
                <td colspan="7" class="empty-state">
                  {{ t("salon.noCampaigns", "No referrals yet") }}
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
.t-pending {
  background: #fff7ed;
  color: #c2410c;
}
.t-completed {
  background: #ecfdf5;
  color: #047857;
}
.t-cancelled {
  background: #fef2f2;
  color: #b91c1c;
}
.t-expired {
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
