<script setup lang="ts">
import { ref, onMounted } from "vue";
import marketingCampaignsAPI from "@/services/marketingCampaignsAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";
import { useToastStore } from "@/stores/toast";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const {
  t,
  locale: _locale,
  setLocale: _setLocale,
  availableLocales: _availableLocales,
} = useI18n();
const toastStore = useToastStore();

const loading = ref(true);
const saving = ref(false);
const sending = ref(false);
const campaigns = ref<any[]>([]);
const editing = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  name: "",
  type: "email",
  subject: "",
  content: "",
  targetAudience: "all",
  status: "draft",
  scheduledAt: "",
});

const loadCampaigns = async () => {
  loading.value = true;
  try {
    const res = await marketingCampaignsAPI.getAll({ limit: 100 });
    campaigns.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load campaigns", { error: err });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    name: "",
    type: "email",
    subject: "",
    content: "",
    targetAudience: "all",
    status: "draft",
    scheduledAt: "",
  };
  editing.value = false;
  editingId.value = null;
};

const createCampaign = async () => {
  saving.value = true;
  try {
    await marketingCampaignsAPI.create({
      ...form.value,
      scheduledAt: form.value.scheduledAt || null,
    });
    resetForm();
    loadCampaigns();
  } catch (err) {
    logger.error("Failed to create campaign", { error: err });
  } finally {
    saving.value = false;
  }
};

const startEdit = (campaign: any) => {
  editing.value = true;
  editingId.value = campaign.id;
  form.value = {
    name: campaign.name || "",
    type: campaign.type || "email",
    subject: campaign.subject || "",
    content: campaign.content || "",
    targetAudience: campaign.targetAudience || "all",
    status: campaign.status || "draft",
    scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : "",
  };
};

const updateCampaign = async () => {
  if (!editingId.value) return;
  saving.value = true;
  try {
    await marketingCampaignsAPI.update(editingId.value, {
      ...form.value,
      scheduledAt: form.value.scheduledAt || null,
    });
    resetForm();
    loadCampaigns();
  } catch (err) {
    logger.error("Failed to update campaign", { error: err });
  } finally {
    saving.value = false;
  }
};

const deleteCampaign = async (id: number) => {
  try {
    await marketingCampaignsAPI.delete(id);
    loadCampaigns();
    toastStore.add(t("salon.campaignDeleted", "Campaign deleted"), "success");
  } catch (err) {
    logger.error("Failed to delete campaign", { error: err });
    toastStore.add(
      t("salon.deleteFailed", "Failed to delete campaign"),
      "error"
    );
  }
};

const sendCampaign = async (campaign: any) => {
  sending.value = true;
  try {
    const res = await marketingCampaignsAPI.send(campaign.id);
    toastStore.add(
      t("salon.campaignSent", `Sent to {sent} of {total} recipients`)
        .replace("{sent}", res.data.sentCount)
        .replace("{total}", res.data.total),
      "success"
    );
    loadCampaigns();
  } catch (err) {
    logger.error("Failed to send campaign", { error: err });
    toastStore.add(t("salon.sendFailed", "Failed to send campaign"), "error");
  } finally {
    sending.value = false;
  }
};

const recipientLabel = (campaign: any) => {
  if (campaign.recipients && Array.isArray(campaign.recipients)) {
    return `${campaign.recipients.length} recipient(s)`;
  }
  return "—";
};

const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
};

