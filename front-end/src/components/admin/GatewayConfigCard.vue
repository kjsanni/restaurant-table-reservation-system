<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import adminAPI from "@/services/adminAPI";
import { useToastStore } from "@/stores/toast";

const props = withDefaults(
  defineProps<{
    tenantId: number | string;
    title: string;
    description: string;
    mode: "platform" | "own";
    gatewayType: "payment" | "delivery";
    initialPublicKey?: string;
    initialSecretKey?: string;
    initialIdentifier?: string;
    initialSecret?: string;
    webhookUrl?: string;
  }>(),
  {
    mode: "platform",
    gatewayType: "payment",
    initialPublicKey: "",
    initialSecretKey: "",
    initialIdentifier: "",
    initialSecret: "",
  }
);

const emit = defineEmits<{
  (e: "save", payload: Record<string, unknown>): void;
}>();

const toastStore = useToastStore();

const gatewayMode = ref(props.mode);
const publicKey = ref(props.initialPublicKey);
const secretKey = ref("");
const secretVisible = ref(false);
const identifier = ref(props.initialIdentifier);
const secret = ref("");
const secretVisibleShaq = ref(false);
const webhookUrlLocal = ref(props.webhookUrl || "");
const testingConnection = ref(false);
const testResult = ref<null | { success: boolean; message: string }>(null);
const saving = ref(false);

const isPayment = computed(() => props.gatewayType === "payment");
const showForm = computed(() => gatewayMode.value === "own");
const maskedWebhookUrl = computed(
  () => props.webhookUrl || `${window.location.origin}/api/v1/billing/webhook`
);

const clearPaymentSecrets = () => {
  publicKey.value = "";
  secretKey.value = "";
  secretVisible.value = false;
};

const clearDeliverySecrets = () => {
  identifier.value = "";
  secret.value = "";
  secretVisibleShaq.value = false;
};

watch(
  () => props.gatewayType,
  (newType) => {
    if (newType === "payment") {
      clearDeliverySecrets();
    } else {
      clearPaymentSecrets();
    }
  }
);

watch(gatewayMode, (newMode) => {
  if (newMode === "platform") {
    clearPaymentSecrets();
    clearDeliverySecrets();
    testResult.value = null;
  }
});

const testConnection = async () => {
  if (!publicKey.value || (!secretKey.value && isPayment.value)) return;
  if (!identifier.value || (!secret.value && !isPayment.value)) return;

  testingConnection.value = true;
  testResult.value = null;

  try {
    if (isPayment.value) {
      const res = await adminAPI.testPaystackKeys(props.tenantId, {
        publicKey: publicKey.value,
        secretKey: secretKey.value,
      });
      if (res.data.success) {
        const data = res.data.data || {};
        const masked = {
          ...data,
          balance: data.balance !== undefined ? "****" : undefined,
          account_name: data.account_name
            ? `${String(data.account_name).slice(0, 2)}****`
            : undefined,
        };
        testResult.value = {
          success: true,
          message: `Connected. Details: ${JSON.stringify(masked)}`,
        };
      } else {
        testResult.value = {
          success: false,
          message: res.data.message || "Invalid secret key",
        };
      }
    } else {
      const res = await adminAPI.testShaqExpress(props.tenantId, {
        identifier: identifier.value,
        secret: secret.value,
      });
      if (res.data.success) {
        testResult.value = {
          success: true,
          message: "Connected successfully",
        };
      } else {
        testResult.value = {
          success: false,
          message: res.data.message || "Invalid identifier or secret",
        };
      }
    }
  } catch (err: any) {
    testResult.value = {
      success: false,
      message: err.response?.data?.message || "Connection failed — try again",
    };
  } finally {
    testingConnection.value = false;
  }
};

