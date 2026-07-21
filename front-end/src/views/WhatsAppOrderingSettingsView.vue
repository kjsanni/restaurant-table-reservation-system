<script setup lang="ts">
import { ref, onMounted } from "vue";
import authAPI from "@/services/authAPI";
import logger from "@/utils/logger";

interface MessageTemplate {
  name: string;
  category: string;
  body: string;
  variables: string[];
}

const TEMPLATE_DEFINITIONS: MessageTemplate[] = [
  {
    name: "welcome",
    category: "Utility",
    body: "Hi {{name}}! Welcome to {{restaurantName}}.\n\nWhat would you like to do?\n1. Make a reservation\n2. Order delivery\n3. Check order status\n4. Talk to someone",
    variables: ["name", "restaurantName"],
  },
  {
    name: "reservation_confirmation",
    category: "Utility",
    body: "✅ Confirmed! Reservation #{{reservationId}}.\n📅 {{resDate}} at {{resTime}}\n👥 {{people}} people\nSee you then!",
    variables: ["reservationId", "resDate", "resTime", "people"],
  },
  {
    name: "reservation_reminder",
    category: "Utility",
    body: "⏰ Reminder: Your reservation at {{restaurantName}} is today at {{resTime}}. See you soon!",
    variables: ["restaurantName", "resTime"],
  },
  {
    name: "delivery_confirmation",
    category: "Utility",
    body: "✅ Order #{{orderId}} confirmed!\nTotal: GHS {{total}}\nDelivery to: {{address}}\nYou'll receive a tracking number shortly.",
    variables: ["orderId", "total", "address"],
  },
  {
    name: "delivery_status_update",
    category: "Utility",
    body: "📦 Update: Your delivery is now {{status}}. {{statusDescription}}",
    variables: ["status", "statusDescription"],
  },
  {
    name: "payment_link",
    category: "Utility",
    body: "Complete your payment here: {{paymentLink}}\nYou'll receive confirmation once paid.",
    variables: ["paymentLink"],
  },
  {
    name: "delivery_tracking",
    category: "Utility",
    body: "🚚 Your order is on the way!\nTracking: {{trackingNumber}}\nDriver: {{driverName}}\nETA: {{eta}}",
    variables: ["trackingNumber", "driverName", "eta"],
  },
];

const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const enabled = ref(false);
const orderingHours = ref({
  monday: { open: "08:00", close: "22:00", enabled: true },
  tuesday: { open: "08:00", close: "22:00", enabled: true },
  wednesday: { open: "08:00", close: "22:00", enabled: true },
  thursday: { open: "08:00", close: "22:00", enabled: true },
  friday: { open: "08:00", close: "23:00", enabled: true },
  saturday: { open: "09:00", close: "23:00", enabled: true },
  sunday: { open: "09:00", close: "21:00", enabled: true },
});
const templates = ref<Record<string, string>>({});
const templateDefinitions = TEMPLATE_DEFINITIONS;

type DayKey = keyof typeof orderingHours.value;

const days: Array<{ key: DayKey; label: string }> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const loadSettings = async () => {
  loading.value = true;
  try {
    const res = await authAPI.getSettings();
    const data = res.data.settings || res.data || [];
    const map = new Map<string, string>(
      data.map((s: any) => [s.key, String(s.value || "")])
    );

    enabled.value = map.get("whatsapp_ordering_enabled") === "true";
    const hours = map.get("whatsapp_ordering_hours");
    if (hours) {
      try {
        const parsed = JSON.parse(hours);
        orderingHours.value = { ...orderingHours.value, ...parsed };
      } catch (err) {
        // ignore parse error
      }
    }
    const tplStr = map.get("whatsapp_message_templates");
    if (tplStr) {
      try {
        templates.value = JSON.parse(tplStr);
      } catch (err) {
        // ignore
      }
    }
    for (const def of TEMPLATE_DEFINITIONS) {
      if (!templates.value[def.name]) {
        templates.value[def.name] = def.body;
      }
    }
  } catch (err) {
    logger.error("Failed to load WhatsApp ordering settings", { error: err });
  } finally {
    loading.value = false;
  }
};

onMounted(loadSettings);

const saveSettings = async () => {
  saving.value = true;
  saved.value = false;
  try {
    await authAPI.updateSettings(
      "whatsapp_ordering_enabled",
      String(enabled.value)
    );
    await authAPI.updateSettings(
      "whatsapp_ordering_hours",
      JSON.stringify(orderingHours.value)
    );
    await authAPI.updateSettings(
      "whatsapp_message_templates",
      JSON.stringify(templates.value)
    );
    saved.value = true;
    setTimeout(() => {
      saved.value = false;
    }, 3000);
  } catch (err) {
    logger.error("Failed to save WhatsApp ordering settings", { error: err });
  } finally {
    saving.value = false;
  }
};

