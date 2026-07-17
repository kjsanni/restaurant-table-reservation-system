<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import adminAPI from "@/services/adminAPI";
import notificationAPI from "@/services/notificationAPI";
import logger from "@/utils/logger";

const authStore = useAuthStore();
const toastStore = useToastStore();
const loading = ref(true);
const savingKeys = ref(new Set());
const savedKeys = ref(new Set());
const sendingLogs = ref(false);
const logsSent = ref(false);

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

const integrationSaving = ref(false);
const integrationSaved = ref(false);
const integrationConfig = ref({
  whatsapp: { enabled: false, token: "", phoneNumberId: "" },
  channels: { email: true, whatsapp: false },
  paystack: { mode: "test", secretKey: "", webhookSecret: "" },
  tenantMode: false,
});

const loadIntegrationConfig = (data: { key: string; value: any }[]) => {
  const get = (key: string, fallback: any) => {
    const s = data.find((d) => d.key === key);
    if (!s || s.value == null) return fallback;
    const v = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
    return v ?? fallback;
  };
  integrationConfig.value = {
    whatsapp: get("whatsapp_config", {
      enabled: false,
      token: "",
      phoneNumberId: "",
    }),
    channels: get("notification_channels", { email: true, whatsapp: false }),
    paystack: get("paystack_config", {
      mode: "test",
      secretKey: "",
      webhookSecret: "",
    }),
    tenantMode: Boolean(get("tenant_mode_enabled", false)),
  };
};

const saveAllIntegrations = async () => {
  integrationSaving.value = true;
  integrationSaved.value = false;
  try {
    await authStore.updateSettings(
      "whatsapp_config",
      integrationConfig.value.whatsapp
    );
    await authStore.updateSettings(
      "notification_channels",
      integrationConfig.value.channels
    );
    await authStore.updateSettings(
      "paystack_config",
      integrationConfig.value.paystack
    );
    integrationSaved.value = true;
    setTimeout(() => (integrationSaved.value = false), 2000);
  } catch (e: any) {
    toastStore.add(
      e?.response?.data?.message || "Failed to save integrations",
      "error"
    );
    logger.error("Failed to save integrations", { error: e?.message });
  } finally {
    integrationSaving.value = false;
  }
};

const enhanceSaving = ref(false);
const enhanceSaved = ref(false);
const enhanceConfig = ref({
  maintenance: { enabled: false, message: "" },
  currencyLocale: { currency: "GHS", locale: "en-GH" },
  reservationWindow: { minLeadMinutes: 0, maxLeadDays: 365, maxPerSlot: 1 },
  branding: { logoUrl: "", brandName: "", primaryColor: "" },
  templates: {
    whatsapp_reminder: "",
    email_confirmation_subject: "",
    email_confirmation_body: "",
  },
});

const loadEnhanceConfig = (data: { key: string; value: any }[]) => {
  const get = (key: string, fallback: any) => {
    const s = data.find((d) => d.key === key);
    if (!s || s.value == null) return fallback;
    return typeof s.value === "string" ? JSON.parse(s.value) : s.value;
  };
  enhanceConfig.value = {
    maintenance: get("maintenance_mode", { enabled: false, message: "" }),
    currencyLocale: get("currency_locale", { currency: "GHS", locale: "en-GH" }),
    reservationWindow: get("reservation_window", {
      minLeadMinutes: 0,
      maxLeadDays: 365,
      maxPerSlot: 1,
    }),
    branding: get("branding", { logoUrl: "", brandName: "", primaryColor: "" }),
    templates: {
      whatsapp_reminder: get("message_templates", {}).whatsapp_reminder || "",
      email_confirmation_subject:
        get("message_templates", {}).email_confirmation_subject || "",
      email_confirmation_body:
        get("message_templates", {}).email_confirmation_body || "",
    },
  };
};

