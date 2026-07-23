<script setup lang="ts">
import { ref, onMounted } from "vue";
import authAPI from "@/services/authAPI";
import logger from "@/utils/logger";

const loading = ref(true);
const saving = ref(false);

const salonWhatsAppConfig = ref({
  enabled: false,
  phoneNumberId: "",
  token: "",
});

const salonPaymentConfig = ref({
  currency: "GHS",
  depositRequired: false,
  defaultDepositPercent: 0,
});

const salonSmsFallback = ref({
  enabled: false,
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const res = await authAPI.getSettings();
    const data = res.data.settings || res.data || [];
    const map = new Map<string, string>(
      data.map((s: any) => [s.key, String(s.value ?? "")])
    );

    const waRaw = map.get("salon_whatsapp_config");
    if (waRaw) {
      try {
        const parsed = JSON.parse(waRaw);
        salonWhatsAppConfig.value = {
          enabled: parsed.enabled ?? false,
          phoneNumberId: parsed.phoneNumberId || "",
          token: parsed.token || "",
        };
      } catch {
        salonWhatsAppConfig.value.enabled = waRaw === "true";
      }
    }

    const paymentRaw = map.get("salon_payment_config");
    if (paymentRaw) {
      try {
        salonPaymentConfig.value = JSON.parse(paymentRaw);
      } catch {
        salonPaymentConfig.value.currency = map.get("salon_payment_currency") || "GHS";
      }
    }

    salonSmsFallback.value.enabled = map.get("salon_sms_fallback_enabled") === "true";
  } catch (err) {
    logger.error("Failed to load salon settings", { error: err });
  } finally {
    loading.value = false;
  }
};

const saveWhatsApp = async () => {
  saving.value = true;
  try {
    await authAPI.updateSettings("salon_whatsapp_config", salonWhatsAppConfig.value);
  } catch (err) {
    logger.error("Failed to save WhatsApp settings", { error: err });
  } finally {
    saving.value = false;
  }
};

const savePayments = async () => {
  saving.value = true;
  try {
    await authAPI.updateSettings("salon_payment_config", salonPaymentConfig.value);
  } catch (err) {
    logger.error("Failed to save payment settings", { error: err });
  } finally {
    saving.value = false;
  }
};

const saveSmsFallback = async () => {
  saving.value = true;
  try {
    await authAPI.updateSettings("salon_sms_fallback_enabled", String(salonSmsFallback.value.enabled));
  } catch (err) {
    logger.error("Failed to save SMS fallback settings", { error: err });
  } finally {
    saving.value = false;
  }
};

onMounted(loadSettings);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Salon Settings</h1>
        <p>Manage WhatsApp, payment, and notification behavior for salon appointments</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading settings...</p>
      </div>

      <div v-else class="settings-stack">
        <div class="settings-card">
          <h3>WhatsApp Booking</h3>
          <div class="field">
            <label>Enable WhatsApp booking</label>
            <select v-model="salonWhatsAppConfig.enabled" class="field-input">
              <option :value="true">Enabled</option>
              <option :value="false">Disabled</option>
            </select>
          </div>
          <div class="field">
            <label>Phone Number ID</label>
            <input v-model="salonWhatsAppConfig.phoneNumberId" class="field-input" />
          </div>
          <div class="field">
            <label>WhatsApp Token</label>
            <input v-model="salonWhatsAppConfig.token" class="field-input" type="password" />
          </div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="saving" @click="saveWhatsApp">
              {{ saving ? "Saving..." : "Save WhatsApp Settings" }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>Payments</h3>
          <div class="field">
            <label>Currency</label>
            <select v-model="salonPaymentConfig.currency" class="field-input">
              <option value="GHS">GHS</option>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div class="field">
            <label>Require deposit</label>
            <select v-model="salonPaymentConfig.depositRequired" class="field-input">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
          <div class="field">
            <label>Default deposit percent</label>
            <input v-model.number="salonPaymentConfig.defaultDepositPercent" class="field-input" type="number" min="0" max="100" />
          </div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="saving" @click="savePayments">
              {{ saving ? "Saving..." : "Save Payment Settings" }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>SMS Fallback</h3>
          <div class="field">
            <label>Enable SMS fallback after WhatsApp failures</label>
            <select v-model="salonSmsFallback.enabled" class="field-input">
              <option :value="true">Enabled</option>
              <option :value="false">Disabled</option>
            </select>
            <p class="field-hint">
              Automatically send an SMS if WhatsApp delivery fails twice or more.
            </p>
          </div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="saving" @click="saveSmsFallback">
              {{ saving ? "Saving..." : "Save SMS Settings" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}
.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}
.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 760px;
}
.settings-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.settings-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.field-input {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  width: 100%;
}
.field-hint {
  font-size: 12px;
  color: var(--neutral-600);
  margin-top: 4px;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}
</style>
