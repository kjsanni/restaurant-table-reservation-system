<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, reactive, onMounted, computed } from "vue";
import notificationAPI from "@/services/notificationAPI";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";
import { useAuthStore } from "@/stores/auth";

interface Template {
  subject: string;
  html: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  reservation_confirmation: "Reservation Confirmation",
  reservation_cancelled: "Reservation Cancelled",
  waitlist_promoted: "Waitlist Promoted",
};

const TEMPLATE_VARIABLES: Record<string, string[]> = {
  reservation_confirmation: [
    "customer_name",
    "reservation_time",
    "party_size",
    "table_name",
  ],
  reservation_cancelled: ["customer_name", "reservation_time"],
  waitlist_promoted: ["customer_name", "party_size"],
};

const SHARED_VARIABLES = ["brandName"];

const SAMPLE_DATA: Record<string, string> = {
  customer_name: "Jane Doe",
  reservation_time: "Fri, 18 Jul 2026 at 7:30 PM",
  party_size: "4",
  table_name: "T12",
  brandName: "Restaurant",
};

const templateTypes = Object.keys(TEMPLATE_LABELS);
const templates = ref<Record<string, Template>>({});
const theme = reactive({
  brandName: "",
  logoUrl: "",
  primaryColor: "#d97706",
  footerText: "",
});
const defaults = ref<{
  theme: Record<string, any>;
  templates: Record<string, Template>;
}>({ theme: {}, templates: {} });

const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const dirty = ref(false);

const testEmail = ref("");
const testStatus = ref<"" | "sending" | "sent" | "error">("");
const testMessage = ref("");

const perTemplateTest = reactive<
  Record<
    string,
    {
      status: "" | "sending" | "sent" | "error";
      message: string;
    }
  >
>({});

const placeholder = (key: string) => `{{${key}}}`;

const loadTemplates = async () => {
  loading.value = true;
  try {
    const res = await notificationAPI.getTemplates();
    templates.value = res.data.templates || {};
    Object.assign(theme, res.data.theme || {});
    defaults.value = res.data.defaults || { theme: {}, templates: {} };
    templateTypes.forEach((type) => {
      if (!templates.value[type]) {
        templates.value[type] = { subject: "", html: "" };
      }
      perTemplateTest[type] = { status: "", message: "" };
    });
  } catch (e) {
    logger.error("Failed to load email templates", {
      error: (e as Error).message,
    });
  } finally {
    loading.value = false;
  }
};

const markDirty = () => {
  dirty.value = true;
};

const save = async () => {
  saving.value = true;
  saved.value = false;
  try {
    const authStore = useAuthStore();
    await Promise.all([
      authStore.updateSettings("email_theme", { ...theme }),
      authStore.updateSettings("email_templates", { ...templates.value }),
    ]);
    saved.value = true;
    dirty.value = false;
    setTimeout(() => (saved.value = false), 2000);
  } catch (e) {
    logger.error("Failed to save templates", { error: (e as Error).message });
  } finally {
    saving.value = false;
  }
};

const resetTheme = () => {
  Object.assign(theme, defaults.value.theme || {});
  markDirty();
};

const resetTemplate = (type: string) => {
  const def = defaults.value.templates?.[type];
  if (def) {
    templates.value[type] = { ...def };
    markDirty();
  }
};

const insertVariable = (type: string, key: string) => {
  const t = templates.value[type];
  if (!t) return;
  t.html += placeholder(key);
  markDirty();
};

const isSafeImageUrl = (url: string) => {
  try {
    const u = new URL(url);
    return (
      u.protocol === "http:" ||
      u.protocol === "https:" ||
      u.protocol === "data:"
    );
  } catch {
    return false;
  }
};