const saveEnhancements = async () => {
  enhanceSaving.value = true;
  enhanceSaved.value = false;
  try {
    await authStore.updateSettings("maintenance_mode", enhanceConfig.value.maintenance);
    await authStore.updateSettings("currency_locale", enhanceConfig.value.currencyLocale);
    await authStore.updateSettings(
      "reservation_window",
      enhanceConfig.value.reservationWindow
    );
    await authStore.updateSettings("branding", enhanceConfig.value.branding);
    await authStore.updateSettings("message_templates", {
      whatsapp_reminder: enhanceConfig.value.templates.whatsapp_reminder,
      email_confirmation_subject:
        enhanceConfig.value.templates.email_confirmation_subject,
      email_confirmation_body: enhanceConfig.value.templates.email_confirmation_body,
    });
    enhanceSaved.value = true;
    setTimeout(() => (enhanceSaved.value = false), 2000);
  } catch (e: any) {
    toastStore.add(e?.response?.data?.message || "Failed to save settings", "error");
    logger.error("Failed to save enhancements", { error: e?.message });
  } finally {
    enhanceSaving.value = false;
  }
};

const whatsappTestTo = ref("");
const whatsappTestMessage = ref("");
const whatsappTestStatus = ref<"" | "sending" | "sent" | "error">("");
const sendingWhatsApp = ref(false);

const sendTestWhatsApp = async () => {
  if (!whatsappTestTo.value) {
    whatsappTestStatus.value = "error";
    whatsappTestMessage.value = "Recipient phone is required.";
    return;
  }
  sendingWhatsApp.value = true;
  whatsappTestStatus.value = "sending";
  try {
    await notificationAPI.sendTestWhatsApp(whatsappTestTo.value, whatsappTestMessage.value);
    whatsappTestStatus.value = "sent";
    whatsappTestMessage.value = "Test WhatsApp sent.";
  } catch (e: any) {
    whatsappTestStatus.value = "error";
    whatsappTestMessage.value =
      e?.response?.data?.message || "Failed to send test WhatsApp.";
  } finally {
    sendingWhatsApp.value = false;
  }
};

const paystackWebhook = ref({ webhookUrl: "", lastEvent: null });
const loadingWebhook = ref(false);

const loadPaystackWebhook = async () => {
  loadingWebhook.value = true;
  try {
    const res = await notificationAPI.getPaystackWebhookInfo();
    paystackWebhook.value = res.data;
  } catch (e) {
    logger.error("Failed to load webhook info", { error: e?.message });
  } finally {
    loadingWebhook.value = false;
  }
};

const saveEmailConfig = async () => {
  emailSaving.value = true;
  emailSaved.value = false;
  try {
    await authStore.updateSettings("email_server", emailConfig.value);
    emailSaved.value = true;
    setTimeout(() => (emailSaved.value = false), 2000);
  } catch (e: any) {
    toastStore.add(e?.response?.data?.message || "Failed to save email settings", "error");
    logger.error("Failed to save email settings", { error: e?.message });
  } finally {
    emailSaving.value = false;
  }
};

const sendTestEmail = async () => {
  if (!emailTestTo.value) {
    emailTestStatus.value = "error";
    emailTestMessage.value = "Recipient email is required.";
    return;
  }
  emailTestStatus.value = "sending";
  emailTestMessage.value = "";
  try {
    await notificationAPI.sendTestEmail(emailTestTo.value);
    emailTestStatus.value = "sent";
    emailTestMessage.value = "Test email sent.";
  } catch (e: any) {
    emailTestStatus.value = "error";
    emailTestMessage.value = e?.response?.data?.message || "Failed to send test email.";
  }
};

const saveIntegration = async (key: string, value: any) => {
  try {
    await authStore.updateSettings(key, value);
    toastStore.add("Setting saved", "success");
  } catch (e: any) {
    toastStore.add(e?.response?.data?.message || "Failed to save setting", "error");
    logger.error("Failed to save integration setting", { error: e?.message });
  }
};

