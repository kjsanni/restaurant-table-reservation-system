<script setup lang="ts">
import { ref, onMounted } from "vue";
import { VaSwitch } from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import notificationAPI from "@/services/notificationAPI";
import adminAPI from "@/services/adminAPI";
import logger from "@/utils/logger";

const props = defineProps<{
  data: { key: string; value: any }[];
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();

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
  sms: {
    provider: "africastalking",
    username: "",
    apiKey: "",
    accountSid: "",
    authToken: "",
    senderId: "",
  },
});

const whatsappTestTo = ref("");
const whatsappTestMessage = ref("");
const whatsappTestStatus = ref<"" | "sending" | "sent" | "error">("");
const sendingWhatsApp = ref(false);

const paystackWebhook = ref({ webhookUrl: "", lastEvent: null as any });
const loadingWebhook = ref(false);

const paystackKeyStatus = ref({
  hasSecretKey: false,
  hasWebhookSecret: false,
  mode: "test",
});
const loadingKeyStatus = ref(false);
const rotatingKey = ref(false);
const rotateError = ref("");
const rotateSuccess = ref(false);
const newSecretKey = ref("");
const newWebhookSecret = ref("");
const selectedMode = ref<"test" | "live">("test");

const load = () => {
  const get = (key: string, fallback: any) => {
    const s = props.data.find((d) => d.key === key);
    if (!s || s.value == null) return fallback;
    return typeof s.value === "string" ? JSON.parse(s.value) : s.value;
  };
  enhanceConfig.value = {
    maintenance: get("maintenance_mode", { enabled: false, message: "" }),
    currencyLocale: get("currency_locale", {
      currency: "GHS",
      locale: "en-GH",
    }),
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
    sms: get("africastalking_config", {
      provider: "africastalking",
      username: "",
      apiKey: "",
      accountSid: "",
      authToken: "",
      senderId: "",
    }),
  };
};

const loadPaystackWebhook = async () => {
  loadingWebhook.value = true;
  try {
    const res = await notificationAPI.getPaystackWebhookInfo();
    paystackWebhook.value = res.data;
  } catch (e: any) {
    logger.error("Failed to load webhook info", { error: e?.message });
  } finally {
    loadingWebhook.value = false;
  }
};

const loadPaystackKeyStatus = async () => {
  loadingKeyStatus.value = true;
  try {
    const res = await adminAPI.getPaystackConfig();
    paystackKeyStatus.value = res.data.config;
    selectedMode.value = res.data.config.mode === "live" ? "live" : "test";
  } catch (e: any) {
    logger.error("Failed to load Paystack config", { error: e?.message });
  } finally {
    loadingKeyStatus.value = false;
  }
};

const rotatePaystackKey = async () => {
  rotateError.value = "";
  rotateSuccess.value = false;
  if (!newSecretKey.value.trim()) {
    rotateError.value = "New secret key is required.";
    return;
  }
  rotatingKey.value = true;
  try {
    await adminAPI.rotatePaystackKey({
      secretKey: newSecretKey.value.trim(),
      webhookSecret: newWebhookSecret.value.trim() || undefined,
      mode: selectedMode.value,
    });
    rotateSuccess.value = true;
    newSecretKey.value = "";
    newWebhookSecret.value = "";
    await loadPaystackKeyStatus();
    setTimeout(() => (rotateSuccess.value = false), 3000);
  } catch (e: any) {
    rotateError.value =
      e?.response?.data?.message || "Failed to rotate Paystack keys.";
  } finally {
    rotatingKey.value = false;
  }
};

const saveEnhancements = async () => {
  enhanceSaving.value = true;
  enhanceSaved.value = false;
  try {
    await authStore.updateSettings(
      "maintenance_mode",
      enhanceConfig.value.maintenance
    );
    await authStore.updateSettings(
      "currency_locale",
      enhanceConfig.value.currencyLocale
    );
    await authStore.updateSettings(
      "reservation_window",
      enhanceConfig.value.reservationWindow
    );
    await authStore.updateSettings("branding", enhanceConfig.value.branding);
    await authStore.updateSettings("message_templates", {
      whatsapp_reminder: enhanceConfig.value.templates.whatsapp_reminder,
      email_confirmation_subject:
        enhanceConfig.value.templates.email_confirmation_subject,
      email_confirmation_body:
        enhanceConfig.value.templates.email_confirmation_body,
    });
    await authStore.updateSettings(
      "africastalking_config",
      enhanceConfig.value.sms
    );
    enhanceSaved.value = true;
    setTimeout(() => (enhanceSaved.value = false), 2000);
  } catch (e: any) {
    toastStore.add(
      e?.response?.data?.message || "Failed to save settings",
      "error"
    );
    logger.error("Failed to save enhancements", { error: e?.message });
  } finally {
    enhanceSaving.value = false;
  }
};

