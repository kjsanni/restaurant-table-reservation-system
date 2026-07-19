<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import notificationAPI from "@/services/notificationAPI";
import logger from "@/utils/logger";

const props = defineProps<{
  data: { key: string; value: any }[];
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();

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

const load = () => {
  const emailSetting = props.data.find((s) => s.key === "email_server");
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
};

const saveEmailConfig = async () => {
  emailSaving.value = true;
  emailSaved.value = false;
  try {
    await authStore.updateSettings("email_server", emailConfig.value);
    emailSaved.value = true;
    setTimeout(() => (emailSaved.value = false), 2000);
  } catch (e: any) {
    toastStore.add(
      e?.response?.data?.message || "Failed to save email settings",
      "error"
    );
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
    emailTestMessage.value =
      e?.response?.data?.message || "Failed to send test email.";
  }
};

load();
</script>

<template>
  <div class="settings-card email-card">
    <h2 class="category-title">Email Server (SMTP)</h2>
    <p class="setting-description">
      SMTP credentials are stored in the database and used to send reservation
      and notification emails.
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
      <p v-if="emailTestMessage" :class="['test-message', emailTestStatus]">
        {{ emailTestMessage }}
      </p>
    </div>
  </div>
</template>