const resetTemplate = (name: string, defaultBody: string) => {
  templates.value[name] = defaultBody;
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>WhatsApp Ordering</h1>
        <p>Let customers order via WhatsApp</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading settings...</p>
      </div>

      <div v-else class="settings-stack">
        <div class="settings-card">
          <h3>Enable WhatsApp Ordering</h3>
          <p class="settings-hint">
            When enabled, customers can send messages to your WhatsApp Business
            number to browse the menu, add items to cart, and checkout.
          </p>
          <div class="toggle-row">
            <span>{{ enabled ? "Enabled" : "Disabled" }}</span>
            <button
              :class="['toggle', { active: enabled }]"
              @click="enabled = !enabled"
              :aria-pressed="enabled"
            >
              <span class="toggle-thumb" />
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>Ordering Hours</h3>
          <p class="settings-hint">
            Define when WhatsApp orders are accepted. Messages sent outside
            these hours will receive an auto-reply.
          </p>
          <div class="hours-grid">
            <div v-for="day in days" :key="day.key" class="hours-row">
              <label class="hours-label">
                <input
                  v-model="orderingHours[day.key].enabled"
                  type="checkbox"
                />
                {{ day.label }}
              </label>
              <div class="hours-inputs">
                <input
                  v-model="orderingHours[day.key].open"
                  type="time"
                  :disabled="!orderingHours[day.key].enabled"
                />
                <span class="hours-sep">to</span>
                <input
                  v-model="orderingHours[day.key].close"
                  type="time"
                  :disabled="!orderingHours[day.key].enabled"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <div class="card-header-row">
            <div>
              <h3>Message Templates</h3>
              <p class="settings-hint">
                Customize the WhatsApp messages customers receive. Variables use
                <code class="code-sample" v-html="'{{variableName}}'"></code>
                syntax.
              </p>
            </div>
            <router-link
              to="/admin/settings/whatsapp-preview"
              class="preview-link"
            >
              Preview Flows →
            </router-link>
          </div>

          <div class="templates-list">
            <div
              v-for="tpl in templateDefinitions"
              :key="tpl.name"
              class="template-item"
            >
              <div class="template-header">
                <span class="template-name">{{ tpl.name }}</span>
                <span class="template-category">{{ tpl.category }}</span>
              </div>
              <textarea
                v-model="templates[tpl.name]"
                class="template-textarea"
                rows="4"
              />
              <div class="template-vars">
                <span class="vars-label">Variables:</span>
                <code
                  v-for="v in tpl.variables"
                  :key="v"
                  class="var-chip"
                  v-html="'{{' + v + '}}'"
                ></code>
                <button
                  class="reset-btn"
                  @click="resetTemplate(tpl.name, tpl.body)"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-primary" :disabled="saving" @click="saveSettings">
            {{ saving ? "Saving..." : "Save Settings" }}
          </button>
          <span v-if="saved" class="saved-badge">✓ Saved</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 720px;
}

.settings-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: 24px;
  box-shadow: var(--card-shadow);
}

.settings-card h3 {
  margin: 0 0 8px;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
}

.settings-hint {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--ink-muted);
  line-height: 1.5;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle {
  position: relative;
  width: 48px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: var(--neutral-200);
  padding: 0;
  cursor: pointer;
  transition: background var(--duration-150) var(--ease-in-out);
}

.toggle.active {
  background: var(--accent);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-150) var(--ease-in-out);
}

.toggle.active .toggle-thumb {
  transform: translateX(20px);
}

.hours-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hours-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.hours-row:last-child {
  border-bottom: none;
}

.hours-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
}

.hours-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hours-inputs input {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 14px;
}

.hours-inputs input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hours-sep {
  font-size: 13px;
  color: var(--ink-muted);
}

.form-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.saved-badge {
  font-size: 14px;
  font-weight: 600;
  color: var(--earth600, #365314);
}

.btn-primary {
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.preview-link {
  color: var(--accent-600, #b45309);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.preview-link:hover {
  text-decoration: underline;
}

.templates-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.template-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 8px);
  padding: 14px;
  background: var(--surface);
}

.template-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.template-name {
  font-family: monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink, #312e2a);
}

.template-category {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--accent-600, #b45309);
  background: var(--accent-100, #fef3c7);
  padding: 2px 8px;
  border-radius: 999px;
}

.template-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 8px);
  background: white;
  color: var(--ink, #312e2a);
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
}

.template-textarea:focus {
  outline: none;
  border-color: var(--accent, #d97706);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
}

.template-vars {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.vars-label {
  font-size: 12px;
  color: var(--ink-muted, #7d766c);
}

.var-chip {
  font-family: monospace;
  font-size: 11px;
  padding: 2px 6px;
  background: var(--neutral-100, #f3f1ed);
  border-radius: 4px;
  color: var(--neutral-700, #645d54);
}

.reset-btn {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-muted, #7d766c);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.reset-btn:hover {
  color: var(--accent-600, #b45309);
}
</style>