onMounted(loadCampaigns);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.marketing", "Marketing Campaigns") }}</h1>
        <p>
          {{
            t(
              "salon.createScheduleSend",
              "Create, schedule, and send salon marketing campaigns"
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
        <p>Loading campaigns...</p>
      </div>

      <div v-else class="stack">
        <div class="settings-card">
          <h3>
            {{
              editing
                ? t("salon.updateCampaign", "Edit Campaign")
                : t("salon.createCampaign", "New Campaign")
            }}
          </h3>
          <div class="grid">
            <label>
              {{ t("salon.name", "Name") }}
              <input v-model="form.name" class="field-input" />
            </label>
            <label>
              {{ t("salon.type", "Type") }}
              <select v-model="form.type" class="field-input">
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="social">Social</option>
              </select>
            </label>
            <label>
              {{ t("salon.subject", "Subject") }}
              <input v-model="form.subject" class="field-input" />
            </label>
            <label>
              {{ t("salon.targetAudience", "Target Audience") }}
              <select v-model="form.targetAudience" class="field-input">
                <option value="all">{{ t("salon.all", "All") }}</option>
                <option value="vip">{{ t("salon.vip", "VIP") }}</option>
                <option value="new">{{ t("salon.new", "New") }}</option>
                <option value="inactive">
                  {{ t("salon.inactive", "Inactive") }}
                </option>
              </select>
            </label>
            <label>
              {{ t("salon.status", "Status") }}
              <select v-model="form.status" class="field-input">
                <option value="draft">{{ t("salon.draft", "Draft") }}</option>
                <option value="scheduled">
                  {{ t("salon.scheduled", "Scheduled") }}
                </option>
                <option value="sent">{{ t("salon.sent", "Sent") }}</option>
                <option value="cancelled">
                  {{ t("salon.cancelled", "Cancelled") }}
                </option>
              </select>
            </label>
            <label>
              {{ t("salon.scheduledAt", "Scheduled At") }}
              <input
                v-model="form.scheduledAt"
                class="field-input"
                type="datetime-local"
              />
            </label>
            <label class="full">
              {{ t("salon.content", "Content") }}
              <textarea v-model="form.content" class="field-input" rows="4" />
            </label>
          </div>
          <div class="form-actions">
            <button v-if="editing" class="btn-secondary" @click="resetForm">
              {{ t("salon.cancel", "Cancel") }}
            </button>
            <button
              class="btn-primary"
              :disabled="saving"
              @click="editing ? updateCampaign() : createCampaign()"
            >
              {{
                saving
                  ? t("salon.saving", "Saving...")
                  : editing
                    ? t("salon.updateCampaign", "Update Campaign")
                    : t("salon.createCampaign", "Create Campaign")
              }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.campaignsList", "Campaigns") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.name", "Name") }}</th>
                <th>{{ t("salon.type", "Type") }}</th>
                <th>{{ t("salon.targetAudience", "Audience") }}</th>
                <th>{{ t("salon.status", "Status") }}</th>
                <th>{{ t("salon.recipients", "Recipients") }}</th>
                <th>{{ t("salon.scheduledAt", "Scheduled") }}</th>
                <th>{{ t("salon.sentAt", "Sent At") }}</th>
                <th class="actions">{{ t("salon.actions", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in campaigns" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.type }}</td>
                <td>{{ item.targetAudience }}</td>
                <td>
                  <span :class="['pill', `t-${item.status}`]">{{
                    item.status
                  }}</span>
                </td>
                <td>{{ recipientLabel(item) }}</td>
                <td>{{ formatDate(item.scheduledAt) }}</td>
                <td>{{ formatDate(item.sentAt) }}</td>
                <td class="actions">
                  <button
                    v-if="item.status !== 'sent'"
                    class="btn-primary-sm"
                    :disabled="sending"
                    @click="sendCampaign(item)"
                  >
                    {{ t("salon.send", "Send") }}
                  </button>
                  <button class="btn-secondary-sm" @click="startEdit(item)">
                    {{ t("salon.edit", "Edit") }}
                  </button>
                  <button
                    class="btn-danger-sm"
                    @click="deleteCampaign(item.id)"
                  >
                    {{ t("salon.delete", "Delete") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!campaigns.length">
                <td colspan="8" class="empty-state">
                  {{ t("salon.noCampaigns", "No campaigns yet") }}
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
.t-draft {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.t-scheduled {
  background: #fff7ed;
  color: #c2410c;
}
.t-sent {
  background: #ecfdf5;
  color: #047857;
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
.btn-primary-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--brand-600);
  color: var(--white);
  font-size: 12px;
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
.locale-select {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
</style>