const sendTestWhatsApp = async () => {
  if (!whatsappTestTo.value) {
    whatsappTestStatus.value = "error";
    whatsappTestMessage.value = "Recipient phone is required.";
    return;
  }
  sendingWhatsApp.value = true;
  whatsappTestStatus.value = "sending";
  try {
    await notificationAPI.sendTestWhatsApp(
      whatsappTestTo.value,
      whatsappTestMessage.value
    );
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

const smsTesting = ref(false);
const smsTestResult = ref<{ success: boolean; message: string } | null>(null);

const testSms = async () => {
  smsTesting.value = true;
  smsTestResult.value = null;
  try {
    const phone = prompt("Enter phone number to test (e.g. +233241234567):");
    if (!phone) return;
    const res = await notificationAPI.sendTestSms(
      phone,
      "Test SMS from your reservation system."
    );
    smsTestResult.value = {
      success: true,
      message: `Test SMS sent via ${res.data?.provider || "SMS"}`,
    };
  } catch (e: any) {
    smsTestResult.value = {
      success: false,
      message: e?.response?.data?.message || "Failed to send test SMS",
    };
  } finally {
    smsTesting.value = false;
  }
};

const onCopy = (text: string) => {
  navigator.clipboard?.writeText(text);
  toastStore.add("Copied to clipboard", "success");
};

load();
onMounted(() => {
  loadPaystackWebhook();
  loadPaystackKeyStatus();
});
</script>

<template>
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
          @update:model-value="
            (val: boolean) => (enhanceConfig.maintenance.enabled = val)
          "
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
      <h3 class="integration-title">SMS Provider (Platform)</h3>
      <p class="setting-description" style="margin-bottom: 12px">
        Configure the platform-wide SMS provider for fallback notifications.
      </p>
      <div class="email-grid">
        <div class="email-field">
          <label>Provider</label>
          <select v-model="enhanceConfig.sms.provider" class="field-input">
            <option value="africastalking">Africa's Talking</option>
            <option value="twilio">Twilio</option>
          </select>
        </div>
        <div
          class="email-field"
          v-if="enhanceConfig.sms.provider === 'africastalking'"
        >
          <label>Username</label>
          <input
            v-model="enhanceConfig.sms.username"
            class="field-input"
            placeholder="Username"
          />
        </div>
        <div
          class="email-field"
          v-if="enhanceConfig.sms.provider === 'africastalking'"
        >
          <label>API Key</label>
          <input
            v-model="enhanceConfig.sms.apiKey"
            type="password"
            class="field-input"
            placeholder="API Key"
          />
        </div>
        <div class="email-field" v-if="enhanceConfig.sms.provider === 'twilio'">
          <label>Account SID</label>
          <input
            v-model="enhanceConfig.sms.accountSid"
            class="field-input"
            placeholder="AC..."
          />
        </div>
        <div class="email-field" v-if="enhanceConfig.sms.provider === 'twilio'">
          <label>Auth Token</label>
          <input
            v-model="enhanceConfig.sms.authToken"
            type="password"
            class="field-input"
            placeholder="Auth Token"
          />
        </div>
        <div class="email-field full-width">
          <label>Sender ID / From Number</label>
          <input
            v-model="enhanceConfig.sms.senderId"
            class="field-input"
            :placeholder="
              enhanceConfig.sms.provider === 'twilio' ? '+1234567890' : 'RTRS'
            "
          />
        </div>
        <div class="email-field full-width">
          <button
            class="btn btn-secondary"
            @click="testSms"
            :disabled="smsTesting"
          >
            {{ smsTesting ? "Sending..." : "Test SMS" }}
          </button>
          <span
            v-if="smsTestResult"
            class="status-text"
            :class="smsTestResult.success ? 'saved' : 'error'"
          >
            {{ smsTestResult.message }}
          </span>
        </div>
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
      <p class="setting-description" v-else>No webhook events received yet.</p>
    </section>

    <section class="integration-section">
      <h3 class="integration-title">Paystack API Key Rotation</h3>
      <p class="setting-description">
        Rotate the platform Paystack secret key. The new key is validated before
        saving. Rotation is logged in the audit trail.
      </p>
      <div class="email-grid">
        <div class="email-field">
          <label>Environment</label>
          <select v-model="selectedMode" class="field-input">
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
        </div>
        <div class="email-field full-width">
          <label>New Secret Key</label>
          <input
            v-model="newSecretKey"
            class="field-input"
            type="password"
            placeholder="sk_test_... or sk_live_..."
          />
        </div>
        <div class="email-field full-width">
          <label>New Webhook Secret (optional)</label>
          <input
            v-model="newWebhookSecret"
            class="field-input"
            type="password"
            placeholder="whsec_..."
          />
        </div>
      </div>
      <div class="form-actions">
        <button
          class="btn btn-primary"
          @click="rotatePaystackKey"
          :disabled="rotatingKey"
        >
          {{ rotatingKey ? "Rotating..." : "Rotate Keys" }}
        </button>
      </div>
      <p v-if="rotateError" class="error-text">{{ rotateError }}</p>
      <p v-if="rotateSuccess" class="status-text saved">
        Keys rotated successfully
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
</template>

<style scoped>
.error-text {
  color: var(--rose-600);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-top: var(--space-2);
}
.status-text {
  margin-left: var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
}
.status-text.saved {
  color: var(--earth-600);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);
}
</style>
