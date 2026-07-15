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
  padding: var(--space-20) var(--space-6);
  gap: var(--space-4);
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--restaurant-border);
  border-top-color: var(--restaurant-accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
}

.templates-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.theme-card,
.template-card {
  background: var(--restaurant-surface);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-normal) var(--ease-out);
}
.theme-card:hover,
.template-card:hover {
  box-shadow: var(--shadow-md);
}

.card-title {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  margin: 0 0 var(--space-4) 0;
  color: var(--restaurant-charcoal);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.field-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--restaurant-secondary);
}

.field-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  width: 100%;
  box-sizing: border-box;
  background: var(--restaurant-surface);
  color: var(--restaurant-charcoal);
  transition: border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out);
}
.field-input:focus {
  outline: none;
  border-color: var(--restaurant-accent);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.color-input {
  width: 64px;
  height: 44px;
  padding: var(--space-1);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.save-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.saved-indicator {
  color: var(--color-success-600);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
}

.test-section {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--restaurant-border);
}

.test-title {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  margin: 0 0 var(--space-3) 0;
  color: var(--restaurant-charcoal);
}

.test-row {
  display: flex;
  gap: var(--space-3);
}

.test-msg {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
}
.test-msg.sent {
  color: var(--color-success-600);
}
.test-msg.error {
  color: var(--color-accent-600);
}

.btn {
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: all var(--duration-fast) var(--ease-in-out);
}
.btn-primary {
  background: linear-gradient(
    135deg,
    var(--restaurant-charcoal) 0%,
    var(--restaurant-slate) 100%
  );
  color: white;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.btn-secondary {
  background: var(--color-primary-50);
  color: var(--restaurant-charcoal);
  border: 1px solid var(--restaurant-border);
}
.btn-secondary:hover {
  background: var(--color-primary-100);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
