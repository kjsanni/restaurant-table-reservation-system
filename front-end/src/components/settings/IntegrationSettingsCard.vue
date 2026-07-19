<script setup lang="ts">
import { ref } from "vue";
import { VaSwitch } from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import logger from "@/utils/logger";

const props = defineProps<{
  data: { key: string; value: any }[];
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();

const integrationSaving = ref(false);
const integrationSaved = ref(false);
const integrationConfig = ref({
  whatsapp: { enabled: false, token: "", phoneNumberId: "" },
  channels: { email: true, whatsapp: false },
  paystack: { mode: "test", secretKey: "", webhookSecret: "" },
  tenantMode: false,
});

const load = () => {
  const get = (key: string, fallback: any) => {
    const s = props.data.find((d) => d.key === key);
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

const saveIntegration = async (key: string, value: any) => {
  try {
    await authStore.updateSettings(key, value);
    toastStore.add("Setting saved", "success");
  } catch (e: any) {
    toastStore.add(
      e?.response?.data?.message || "Failed to save setting",
      "error"
    );
    logger.error("Failed to save integration setting", { error: e?.message });
  }
};

load();
</script>

<template>
  <div class="settings-card integrations-card">
    <h2 class="category-title">Integrations</h2>

    <section class="integration-section">
      <h3 class="integration-title">Multi-Tenant Mode</h3>
      <div class="setting-row">
        <div class="setting-info">
          <label class="setting-label">Enable SaaS Multi-Tenancy</label>
          <p class="setting-description">
            When enabled (and the server runs with TENANT_MODE=enabled), the
            platform supports multiple restaurants with isolated data.
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
          <input v-model="integrationConfig.whatsapp.enabled" type="checkbox" />
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
          <input v-model="integrationConfig.channels.email" type="checkbox" />
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
          <select v-model="integrationConfig.paystack.mode" class="field-input">
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
</template>
