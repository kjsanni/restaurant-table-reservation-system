<template>
  <div class="whatsapp-payments-view">
    <div class="page-header">
      <div>
        <h1>{{ t("salon.whatsappPayments") }}</h1>
        <p class="subtitle">{{ t("salon.whatsappPaymentsSubtitle") }}</p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? t("salon.refreshing") : t("salon.refresh") }}
      </button>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">{{ t("salon.totalWhatsappBookings") }}</div>
        <div class="card-value">{{ summary.total }}</div>
      </div>
      <div class="card">
        <div class="card-label">{{ t("salon.paid") }}</div>
        <div class="card-value success">{{ summary.paid }}</div>
      </div>
      <div class="card">
        <div class="card-label">{{ t("salon.unpaid") }}</div>
        <div class="card-value danger">{{ summary.unpaid }}</div>
      </div>
      <div class="card">
        <div class="card-label">{{ t("salon.partialDeposit") }}</div>
        <div class="card-value warning">
          {{ summary.partial + summary.deposit }}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        {{ t("salon.noWhatsappBookings") }}
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t("salon.date") }}</th>
              <th>{{ t("salon.customer") }}</th>
              <th>{{ t("salon.service") }}</th>
              <th>{{ t("salon.amount") }}</th>
              <th>{{ t("salon.deposit") }}</th>
              <th>{{ t("salon.paymentStatus") }}</th>
              <th>{{ t("salon.ref", "Ref") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in items" :key="apt.id">
              <td>{{ formatDate(apt.start) }}</td>
              <td>
                {{ apt.customer?.firstName }} {{ apt.customer?.lastName }}
              </td>
              <td>{{ apt.service?.name }}</td>
              <td>{{ formatMoney(apt.service?.price || 0) }}</td>
              <td>{{ formatMoney(apt.depositAmount || 0) }}</td>
              <td>
                <span class="badge" :class="'badge-' + apt.paymentStatus">
                  {{ apt.paymentStatus }}
                </span>
                <button
                  v-if="canVerify(apt)"
                  class="btn-verify"
                  @click="verifyAppointment(apt)"
                >
                  {{ t("salon.verify", "Verify") }}
                </button>
                <button
                  v-if="canRefund(apt)"
                  class="btn-refund"
                  @click="refundAppointment(apt)"
                >
                  {{
                    confirmingRefund.value === apt.id
                      ? t("common.confirm", "Confirm")
                      : t("salon.refund", "Refund")
                  }}
                </button>
              </td>
              <td class="text-mono">{{ apt.paymentReference || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import appointmentAPI from "@/services/appointmentAPI";
import { useI18n } from "@/composables/useI18n";
import { useToastStore } from "@/stores/toast";

const { t } = useI18n();
const toast = useToastStore();
import formatMoney from "@/utils/formatMoney";

const loading = ref(false);
const confirmingRefund = ref(null);
const items = ref([]);

const summary = computed(() => {
  const total = items.value.length;
  const paid = items.value.filter((a) => a.paymentStatus === "paid").length;
  const unpaid = items.value.filter((a) => a.paymentStatus === "unpaid").length;
  const partial = items.value.filter(
    (a) => a.paymentStatus === "partial"
  ).length;
  const deposit = items.value.filter(
    (a) => a.paymentStatus === "deposit"
  ).length;
  return { total, paid, unpaid, partial, deposit };
});

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const load = async () => {
  loading.value = true;
  try {
    const res = await appointmentAPI.getAppointments({
      source: "whatsapp",
      limit: 200,
    });
    items.value = res.data?.data || [];
  } finally {
    loading.value = false;
  }
};

const canRefund = (apt) => {
  return (
    ["paid", "deposit", "partial"].includes(apt.paymentStatus) &&
    !apt.refundedAt
  );
};

const canVerify = (apt) => {
  return (
    ["unpaid", "deposit", "partial"].includes(apt.paymentStatus) &&
    apt.paymentReference
  );
};

const verifyAppointment = async (apt) => {
  try {
    const res = await appointmentAPI.verifyAppointmentPayment(apt.id);
    const updated = res.data?.appointment;
    if (updated) {
      apt.paymentStatus = updated.paymentStatus;
      apt.depositAmount = updated.depositAmount;
      toast.add({
        type: "success",
        title: t("salon.paymentVerified", "Payment verified"),
        message: `${updated.paymentStatus} • ${formatMoney(updated.amount || 0)} • ${updated.channel || "N/A"}`,
      });
    }
  } catch (e) {
    toast.add({
      type: "error",
      title: t("salon.verificationFailed", "Verification failed"),
      message:
        e?.response?.data?.message ||
        t("salon.verificationFailed", "Verification failed"),
    });
  }
};

const refundAppointment = async (apt) => {
  if (confirmingRefund.value !== apt.id) {
    confirmingRefund.value = apt.id;
    setTimeout(() => {
      confirmingRefund.value = null;
    }, 3000);
    return;
  }
  confirmingRefund.value = null;
  try {
    await appointmentAPI.refundAppointment(apt.id);
    await load();
  } catch (e) {
    toast.add({
      type: "error",
      title: t("salon.refundFailed", "Refund failed"),
      message:
        e?.response?.data?.message || t("salon.refundFailed", "Refund failed"),
    });
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.whatsapp-payments-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.card-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin-top: var(--space-2);
}
.card-value.success {
  color: var(--earth-600);
}
.card-value.danger {
  color: var(--rose-600);
}
.card-value.warning {
  color: var(--amber-600);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}
.text-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.badge-paid {
  background: var(--earth-100);
  color: var(--earth-700);
}
.badge-unpaid {
  background: var(--rose-100);
  color: var(--rose-700);
}
.badge-deposit,
.badge-partial {
  background: var(--amber-100);
  color: var(--amber-700);
}
.btn-verify {
  margin-left: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
}
.btn-verify:hover {
  background: var(--sky-50);
  color: var(--sky-700);
  border-color: var(--sky-200);
}

.btn-refund {
  margin-left: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
}
.btn-refund:hover {
  background: var(--rose-50);
  color: var(--rose-700);
  border-color: var(--rose-200);
}
</style>
