<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import authAPI from "@/services/authAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

const loading = ref(true);
const saving = ref(false);

const salonPaymentConfig = ref({
  currency: "GHS",
  depositRequired: false,
  defaultDepositPercent: 0,
  enabledChannels: ["card_paystack"],
});

const salonSmsFallback = ref({
  enabled: false,
});

const salonCommissionConfig = ref({
  enabled: false,
  defaultRateType: "percentage",
  defaultRateValue: 10,
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const res = await authAPI.getSettings();
    const data = res.data.settings || res.data || [];
    const map = new Map<string, string>(
      data.map((s: any) => [s.key, String(s.value ?? "")])
    );

    const paymentRaw = map.get("salon_payment_config");
    if (paymentRaw) {
      try {
        salonPaymentConfig.value = JSON.parse(paymentRaw);
      } catch {
        salonPaymentConfig.value.currency =
          map.get("salon_payment_currency") || "GHS";
      }
    }

    salonSmsFallback.value.enabled =
      map.get("salon_sms_fallback_enabled") === "true";

    const commissionRaw = map.get("salon_commission_config");
    if (commissionRaw) {
      try {
        salonCommissionConfig.value = JSON.parse(commissionRaw);
      } catch {
        salonCommissionConfig.value = {
          enabled: false,
          defaultRateType: "percentage",
          defaultRateValue: 10,
        };
      }
    }
  } catch (err) {
    logger.error("Failed to load salon settings", { error: err });
  } finally {
    loading.value = false;
  }
};

const savePayments = async () => {
  saving.value = true;
  try {
    await authAPI.updateSettings(
      "salon_payment_config",
      salonPaymentConfig.value
    );
  } catch (err) {
    logger.error("Failed to save payment settings", { error: err });
  } finally {
    saving.value = false;
  }
};

const saveSmsFallback = async () => {
  saving.value = true;
  try {
    await authAPI.updateSettings(
      "salon_sms_fallback_enabled",
      String(salonSmsFallback.value.enabled)
    );
  } catch (err) {
    logger.error("Failed to save SMS fallback settings", { error: err });
  } finally {
    saving.value = false;
  }
};

const saveCommissionSettings = async () => {
  saving.value = true;
  try {
    await authAPI.updateSettings(
      "salon_commission_config",
      salonCommissionConfig.value
    );
  } catch (err) {
    logger.error("Failed to save commission settings", { error: err });
  } finally {
    saving.value = false;
  }
};

onMounted(loadSettings);

onBeforeUnmount(() => {
  if (saving.value) {
    const ok = confirm("Settings are still saving. Leave anyway?");
    if (!ok) {
      throw new Error("Navigation cancelled");
    }
  }
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.settings") }}</h1>
        <p>
          {{ t("salon.settingsSubtitle") }}
        </p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t("salon.loadingSettings") }}</p>
      </div>

      <div v-else class="settings-stack">
        <div class="settings-card">
          <h3>{{ t("salon.payments") }}</h3>
          <div class="field">
            <label>{{ t("salon.currency") }}</label>
            <select v-model="salonPaymentConfig.currency" class="field-input">
              <option value="GHS">GHS</option>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t("salon.requireDeposit") }}</label>
            <select
              v-model="salonPaymentConfig.depositRequired"
              class="field-input"
            >
              <option :value="true">{{ t("salon.yes") }}</option>
              <option :value="false">{{ t("salon.no") }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t("salon.defaultDepositPercent") }}</label>
            <input
              v-model.number="salonPaymentConfig.defaultDepositPercent"
              class="field-input"
              type="number"
              min="0"
              max="100"
            />
          </div>
          <div class="field">
            <label>{{ t("salon.paymentChannels") }}</label>
            <p class="field-hint">{{ t("salon.selectPaymentChannels") }}</p>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :value="'mobile_money'"
                  v-model="salonPaymentConfig.enabledChannels"
                />
                {{ t("salon.mobileMoney") }}
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :value="'card_paystack'"
                  v-model="salonPaymentConfig.enabledChannels"
                />
                {{ t("salon.cardPaystack") }}
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button
              class="btn-primary"
              :disabled="saving"
              @click="savePayments"
            >
              {{ saving ? t("salon.saving") : t("salon.savePaymentSettings") }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.smsFallback") }}</h3>
          <div class="field">
            <label>{{ t("salon.enableSmsFallback") }}</label>
            <select v-model="salonSmsFallback.enabled" class="field-input">
              <option :value="true">{{ t("salon.enabled") }}</option>
              <option :value="false">{{ t("salon.disabled") }}</option>
            </select>
            <p class="field-hint">
              {{ t("salon.smsFallbackHint") }}
            </p>
          </div>
          <div class="form-actions">
            <button
              class="btn-primary"
              :disabled="saving"
              @click="saveSmsFallback"
            >
              {{ saving ? t("salon.saving") : t("salon.saveSmsSettings") }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.commissions") }}</h3>
          <div class="field">
            <label>{{ t("salon.enableCommissions") }}</label>
            <select v-model="salonCommissionConfig.enabled" class="field-input">
              <option :value="true">{{ t("salon.enabled") }}</option>
              <option :value="false">{{ t("salon.disabled") }}</option>
            </select>
            <p class="field-hint">
              {{ t("salon.commissionHint") }}
            </p>
          </div>
          <div class="field">
            <label>{{ t("salon.defaultRateType") }}</label>
            <select
              v-model="salonCommissionConfig.defaultRateType"
              class="field-input"
            >
              <option value="percentage">{{ t("salon.percentage") }}</option>
              <option value="fixed">{{ t("salon.fixedAmount") }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t("salon.defaultRateValue") }}</label>
            <input
              v-model.number="salonCommissionConfig.defaultRateValue"
              class="field-input"
              type="number"
              min="0"
            />
          </div>
          <div class="form-actions">
            <button
              class="btn-primary"
              :disabled="saving"
              @click="saveCommissionSettings"
            >
              {{
                saving ? t("salon.saving") : t("salon.saveCommissionSettings")
              }}
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
