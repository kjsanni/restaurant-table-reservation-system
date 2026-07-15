<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { VaSwitch } from "vuestic-ui";
import notificationAPI from "@/services/notificationAPI";

const authStore = useAuthStore();
const loading = ref(true);
const savingKeys = ref(new Set<string>());
const savedKeys = ref(new Set<string>());

const emailConfig = ref({
  host: "",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  from: "",
});
const emailSaving = ref(false);
const emailSaved = ref(false);
const emailTestTo = ref("");
const emailTestStatus = ref<"" | "sending" | "sent" | "error">("");
const emailTestMessage = ref("");
const settingsMap = ref<
  Record<
    string,
    {
      key: string;
      label: string;
      category: string;
      type: string;
      description: string;
      value: boolean | number | string;
    }
  >
>({});

const settingsConfig: Record<
  string,
  {
    label: string;
    category: string;
    type: string;
    description: string;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
  }
> = {
  customer_registration_enabled: {
    label: "Customer Registration",
    category: "Registration",
    type: "boolean",
    description: "Allow customers to create accounts and self-register",
  },
  reservation_slot_duration: {
    label: "Slot Duration",
    category: "Reservations",
    type: "number",
    unit: "minutes",
    description: "Default time increment for reservation bookings",
    min: 15,
    max: 180,
    step: 15,
  },
  max_party_size: {
    label: "Maximum Party Size",
    category: "Reservations",
    type: "number",
    unit: "guests",
    description: "Maximum number of people per reservation",
    min: 1,
    max: 100,
    step: 1,
  },
  allow_past_reservations: {
    label: "Past Reservations",
    category: "Reservations",
    type: "boolean",
    description: "Allow creating reservations for dates in the past",
  },
  require_table_assignment: {
    label: "Require Table Assignment",
    category: "Reservations",
    type: "boolean",
    description: "Require a table assigned during reservation creation",
  },
  table_base_price: {
    label: "Table Base Price",
    category: "Pricing",
    type: "number",
    unit: "GHS",
    description: "Base price per table",
    min: 0,
    max: 1000,
    step: 1,
  },
  table_price_per_additional_seat: {
    label: "Price Per Additional Seat",
    category: "Pricing",
    type: "number",
    unit: "GHS",
    description: "Extra charge per seat beyond 6 guests",
    min: 0,
    max: 100,
    step: 1,
  },
};

const categories = computed(() => {
  const cats: string[] = [];
  const seen = new Set<string>();
  Object.values(settingsConfig).forEach((s) => {
    if (!seen.has(s.category)) {
      seen.add(s.category);
      cats.push(s.category);
    }
  });
  return cats;
});