const saveGateway = async () => {
  if (gatewayMode.value === "platform") {
    emit("save", {
      paymentGateway: props.title.includes("Payment") ? "platform" : undefined,
      deliveryGateway: props.title.includes("Delivery")
        ? "platform"
        : undefined,
    });
    toastStore.add("Gateway set to platform default", "success", 3000);
    return;
  }

  saving.value = true;
  try {
    const payload: Record<string, unknown> = {};
    if (isPayment.value) {
      payload.paymentGateway = "own";
      payload.paystackPublicKey = publicKey.value;
      if (secretKey.value) payload.paystackSecretKey = secretKey.value;
    } else {
      payload.deliveryGateway = "own";
      payload.shaqexpressIdentifier = identifier.value;
      if (secret.value) payload.shaqexpressSecret = secret.value;
      if (webhookUrlLocal.value) {
        payload.shaqexpressWebhookUrl = webhookUrlLocal.value;
      }
    }

    await adminAPI.updateGateway(props.tenantId, payload);
    toastStore.add("Gateway credentials saved successfully", "success", 4000);
    emit("save", payload);
  } catch (err: any) {
    toastStore.add(
      err.response?.data?.message || "Failed to save gateway credentials",
      "error",
      4000
    );
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="gateway-card">
    <div class="gateway-header">
      <h3>{{ title }}</h3>
      <p class="gateway-desc">{{ description }}</p>
    </div>

    <div class="mode-selector">
      <label class="mode-option">
        <input
          type="radio"
          name="gatewayMode"
          value="platform"
          v-model="gatewayMode"
        />
        <span class="mode-label">Use platform gateway</span>
        <span class="mode-hint">
          Vibespot handles all {{ isPayment ? "payments" : "deliveries" }}.
        </span>
      </label>
      <label class="mode-option">
        <input
          type="radio"
          name="gatewayMode"
          value="own"
          v-model="gatewayMode"
        />
        <span class="mode-label">Use my own gateway</span>
        <span class="mode-hint">Enter your own credentials below.</span>
      </label>
    </div>

    <div v-if="showForm" class="own-mode-form">
      <div v-if="isPayment" class="form-group">
        <label>Paystack Public Key</label>
        <input
          v-model="publicKey"
          type="text"
          placeholder="pk_..."
          class="form-input"
        />
        <small class="form-hint">Visible in your Paystack dashboard</small>
      </div>

      <div v-if="isPayment" class="form-group">
        <label>Paystack Secret Key</label>
        <div class="password-field">
          <input
            v-model="secretKey"
            :type="secretVisible ? 'text' : 'password'"
            placeholder="sk_..."
            class="form-input"
          />
          <button
            type="button"
            class="visibility-toggle"
            @click="secretVisible = !secretVisible"
          >
            <Icon
              :icon="secretVisible ? 'mdi:eye-off' : 'mdi:eye'"
              width="18"
              height="18"
            />
          </button>
        </div>
        <small class="form-hint"
          >Masked after save. Never share publicly.</small
        >
      </div>

      <div v-if="!isPayment" class="form-group">
        <label>ShaQ Express Identifier</label>
        <input
          v-model="identifier"
          type="text"
          placeholder="Your partner identifier"
          class="form-input"
        />
      </div>

      <div v-if="!isPayment" class="form-group">
        <label>ShaQ Express Secret</label>
        <div class="password-field">
          <input
            v-model="secret"
            :type="secretVisibleShaq ? 'text' : 'password'"
            placeholder="Your partner secret"
            class="form-input"
          />
          <button
            type="button"
            class="visibility-toggle"
            @click="secretVisibleShaq = !secretVisibleShaq"
          >
            <Icon
              :icon="secretVisibleShaq ? 'mdi:eye-off' : 'mdi:eye'"
              width="18"
              height="18"
            />
          </button>
        </div>
      </div>

      <div v-if="!isPayment" class="form-group">
        <label>Webhook URL (optional)</label>
        <input
          v-model="webhookUrlLocal"
          type="url"
          class="form-input"
          :placeholder="maskedWebhookUrl"
        />
        <small class="form-hint"
          >Where ShaQ Express sends delivery updates.</small
        >
      </div>

      <div
        v-if="testResult"
        class="test-result"
        :class="{ success: testResult.success, error: !testResult.success }"
      >
        <Icon
          :icon="testResult.success ? 'mdi:check-circle' : 'mdi:alert-circle'"
          width="16"
          height="16"
        />
        {{ testResult.message }}
      </div>

      <div class="gateway-actions">
        <button
          class="btn-outline"
          :disabled="testingConnection"
          @click="testConnection"
        >
          <span v-if="testingConnection">Testing…</span>
          <span v-else>Test Connection</span>
        </button>
        <button class="btn-primary" :disabled="saving" @click="saveGateway">
          <span v-if="saving">Saving…</span>
          <span v-else>Save Gateway</span>
        </button>
      </div>
    </div>

    <div v-else class="platform-mode-badge">
      <span class="badge">Using platform gateway</span>
    </div>
  </div>
</template>

<style scoped>
.gateway-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border-subtle, #e7e4de);
  border-radius: var(--radius-xl, 12px);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.gateway-header h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  color: var(--ink, #1a1410);
}
.gateway-desc {
  margin: 0 0 1rem;
  color: var(--ink-muted, #645d54);
  font-size: 0.9rem;
}
.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.mode-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid var(--border-subtle, #e7e4de);
  border-radius: 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-option:hover {
  border-color: var(--accent-500, #d97706);
  background: var(--accent-50, #fffbeb);
}
.mode-option input[type="radio"] {
  margin-top: 0.1rem;
  accent-color: var(--accent-500, #d97706);
}
.mode-label {
  font-weight: 600;
  color: var(--ink, #1a1410);
}
.mode-hint {
  display: block;
  font-size: 0.8rem;
  color: var(--ink-subtle, #9a9389);
  margin-top: 0.15rem;
}
.own-mode-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-secondary, #312e2a);
}
.form-input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-subtle, #e7e4de);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--surface, #fff);
  color: var(--ink, #1a1410);
  outline: none;
  transition: border-color 0.2s;
}
.form-input:focus {
  border-color: var(--accent-500, #d97706);
}
.form-hint {
  font-size: 0.78rem;
  color: var(--ink-subtle, #9a9389);
}
.password-field {
  position: relative;
  display: flex;
  align-items: center;
}
.password-field .form-input {
  padding-right: 2.5rem;
}
.visibility-toggle {
  position: absolute;
  right: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--ink-subtle, #9a9389);
  padding: 0.2rem;
}
.test-result {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 500;
}
.test-result.success {
  background: var(--earth-50, #ecfdf5);
  color: var(--earth-600, #059669);
  border: 1px solid var(--earth-200, #a7f3d0);
}
.test-result.error {
  background: var(--rose-50, #fff5f5);
  color: var(--rose-600, #e11d48);
  border: 1px solid var(--rose-200, #fecaca);
}
.gateway-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.btn-outline {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-subtle, #e7e4de);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--ink-secondary, #312e2a);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover {
  background: var(--neutral-100, #f5f5f5);
}
.btn-outline:disabled,
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--brand-600, #1a1410);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--brand-700, #111);
}
.platform-mode-badge {
  margin-top: 0.5rem;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--earth-100, #dcfce7);
  color: var(--earth-700, #166534);
}
</style>