const buildPreviewHtml = (type: string) => {
  const t = templates.value[type];
  if (!t) return "";
  const merged = { ...SAMPLE_DATA, brandName: theme.brandName || "Restaurant" };
  const body = (t.html || "").replace(
    /\{\{(\w+)\}\}/g,
    (_, k: string) => merged[k] ?? placeholder(k)
  );
  const color = theme.primaryColor || "#d97706";
  const logo =
    theme.logoUrl && isSafeImageUrl(theme.logoUrl)
      ? `<img src="${theme.logoUrl}" alt="" style="max-height:40px;margin-bottom:8px;" />`
      : "";
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;">
    ${logo}
    <h2 style="color:${color}">${theme.brandName || "Restaurant"}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
    <small style="color:#888;">${
      (theme.footerText || "").replace(
        /\{\{(\w+)\}\}/g,
        (_, k: string) => merged[k] ?? ""
      ) || "&nbsp;"
    }</small>
  </body></html>`;
};

// Sanitized, sandboxed preview content (never injected via v-html).
const previewSrcdoc = (type: string) => buildPreviewHtml(type);

const previewSubject = (type: string) => {
  const t = templates.value[type];
  if (!t) return "";
  const merged = { ...SAMPLE_DATA, brandName: theme.brandName || "Restaurant" };
  return (t.subject || "").replace(
    /\{\{(\w+)\}\}/g,
    (_, k: string) => merged[k] ?? placeholder(k)
  );
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

const sendTemplateTest = async (type: string) => {
  perTemplateTest[type] = { status: "sending", message: "" };
  try {
    await notificationAPI.sendTemplate(type, testEmail.value, {
      ...SAMPLE_DATA,
    });
    perTemplateTest[type] = { status: "sent", message: "Test sent." };
  } catch (e: any) {
    perTemplateTest[type] = {
      status: "error",
      message: getApiErrorMessage(e, "Failed to send test."),
    };
  }
};

const allVariables = (type: string) => [
  ...SHARED_VARIABLES,
  ...(TEMPLATE_VARIABLES[type] || []),
];

const labelFor = (type: string) => TEMPLATE_LABELS[type] || type;

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
          <div class="card-header">
            <h2 class="card-title">Email Theme</h2>
            <button class="btn btn-ghost" @click="resetTheme">
              Reset to default
            </button>
          </div>
          <div class="field">
            <label class="field-label">Brand Name</label>
            <input
              v-model="theme.brandName"
              class="field-input"
              placeholder="Restaurant"
              @input="markDirty"
            />
          </div>
          <div class="field">
            <label class="field-label">Logo URL</label>
            <input
              v-model="theme.logoUrl"
              class="field-input"
              placeholder="https://..."
              @input="markDirty"
            />
          </div>
          <div class="field">
            <label class="field-label">Primary Color</label>
            <input
              v-model="theme.primaryColor"
              type="color"
              class="color-input"
              @input="markDirty"
            />
          </div>
          <div class="field">
            <label class="field-label">Footer Text</label>
            <textarea
              v-model="theme.footerText"
              class="field-input"
              rows="2"
              @input="markDirty"
            />
          </div>
        </div>

        <div v-for="type in templateTypes" :key="type" class="template-card">
          <div class="card-header">
            <h2 class="card-title">{{ labelFor(type) }}</h2>
            <button class="btn btn-ghost" @click="resetTemplate(type)">
              Reset to default
            </button>
          </div>

          <div class="field">
            <label class="field-label">Subject</label>
            <input
              v-model="templates[type].subject"
              class="field-input"
              placeholder="Email subject"
              @input="markDirty"
            />
          </div>

          <div class="field">
            <label class="field-label">HTML Body</label>
            <div class="variable-chips">
              <span class="chips-label">Insert variable:</span>
              <button
                v-for="v in allVariables(type)"
                :key="v"
                class="chip"
                type="button"
                @click="insertVariable(type, v)"
              >
                {{ placeholder(v) }}
              </button>
            </div>
            <textarea
              v-model="templates[type].html"
              class="field-input code-input"
              rows="7"
              placeholder="HTML template (use {{placeholder}} for data)"
              @input="markDirty"
            />
          </div>

          <div class="preview-block">
            <div class="preview-header">
              <span class="preview-label">Live Preview</span>
              <span class="preview-subject">{{ previewSubject(type) }}</span>
            </div>
            <iframe
              class="preview-frame"
              sandbox=""
              title="Email preview"
              :srcdoc="previewSrcdoc(type)"
            ></iframe>
          </div>

          <div class="template-test">
            <input
              v-model="testEmail"
              class="field-input"
              placeholder="your@email.com"
            />
            <button
              class="btn btn-secondary"
              :disabled="
                !testEmail || perTemplateTest[type]?.status === 'sending'
              "
              @click="sendTemplateTest(type)"
            >
              {{
                perTemplateTest[type]?.status === "sending"
                  ? "Sending..."
                  : "Send test of this template"
              }}
            </button>
            <span
              v-if="perTemplateTest[type]?.message"
              :class="['test-msg', perTemplateTest[type]?.status]"
            >
              {{ perTemplateTest[type]?.message }}
            </span>
          </div>
        </div>

        <div class="save-section">
          <button
            class="btn btn-primary"
            @click="save"
            :disabled="saving || !dirty"
          >
            {{ saving ? "Saving..." : "Save All" }}
          </button>
          <span v-if="saved" class="saved-indicator">Saved</span>
          <span v-else-if="dirty" class="unsaved-indicator"
            >Unsaved changes</span
          >
        </div>

        <div class="test-section">
          <h3 class="test-title">Send Generic Test Email</h3>
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
.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.templates-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.theme-card,
.template-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-150) var(--ease-out);
}
.theme-card:hover,
.template-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.card-title {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  margin: 0;
  color: var(--ink);
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
  color: var(--ink-secondary);
}

.field-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  width: 100%;
  box-sizing: border-box;
  background: var(--surface);
  color: var(--ink);
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}
.field-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.code-input {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
}

.color-input {
  width: 64px;
  height: 44px;
  padding: var(--space-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.variable-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.chips-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.chip {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--neutral-50);
  color: var(--accent-text);
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}
.chip:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}

.preview-block {
  margin-top: var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.preview-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border-subtle);
}
.preview-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ink-muted);
}
.preview-subject {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-frame {
  background: var(--surface);
  max-height: 320px;
  overflow: auto;
}

.template-test {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.template-test .field-input {
  flex: 1;
  min-width: 200px;
  margin-bottom: 0;
}

.save-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.saved-indicator {
  color: var(--earth-600);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
}
.unsaved-indicator {
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.test-section {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}
.test-title {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  margin: 0 0 var(--space-3) 0;
  color: var(--ink);
}
.test-row {
  display: flex;
  gap: var(--space-3);
}
.test-msg {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  margin-left: 0;
}
.test-msg.sent {
  color: var(--earth-600);
}
.test-msg.error {
  color: var(--rose-600);
}

.btn {
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-primary {
  background: linear-gradient(135deg, var(--ink) 0%, var(--ink-secondary) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover:not(:disabled) {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.btn-secondary {
  background: var(--neutral-50);
  color: var(--ink);
  border: 1px solid var(--border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--neutral-100);
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-ghost {
  background: transparent;
  color: var(--accent-text);
  border: 1px solid var(--border);
  padding: var(--space-1-5) var(--space-3);
  font-size: var(--text-xs);
}
.btn-ghost:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}
</style>