const onCopy = (text: string) => {
  navigator.clipboard?.writeText(text);
  toastStore.add("Copied to clipboard", "success");
};

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
  tenant_mode_enabled: {
    label: "Multi-Tenant Mode",
    category: "Platform",
    type: "boolean",
    description:
      "Enable SaaS multi-tenant mode. Requires TENANT_MODE=enabled server-side to take effect. When off, the system runs as a single restaurant.",
  },
  whatsapp_config: {
    label: "WhatsApp",
    category: "Integrations",
    type: "json",
    description: "WhatsApp Business API credentials for customer notifications",
  },
  notification_channels: {
    label: "Notification Channels",
    category: "Integrations",
    type: "json",
    description: "Which channels are used to notify customers",
  },
  paystack_config: {
    label: "Paystack",
    category: "Integrations",
    type: "json",
    description: "Platform-level Paystack payment gateway credentials",
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

    loadIntegrationConfig(data);

    loadEnhanceConfig(data);

    const emailSetting = data.find(
      (s: { key: string; value: any }) => s.key === "email_server"
    );
    if (emailSetting && emailSetting.value) {
      const v =
        typeof emailSetting.value === "string"
          ? JSON.parse(emailSetting.value)
          : emailSetting.value;
      // Never echo a stored password back into the form (write-only field).
      if (v && typeof v === "object") delete v.pass;
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
      logger.error("Failed to load settings", { error: e.message });
    } finally {
      loading.value = false;
      loadPaystackWebhook();
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
    logger.error("Failed to update setting", { error: e.message });
  } finally {
    savingKeys.value.delete(setting.key);
  }
};

const handleNumberBlur = (setting: {
  key: string;
  value: number | string | boolean;
}) => {
  if (
    setting.value !== null &&
    setting.value !== undefined &&
    setting.value !== ""
  ) {
    updateValue(setting);
  }
};

const adjustNumber = (setting, delta) => {
  const current = Number(setting.value) || 0;
  const step = Number(delta) || 0;
  const config = settingsConfig[setting.key];
  let newVal = current + step;
  if (config.min !== undefined) newVal = Math.max(config.min, newVal);
  if (config.max !== undefined) newVal = Math.min(config.max, newVal);
  if (config.step) newVal = Math.round(newVal / config.step) * config.step;
  setting.value = newVal;
  updateValue(setting);
};

