<script setup lang="ts">
import { ref, onMounted } from "vue";
import { VaSwitch } from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import notificationAPI from "@/services/notificationAPI";
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
});

const whatsappTestTo = ref("");
const whatsappTestMessage = ref("");
const whatsappTestStatus = ref<"" | "sending" | "sent" | "error">("");
const sendingWhatsApp = ref(false);

const paystackWebhook = ref({ webhookUrl: "", lastEvent: null as any });
const loadingWebhook = ref(false);

const load = () => {
  const get = (key: string, fallback: any) => {
    const s = props.data.find((d) => d.key === key);
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
      email_confirmation_body: get("message_templates", {}).email_confirmation_body || "",
    },
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

const saveEnhancements = async () => {
  enhanceSaving.value = true;
  enhanceSaved.value = false;
  try {
    await authStore.updateSettings("maintenance_mode", enhanceConfig.value.maintenance);
    await authStore.updateSettings("currency_locale", enhanceConfig.value.currencyLocale);
    await authStore.updateSettings("reservation_window", enhanceConfig.value.reservationWindow);
    await authStore.updateSettings("branding", enhanceConfig.value.branding);
    await authStore.updateSettings("message_templates", {
      whatsapp_reminder: enhanceConfig.value.templates.whatsapp_reminder,
      email_confirmation_subject: enhanceConfig.value.templates.email_confirmation_subject,
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
    whatsappTestMessage.value = e?.response?.data?.message || "Failed to send test WhatsApp.";
  } finally {
    sendingWhatsApp.value = false;
  }
};

const onCopy = (text: string) => {
  navigator.clipboard?.writeText(text);
  toastStore.add("Copied to clipboard", "success");
};

load();
onMounted(loadPaystackWebhook);
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
            When enabled, new reservations are rejected with a maintenance message. Staff
            can still manage existing reservations.
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
        <input v-model="whatsappTestTo" class="field-input" placeholder="+233..." />
        <input
          v-model="whatsappTestMessage"
          class="field-input"
          placeholder="Test message (optional)"
        />
        <button class="btn btn-secondary" @click="sendTestWhatsApp" :disabled="sendingWhatsApp">
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

    <div class="email-actions">
      <button class="btn btn-primary" @click="saveEnhancements" :disabled="enhanceSaving">
        {{ enhanceSaving ? "Saving..." : "Save Platform Settings" }}
      </button>
      <span v-if="enhanceSaved" class="status-text saved">Saved</span>
    </div>
  </div>
</template>