onMounted(async () => {
  await loadSettings();
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const data = await authStore.fetchSettings();
    const map: Record<
      string,
      {
        key: string;
        label: string;
        category: string;
        type: string;
        description: string;
        value: boolean | number | string;
      }
    > = {};
    data.forEach((s: { key: string; value: string | boolean | number }) => {
      let value = s.value;
      if (typeof value === "string") {
        if (value === "true") value = true;
        else if (value === "false") value = false;
        else {
          const num = Number(value);
          if (!isNaN(num)) value = num;
        }
      }
      map[s.key] = {
        ...settingsConfig[s.key],
        key: s.key,
        value,
      };
    });

    Object.entries(settingsConfig).forEach(([key, config]) => {
      if (!map[key]) {
        map[key] = {
          ...config,
          key,
          value: config.type === "number" ? config.min ?? 0 : false,
        };
      }
    });

    settingsMap.value = map;

    const emailSetting = data.find(
      (s: { key: string; value: any }) => s.key === "email_server"
    );
    if (emailSetting && emailSetting.value) {
      const v =
        typeof emailSetting.value === "string"
          ? JSON.parse(emailSetting.value)
          : emailSetting.value;
      emailConfig.value = {
        host: "",
        port: 587,
        secure: false,
        user: "",
        pass: "",
        from: "",
        ...v,
      };
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  } finally {
    loading.value = false;
  }
};

const getByCategory = (category: string) => {
  return Object.values(settingsMap.value).filter(
    (s) => s.category === category
  );
};

const markSaving = (key: string) => {
  savingKeys.value.add(key);
  savedKeys.value.delete(key);
};

const markSaved = (key: string) => {
  savingKeys.value.delete(key);
  savedKeys.value.add(key);
  setTimeout(() => savedKeys.value.delete(key), 2000);
};

const updateValue = async (setting: {
  key: string;
  value: boolean | number | string;
}) => {
  markSaving(setting.key);
  try {
    await authStore.updateSettings(setting.key, setting.value);
    markSaved(setting.key);
  } catch (e) {
    console.error("Failed to update setting", e);
  } finally {
    savingKeys.value.delete(setting.key);
  }
};

const handleNumberBlur = (setting: { key: string; value: number | string }) => {
  if (
    setting.value !== null &&
    setting.value !== undefined &&
    setting.value !== ""
  ) {
    updateValue(setting);
  }
};

const adjustNumber = (
  setting: { key: string; value: number },
  delta: number
) => {
  const config = settingsConfig[setting.key];
  const current = Number(setting.value) || 0;
  let newVal = current + delta;
  if (config.min !== undefined) newVal = Math.max(config.min, newVal);
  if (config.max !== undefined) newVal = Math.min(config.max, newVal);
  if (config.step) newVal = Math.round(newVal / config.step) * config.step;
  setting.value = newVal;
  updateValue(setting);
};

const saveEmailConfig = async () => {
  emailSaving.value = true;
  emailSaved.value = false;
  try {
    await authStore.updateSettings("email_server", {
      ...emailConfig.value,
      port: Number(emailConfig.value.port) || 587,
    });
    emailSaved.value = true;
    setTimeout(() => (emailSaved.value = false), 2000);
  } catch (e) {
    console.error("Failed to save email config", e);
  } finally {
    emailSaving.value = false;
  }
};

const sendTestEmail = async () => {
  emailTestStatus.value = "sending";
  emailTestMessage.value = "";
  try {
    await notificationAPI.sendTestEmail(emailTestTo.value);
    emailTestStatus.value = "sent";
    emailTestMessage.value = "Test email sent successfully.";
  } catch (e: any) {
    emailTestStatus.value = "error";
    emailTestMessage.value =
      e?.response?.data?.message || "Failed to send test email.";
  }
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Admin Settings" />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading settings...</p>
      </div>

      <div v-else class="settings-container">
        <div
          v-for="category in categories"
          :key="category"
          class="settings-card"
        >
          <h2 class="category-title">{{ category }}</h2>
          <div class="settings-list">
            <div
              v-for="setting in getByCategory(category)"
              :key="setting.key"
              class="setting-item"
            >
              <div class="setting-info">
                <label class="setting-label">{{ setting.label }}</label>
                <p class="setting-description">{{ setting.description }}</p>
              </div>

              <div class="setting-action">
                <VaSwitch
                  v-if="setting.type === 'boolean'"
                  :model-value="setting.value as boolean"
                  @update:model-value="
                    (val) => updateValue({ ...setting, value: val })
                  "
                />

                <div
                  v-else-if="setting.type === 'number'"
                  class="number-control"
                >
                  <button
                    type="button"
                    class="num-btn"
                    @click="
                      adjustNumber(
                        setting as { key: string; value: number },
                        -(settingsConfig[setting.key].step || 1)
                      )
                    "
                    :disabled="savingKeys.has(setting.key)"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    class="num-input"
                    :value="setting.value"
                    @blur="handleNumberBlur(setting)"
                    @keyup.enter="($event.target as HTMLInputElement).blur()"
                    :min="settingsConfig[setting.key].min"
                    :max="settingsConfig[setting.key].max"
                    :step="settingsConfig[setting.key].step || 1"
                  />
                  <button
                    type="button"
                    class="num-btn"
                    @click="
                      adjustNumber(
                        setting as { key: string; value: number },
                        settingsConfig[setting.key].step || 1
                      )
                    "
                    :disabled="savingKeys.has(setting.key)"
                  >
                    +
                  </button>
                  <span class="unit">{{
                    settingsConfig[setting.key].unit
                  }}</span>
                </div>

                <span
                  v-if="savingKeys.has(setting.key)"
                  class="status-text saving"
                  >Saving...</span
                >
                <span
                  v-else-if="savedKeys.has(setting.key)"
                  class="status-text saved"
                  >Saved</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="settings-card email-card">
          <h2 class="category-title">Email Server (SMTP)</h2>
          <p class="setting-description">
            SMTP credentials are stored in the database and used to send
            reservation and notification emails.
          </p>
          <div class="email-grid">
            <div class="email-field">
              <label>SMTP Host</label>
              <input
                v-model="emailConfig.host"
                class="field-input"
                placeholder="smtp.example.com"
              />
            </div>
            <div class="email-field">
              <label>Port</label>
              <input
                v-model.number="emailConfig.port"
                type="number"
                class="field-input"
              />
            </div>
            <div class="email-field checkbox-field">
              <label>Use TLS / SSL (secure)</label>
              <input v-model="emailConfig.secure" type="checkbox" />
            </div>
            <div class="email-field">
              <label>Username</label>
              <input
                v-model="emailConfig.user"
                class="field-input"
                placeholder="user@example.com"
              />
            </div>
            <div class="email-field">
              <label>Password</label>
              <input
                v-model="emailConfig.pass"
                type="password"
                class="field-input"
                placeholder="••••••••"
              />
            </div>
            <div class="email-field">
              <label>From Address</label>
              <input
                v-model="emailConfig.from"
                class="field-input"
                placeholder="noreply@restaurant.com"
              />
            </div>
          </div>
          <div class="email-actions">
            <button
              class="btn btn-primary"
              @click="saveEmailConfig"
              :disabled="emailSaving"
            >
              {{ emailSaving ? "Saving..." : "Save Email Settings" }}
            </button>
            <span v-if="emailSaved" class="status-text saved">Saved</span>
          </div>

          <div class="email-test">
            <h3 class="test-title">Send Test Email</h3>
            <div class="test-row">
              <input
                v-model="emailTestTo"
                class="field-input"
                placeholder="test@example.com"
              />
              <button
                class="btn btn-secondary"
                @click="sendTestEmail"
                :disabled="emailTestStatus === 'sending'"
              >
                {{ emailTestStatus === "sending" ? "Sending..." : "Send Test" }}
              </button>
            </div>
            <p
              v-if="emailTestMessage"
              :class="['test-message', emailTestStatus]"
            >
              {{ emailTestMessage }}
            </p>
          </div>
        </div>

        <div class="settings-card quick-actions-card">
          <h2 class="category-title">Quick Actions</h2>
          <div class="actions-grid">
            <RouterLink to="/staff/manage" class="action-card">
              <span class="action-icon">👥</span>
              <span>Manage Staff</span>
            </RouterLink>
            <RouterLink to="/roles/manage" class="action-card">
              <span class="action-icon">🔑</span>
              <span>Manage Roles</span>
            </RouterLink>
            <RouterLink to="/groups/manage" class="action-card">
              <span class="action-icon">🏷️</span>
              <span>Manage Groups</span>
            </RouterLink>
            <RouterLink to="/tables/manage" class="action-card">
              <span class="action-icon">🍽️</span>
              <span>Manage Tables</span>
            </RouterLink>
            <RouterLink to="/audit-logs" class="action-card">
              <span class="action-icon">📋</span>
              <span>Audit Logs</span>
            </RouterLink>
            <RouterLink to="/schedule" class="action-card">
              <span class="action-icon">📅</span>
              <span>Schedule</span>
            </RouterLink>
            <RouterLink to="/heatmap" class="action-card">
              <span class="action-icon">🗺️</span>
              <span>Heatmap</span>
            </RouterLink>
            <RouterLink to="/admin/payments" class="action-card">
              <span class="action-icon">💳</span>
              <span>Payments</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: var(--font-sans);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.category-title {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  color: var(--ink);
  margin: 0 0 var(--space-5) 0;
  letter-spacing: var(--tracking-tight);
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background-color: var(--neutral-50);
  border: 1px solid var(--border-subtle);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.setting-item:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
  cursor: default;
}

.setting-description {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin-top: var(--space-1);
  line-height: var(--leading-relaxed);
}

.setting-action {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.number-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.num-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.num-btn:hover:not(:disabled) {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.num-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.num-input {
  width: 76px;
  height: 34px;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink);
  background: var(--surface);
}

.num-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.unit {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  min-width: 50px;
}

.status-text {
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  font-weight: 500;
  min-width: 60px;
  text-align: right;
}

.status-text.saving {
  color: var(--accent);
}

.status-text.saved {
  color: var(--earth-600);
}

.email-card {
  margin-top: var(--space-1);
}

.email-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.email-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.email-field label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-secondary);
}

.field-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--ink);
  background: var(--surface);
  width: 100%;
  box-sizing: border-box;
  transition: border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out);
}

.field-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: var(--space-3);
}

.checkbox-field input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--accent);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.btn-primary {
  background: linear-gradient(135deg, var(--ink) 0%, var(--ink-secondary) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--neutral-50);
  color: var(--ink);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--neutral-100);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.email-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.email-test {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.test-title {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 650;
  color: var(--ink);
  margin: 0 0 var(--space-2) 0;
}

.test-row {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.test-message {
  font-size: var(--text-sm);
  margin-top: var(--space-3);
  font-family: var(--font-sans);
  font-weight: 500;
}

.test-message.sent {
  color: var(--earth-600);
}

.test-message.error {
  color: var(--rose-600);
}

.quick-actions-card {
  margin-top: var(--space-1);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.action-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--neutral-50);
  border: 1px solid var(--border-subtle);
  color: var(--ink);
  text-decoration: none;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.action-card:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
</style>