const sendLogs = async () => {
  sendingLogs.value = true;
  logsSent.value = false;
  try {
    await adminAPI.emailLogs();
    logsSent.value = true;
    toastStore.add("Logs sent successfully!", "success");
    setTimeout(() => (logsSent.value = false), 3000);
  } catch (err) {
    toastStore.add(
      err.response?.data?.message || "Failed to email logs",
      "error"
    );
    logger.error("Failed to email logs", { error: err.message });
  } finally {
    sendingLogs.value = false;
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

        <div class="settings-card integrations-card">
          <h2 class="category-title">Integrations</h2>

          <section class="integration-section">
            <h3 class="integration-title">Multi-Tenant Mode</h3>
            <div class="setting-row">
              <div class="setting-info">
                <label class="setting-label">Enable SaaS Multi-Tenancy</label>
                <p class="setting-description">
                  When enabled (and the server runs with TENANT_MODE=enabled),
                  the platform supports multiple restaurants with isolated data.
                </p>
              </div>
              <VaSwitch
                :model-value="integrationConfig.tenantMode"
                @update:model-value="
                  (val) => {
                    integrationConfig.tenantMode = val;
                    saveIntegration('tenant_mode_enabled', val);
                  }
                "
              />
            </div>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">WhatsApp Business API</h3>
            <div class="email-grid">
              <div class="email-field checkbox-field">
                <label>Enabled</label>
                <input
                  v-model="integrationConfig.whatsapp.enabled"
                  type="checkbox"
                />
              </div>
              <div class="email-field">
                <label>Phone Number ID</label>
                <input
                  v-model="integrationConfig.whatsapp.phoneNumberId"
                  class="field-input"
                  placeholder="123456789"
                />
              </div>
              <div class="email-field full-width">
                <label>Permanent Access Token</label>
                <input
                  v-model="integrationConfig.whatsapp.token"
                  type="password"
                  class="field-input"
                  placeholder="EAA..."
                />
              </div>
            </div>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">Notification Channels</h3>
            <div class="channel-toggles">
              <label class="checkbox-inline">
                <input
                  v-model="integrationConfig.channels.email"
                  type="checkbox"
                />
                Email
              </label>
              <label class="checkbox-inline">
                <input
                  v-model="integrationConfig.channels.whatsapp"
                  type="checkbox"
                />
                WhatsApp
              </label>
            </div>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">Paystack (Platform)</h3>
            <div class="email-grid">
              <div class="email-field">
                <label>Mode</label>
                <select
                  v-model="integrationConfig.paystack.mode"
                  class="field-input"
                >
                  <option value="test">Test</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div class="email-field full-width">
                <label>Secret Key</label>
                <input
                  v-model="integrationConfig.paystack.secretKey"
                  type="password"
                  class="field-input"
                  placeholder="sk_..."
                />
              </div>
              <div class="email-field full-width">
                <label>Webhook Secret</label>
                <input
                  v-model="integrationConfig.paystack.webhookSecret"
                  type="password"
                  class="field-input"
                  placeholder="whsec_..."
                />
              </div>
            </div>
          </section>

          <div class="email-actions">
            <button
              class="btn btn-primary"
              @click="saveAllIntegrations"
              :disabled="integrationSaving"
            >
              {{ integrationSaving ? "Saving..." : "Save Integrations" }}
            </button>
            <span v-if="integrationSaved" class="status-text saved">Saved</span>
          </div>
        </div>

        <div class="settings-card platform-card">
          <h2 class="category-title">Platform &amp; Booking</h2>

          <section class="integration-section">
            <h3 class="integration-title">Maintenance Mode</h3>
            <div class="setting-row">
              <div class="setting-info">
                <label class="setting-label">Close online booking</label>
                <p class="setting-description">
                  When enabled, new reservations are rejected with a maintenance
                  message. Staff can still manage existing reservations.
                </p>
              </div>
              <VaSwitch
                :model-value="enhanceConfig.maintenance.enabled"
                @update:model-value="(val) => (enhanceConfig.maintenance.enabled = val)"
              />
            </div>
            <div class="email-field full-width" style="margin-top: 12px">
              <label>Maintenance Message (optional)</label>
              <input
                v-model="enhanceConfig.maintenance.message"
                class="field-input"
                placeholder="Online booking is temporarily unavailable."
              />
            </div>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">Currency &amp; Locale</h3>
            <div class="email-grid">
              <div class="email-field">
                <label>Currency Code</label>
                <input
                  v-model="enhanceConfig.currencyLocale.currency"
                  class="field-input"
                  placeholder="GHS"
                />
              </div>
              <div class="email-field">
                <label>Locale</label>
                <input
                  v-model="enhanceConfig.currencyLocale.locale"
                  class="field-input"
                  placeholder="en-GH"
                />
              </div>
            </div>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">Reservation Window</h3>
            <div class="email-grid">
              <div class="email-field">
                <label>Min Lead Time (minutes)</label>
                <input
                  v-model.number="enhanceConfig.reservationWindow.minLeadMinutes"
                  type="number"
                  min="0"
                  class="field-input"
                />
              </div>
              <div class="email-field">
                <label>Max Advance (days)</label>
                <input
                  v-model.number="enhanceConfig.reservationWindow.maxLeadDays"
                  type="number"
                  min="1"
                  class="field-input"
                />
              </div>
              <div class="email-field">
                <label>Max Per Slot</label>
                <input
                  v-model.number="enhanceConfig.reservationWindow.maxPerSlot"
                  type="number"
                  min="1"
                  class="field-input"
                />
              </div>
            </div>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">Branding</h3>
            <div class="email-grid">
              <div class="email-field">
                <label>Brand Name</label>
                <input
                  v-model="enhanceConfig.branding.brandName"
                  class="field-input"
                  placeholder="My Restaurant"
                />
              </div>
              <div class="email-field">
                <label>Primary Color</label>
                <input
                  v-model="enhanceConfig.branding.primaryColor"
                  type="text"
                  class="field-input"
                  placeholder="#d97706"
                />
              </div>
              <div class="email-field full-width">
                <label>Logo URL</label>
                <input
                  v-model="enhanceConfig.branding.logoUrl"
                  class="field-input"
                  placeholder="https://.../logo.png"
                />
              </div>
            </div>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">Message Templates</h3>
            <div class="email-field full-width">
              <label>WhatsApp Reminder</label>
              <textarea
                v-model="enhanceConfig.templates.whatsapp_reminder"
                class="field-input"
                rows="3"
                placeholder="Hi {{name}}, this is a reminder..."
              ></textarea>
            </div>
            <div class="email-field full-width">
              <label>Email Confirmation Subject</label>
              <input
                v-model="enhanceConfig.templates.email_confirmation_subject"
                class="field-input"
                placeholder="Reservation Confirmed – {{customer_name}}"
              />
            </div>
            <div class="email-field full-width">
              <label>Email Confirmation Body</label>
              <textarea
                v-model="enhanceConfig.templates.email_confirmation_body"
                class="field-input"
                rows="3"
                placeholder="Hi {{customer_name}}, your reservation is confirmed..."
              ></textarea>
            </div>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">Test WhatsApp Message</h3>
            <div class="test-row">
              <input
                v-model="whatsappTestTo"
                class="field-input"
                placeholder="+233..."
              />
              <input
                v-model="whatsappTestMessage"
                class="field-input"
                placeholder="Test message (optional)"
              />
              <button
                class="btn btn-secondary"
                @click="sendTestWhatsApp"
                :disabled="sendingWhatsApp"
              >
                {{ sendingWhatsApp ? "Sending..." : "Send Test" }}
              </button>
            </div>
            <p
              v-if="whatsappTestMessage && whatsappTestStatus"
              :class="['test-message', whatsappTestStatus]"
            >
              {{ whatsappTestMessage }}
            </p>
          </section>

          <section class="integration-section">
            <h3 class="integration-title">Paystack Webhook</h3>
            <div class="webhook-box">
              <code>{{ paystackWebhook.webhookUrl || "—" }}</code>
              <button
                class="btn btn-secondary"
                @click="onCopy(paystackWebhook.webhookUrl)"
                :disabled="!paystackWebhook.webhookUrl"
              >
                Copy
              </button>
            </div>
            <p class="setting-description" v-if="paystackWebhook.lastEvent">
              Last event:
              <strong>{{ paystackWebhook.lastEvent.event }}</strong>
              ({{ paystackWebhook.lastEvent.paystackEventId }})
            </p>
            <p class="setting-description" v-else>
              No webhook events received yet.
            </p>
          </section>

          <div class="email-actions">
            <button
              class="btn btn-primary"
              @click="saveEnhancements"
              :disabled="enhanceSaving"
            >
              {{ enhanceSaving ? "Saving..." : "Save Platform Settings" }}
            </button>
            <span v-if="enhanceSaved" class="status-text saved">Saved</span>
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
            <button
              class="action-card"
              type="button"
              @click="sendLogs"
              :disabled="sendingLogs"
            >
              <span class="action-icon">📧</span>
              <span>{{
                sendingLogs
                  ? "Sending..."
                  : logsSent
                  ? "Logs Sent"
                  : "Email Logs"
              }}</span>
            </button>
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

.integrations-card {
  margin-top: var(--space-1);
}

.integration-section {
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.integration-section:last-of-type {
  border-bottom: none;
}

.integration-title {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--ink-secondary);
  margin-bottom: var(--space-3);
}

.setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.full-width,
.email-field.full-width {
  grid-column: 1 / -1;
}

.channel-toggles {
  display: flex;
  gap: var(--space-6);
  margin-top: var(--space-2);
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  cursor: pointer;
}

.checkbox-inline input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
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

.webhook-box {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--surface-2, #f6f9fc);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-top: var(--space-3);
}

.webhook-box code {
  flex: 1;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  word-break: break-all;
}

textarea.field-input {
  resize: vertical;
  min-height: 72px;
  font-family: var(--font-sans);
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
