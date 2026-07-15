<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, onMounted } from "vue";
import notificationAPI from "@/services/notificationAPI";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";

interface Template {
  subject: string;
  html: string;
}

const templateTypes = [
  "reservation_confirmation",
  "reservation_cancelled",
  "waitlist_promoted",
];
const templates = ref<Record<string, Template>>({});
const theme = ref({
  brandName: "",
  logoUrl: "",
  primaryColor: "#3b82f6",
  footerText: "",
});
const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const testEmail = ref("");
const testStatus = ref<"" | "sending" | "sent" | "error">("");
const testMessage = ref("");

const loadTemplates = async () => {
  loading.value = true;
  try {
    const res = await notificationAPI.getTemplates();
    templates.value = res.data.templates || {};
    theme.value = res.data.theme || {};
  } catch (e) {
    logger.error("Failed to load email templates", {
      error: (e as Error).message,
    });
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  saved.value = false;
  try {
    await Promise.all([
      import("@/stores/auth").then((m) =>
        m.useAuthStore().updateSettings("email_theme", theme.value)
      ),
      import("@/stores/auth").then((m) =>
        m.useAuthStore().updateSettings("email_templates", templates.value)
      ),
    ]);
    saved.value = true;
    setTimeout(() => (saved.value = false), 2000);
  } catch (e) {
    logger.error("Failed to save templates", { error: (e as Error).message });
  } finally {
    saving.value = false;
  }
};

const sendTest = async () => {
  testStatus.value = "sending";
  testMessage.value = "";
  try {
    await notificationAPI.sendTestEmail(testEmail.value);
    testStatus.value = "sent";
    testMessage.value = "Test email sent.";
  } catch (e: any) {
    testStatus.value = "error";
    testMessage.value = getApiErrorMessage(e, "Failed to send test email.");
  }
};

onMounted(loadTemplates);
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Email Templates &amp; Theme" />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading templates...</p>
      </div>

      <div v-else class="templates-container">
        <div class="theme-card">
          <h2 class="card-title">Email Theme</h2>
          <div class="field">
            <label class="field-label">Brand Name</label>
            <input
              v-model="theme.brandName"
              class="field-input"
              placeholder="Restaurant"
            />
          </div>
          <div class="field">
            <label class="field-label">Logo URL</label>
            <input
              v-model="theme.logoUrl"
              class="field-input"
              placeholder="https://..."
            />
          </div>
          <div class="field">
            <label class="field-label">Primary Color</label>
            <input
              v-model="theme.primaryColor"
              type="color"
              class="color-input"
            />
          </div>
          <div class="field">
            <label class="field-label">Footer Text</label>
            <textarea v-model="theme.footerText" class="field-input" rows="2" />
          </div>
        </div>

        <div v-for="type in templateTypes" :key="type" class="template-card">
          <h2 class="card-title">{{ type?.replace(/_/g, " ") }}</h2>
          <div class="field">
            <label class="field-label">Subject</label>
            <input
              v-model="templates[type].subject"
              class="field-input"
              placeholder="Email subject"
            />
          </div>
          <div class="field">
            <label class="field-label">HTML Body</label>
            <textarea
              v-model="templates[type].html"
              class="field-input"
              rows="6"
              placeholder="HTML template (use {{placeholder}} for data)"
            />
          </div>
        </div>

        <div class="save-section">
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? "Saving..." : "Save All" }}
          </button>
          <span v-if="saved" class="saved-indicator">Saved</span>
        </div>

        <div class="test-section">
          <h3 class="test-title">Send Test Email</h3>
          <div class="test-row">
            <input
              v-model="testEmail"
              class="field-input"
              placeholder="your@email.com"
            />
            <button
              class="btn btn-secondary"
              @click="sendTest"
              :disabled="testStatus === 'sending'"
            >
              {{ testStatus === "sending" ? "Sending..." : "Send Test" }}
            </button>
          </div>
          <p v-if="testMessage" :class="['test-msg', testStatus]">
            {{ testMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px;
  gap: 12px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #eee;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.templates-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.theme-card,
.template-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 20px;
}
.card-title {
  font-family: "Inter-Bold";
  font-size: 16px;
  margin: 0 0 12px 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.field-label {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--secondary-gray);
}
.field-input {
  padding: 10px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}
.color-input {
  width: 60px;
  height: 40px;
  padding: 2px;
}
.save-section {
  display: flex;
  align-items: center;
  gap: 12px;
}
.saved-indicator {
  color: #16a34a;
  font-family: "Inter-Medium";
}
.test-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.test-title {
  font-family: "Inter-Bold";
  font-size: 15px;
  margin: 0 0 8px 0;
}
.test-row {
  display: flex;
  gap: 10px;
}
.test-msg {
  margin-top: 8px;
  font-size: 13px;
}
.test-msg.sent {
  color: #16a34a;
}
.test-msg.error {
  color: #dc2626;
}
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: "Inter-Medium";
}
.btn-primary {
  background: #3b82f6;
  color: white;
}
.btn-secondary {
  background: #f3f4f6;
  color: #111;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
