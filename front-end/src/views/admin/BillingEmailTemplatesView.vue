<template>
  <div class="billing-emails">
    <div class="page-header">
      <div>
        <h1>Billing Email Templates</h1>
        <p class="subtitle">
          Send payment reminders, suspension notices, and trial expiry warnings
        </p>
      </div>
    </div>

    <div class="cards-grid">
      <div class="email-card">
        <div class="card-header">
          <div class="card-icon">💳</div>
          <div>
            <h2>Payment Reminder</h2>
            <p class="card-desc">
              Notify tenants of upcoming or overdue payments
            </p>
          </div>
        </div>
        <div class="card-body">
          <label class="checkbox-label">
            <input type="checkbox" v-model="allTenants.paymentReminder" />
            <span>Send to all tenants</span>
          </label>
          <select
            v-if="!allTenants.paymentReminder"
            v-model="selectedTenants.paymentReminder"
            multiple
            class="tenant-select"
          >
            <option
              v-for="tenant in tenants"
              :key="tenant.id"
              :value="tenant.id"
            >
              {{ tenant.name }}
            </option>
          </select>
          <button
            @click="sendEmail('paymentReminder')"
            class="btn-send"
            :disabled="!canSend('paymentReminder') || sending.paymentReminder"
          >
            {{
              sending.paymentReminder ? "Sending..." : "Send Payment Reminder"
            }}
          </button>
          <div
            v-if="results.paymentReminder"
            class="result"
            :class="resultClass(results.paymentReminder)"
          >
            {{ results.paymentReminder }}
          </div>
        </div>
      </div>

      <div class="email-card">
        <div class="card-header">
          <div class="card-icon">⏸️</div>
          <div>
            <h2>Suspension Notice</h2>
            <p class="card-desc">
              Alert tenants about service suspension due to non-payment
            </p>
          </div>
        </div>
        <div class="card-body">
          <label class="checkbox-label">
            <input type="checkbox" v-model="allTenants.suspensionNotice" />
            <span>Send to all tenants</span>
          </label>
          <select
            v-if="!allTenants.suspensionNotice"
            v-model="selectedTenants.suspensionNotice"
            multiple
            class="tenant-select"
          >
            <option
              v-for="tenant in tenants"
              :key="tenant.id"
              :value="tenant.id"
            >
              {{ tenant.name }}
            </option>
          </select>
          <button
            @click="sendEmail('suspensionNotice')"
            class="btn-send"
            :disabled="!canSend('suspensionNotice') || sending.suspensionNotice"
          >
            {{
              sending.suspensionNotice ? "Sending..." : "Send Suspension Notice"
            }}
          </button>
          <div
            v-if="results.suspensionNotice"
            class="result"
            :class="resultClass(results.suspensionNotice)"
          >
            {{ results.suspensionNotice }}
          </div>
        </div>
      </div>

      <div class="email-card">
        <div class="card-header">
          <div class="card-icon">⏳</div>
          <div>
            <h2>Trial Expiry</h2>
            <p class="card-desc">
              Warn tenants that their trial period is ending soon
            </p>
          </div>
        </div>
        <div class="card-body">
          <label class="checkbox-label">
            <input type="checkbox" v-model="allTenants.trialExpiry" />
            <span>Send to all tenants</span>
          </label>
          <select
            v-if="!allTenants.trialExpiry"
            v-model="selectedTenants.trialExpiry"
            multiple
            class="tenant-select"
          >
            <option
              v-for="tenant in tenants"
              :key="tenant.id"
              :value="tenant.id"
            >
              {{ tenant.name }}
            </option>
          </select>
          <button
            @click="sendEmail('trialExpiry')"
            class="btn-send"
            :disabled="!canSend('trialExpiry') || sending.trialExpiry"
          >
            {{
              sending.trialExpiry ? "Sending..." : "Send Trial Expiry Notice"
            }}
          </button>
          <div
            v-if="results.trialExpiry"
            class="result"
            :class="resultClass(results.trialExpiry)"
          >
            {{ results.trialExpiry }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import billingEmailAPI from "@/services/billingEmailAPI";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const tenants = ref([]);

const allTenants = ref({
  paymentReminder: true,
  suspensionNotice: true,
  trialExpiry: true,
});

const selectedTenants = ref({
  paymentReminder: [],
  suspensionNotice: [],
  trialExpiry: [],
});

const sending = ref({
  paymentReminder: false,
  suspensionNotice: false,
  trialExpiry: false,
});

const results = ref({
  paymentReminder: null,
  suspensionNotice: null,
  trialExpiry: null,
});

const loadTenants = async () => {
  try {
    const response = await tenantAdminAPI.getAll();
    tenants.value = response.data.collection || [];
  } catch {
    tenants.value = [];
  }
};

const canSend = (type) => {
  if (allTenants.value[type]) return true;
  return selectedTenants.value[type] && selectedTenants.value[type].length > 0;
};

const sendEmail = async (type) => {
  sending.value[type] = true;
  results.value[type] = null;
  try {
    const tenantIds = allTenants.value[type] ? [] : selectedTenants.value[type];
    let response;
    switch (type) {
      case "paymentReminder":
        response = await billingEmailAPI.sendPaymentReminder(tenantIds);
        break;
      case "suspensionNotice":
        response = await billingEmailAPI.sendSuspensionNotice(tenantIds);
        break;
      case "trialExpiry":
        response = await billingEmailAPI.sendTrialExpiry(tenantIds);
        break;
    }
    const count = response.data?.sentCount || response.data?.count || 0;
    results.value[type] = `Sent to ${count} tenant${count !== 1 ? "s" : ""}`;
  } catch (err) {
    results.value[type] = err.response?.data?.message || "Failed to send email";
  } finally {
    sending.value[type] = false;
  }
};

const resultClass = (msg) => {
  if (!msg) return "";
  if (msg.startsWith("Failed")) return "error";
  return "success";
};

onMounted(() => {
  loadTenants();
});
</script>

<style scoped>
.billing-emails {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-5);
}
.email-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}
.card-icon {
  font-size: 24px;
  line-height: 1;
  margin-top: 2px;
}
.card-header h2 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  margin: 0 0 var(--space-1) 0;
  color: var(--ink);
}
.card-desc {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
.card-body {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--ink);
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}
.tenant-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  min-height: 100px;
}
.tenant-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.btn-send {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
  font-family: var(--font-sans);
}
.btn-send:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
  box-shadow: var(--shadow-md);
}
.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.result {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
}
.result.success {
  background: var(--earth-100);
  color: var(--earth-600);
}
.result.error {
  background: var(--rose-100);
  color: var(--rose-600);
}
</style>
