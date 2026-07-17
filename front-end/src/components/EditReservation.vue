<script setup>
import ButtonFilled from "@/components/ButtonFilled.vue";
import TextBox from "@/components/TextBox.vue";
import SuccessMessage from "@/components/SuccessMessage.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import SaveIcon from "~icons/fluent/save-16-regular";
import PaymentIcon from "~icons/fluent/payment-16-regular";

import { ref, watch, onMounted, computed } from "vue";
import logger from "@/utils/logger";
import { getApiErrors, getApiErrorMessage } from "@/utils/apiError";
import paymentAPI from "@/services/paymentAPI";
import reservationAPI from "@/services/reservationAPI";
import getValues from "@/utils/getValues";
import { computePaymentStatus } from "@/utils/paymentStatus";
import { useCurrency } from "@/composables/useCurrency";

const { format: fmt } = useCurrency();

const props = defineProps({
  reservation: Object,
  isModal: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["onEdited"]);

logger.debug("Edit reservation opened", { reservation: props.reservation });

const reservation = ref({
  resDate: {
    textBoxType: "date",
    id: "resDate",
    labelText: "Reservation Date",
    placeholderText: "Enter reservation date...",
    value: props.reservation?.resDate,
  },
  resTime: {
    textBoxType: "time",
    id: "resTime",
    labelText: "Reservation Time",
    placeholderText: "Enter reservation time...",
    value: props.reservation?.resTime,
  },
  people: {
    textBoxType: "number",
    id: "people",
    labelText: "Number of People",
    placeholderText: "Enter the number of people...",
    value: props.reservation?.people.toString(),
  },
  expectedTotal: {
    textBoxType: "number",
    id: "expectedTotal",
    labelText: "Expected Total (GHS)",
    placeholderText: "Enter expected total amount...",
    value: props.reservation?.expectedTotal?.toString() || "0",
    step: "0.01",
  },
  paymentStatus: {
    textBoxType: "select",
    id: "paymentStatus",
    labelText: "Payment Status",
    value: props.reservation?.paymentStatus || "unpaid",
    options: [
      { label: "Unpaid", value: "unpaid" },
      { label: "Deposit", value: "deposit" },
      { label: "Partial Payment", value: "partial" },
      { label: "Full Payment", value: "paid" },
    ],
  },
});
const validationErrors = ref({});
const isSuccessful = ref(false);
const generalErrors = ref(null);

const filteredReservation = computed(() => {
  return (
    Object.values(reservation.value).filter(
      (textBox) => textBox.id !== "paymentStatus"
    ) || []
  );
});

const payments = ref([]);
const totalPaid = ref(0);

const newPayment = ref({
  amount: "",
  method: "cash",
  paidBy: "",
  reference: "",
});
const useSplits = ref(false);
const splits = ref([]);
const paymentErrors = ref({});
const paymentSuccess = ref(false);
const showDeleteConfirm = ref(false);
const deleteTargetId = ref(null);
const removeError = ref("");

const splitMethods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Transfer" },
  { value: "other", label: "Other" },
];

const groupSplitCount = ref(2);
const groupSplitPaid = ref(0);
const showGroupSplit = ref(false);

const remainingBalance = computed(() => {
  const expected = parseFloat(reservation.value.expectedTotal.value) || 0;
  return Math.max(0, expected - totalPaid.value);
});

const groupSplitAmount = computed(() => {
  if (groupSplitCount.value <= 0) return 0;
  return remainingBalance.value / groupSplitCount.value;
});

const addGroupSplitPayment = (personIndex) => {
  const amount = groupSplitAmount.value;
  if (amount <= 0) return;
  newPayment.value = {
    amount: amount.toFixed(2),
    method: "cash",
    paidBy: `Person ${personIndex + 1}`,
    reference: "",
  };
  addPayment();
};

const totalSplitAmount = computed(() => {
  return splits.value.reduce(
    (sum, split) => sum + (parseFloat(split.amount) || 0),
    0
  );
});

const addSplit = () => {
  splits.value.push({
    method: "cash",
    amount: "",
    paidBy: "",
    reference: "",
    tip: "",
  });
};

const removeSplit = (index) => {
  splits.value.splice(index, 1);
};

const toggleUseSplits = () => {
  useSplits.value = !useSplits.value;
  if (!useSplits.value) {
    splits.value = [];
  }
};

const clearPaymentForm = () => {
  newPayment.value = {
    amount: "",
    method: "cash",
    paidBy: "",
    reference: "",
  };
  useSplits.value = false;
  splits.value = [];
  paymentErrors.value = {};
};

const loadPayments = async () => {
  if (!props.reservation?.id) return;
  try {
    const res = await paymentAPI.getPayments(props.reservation.id);
    payments.value = Array.isArray(res.data.payments) ? res.data.payments : [];
    totalPaid.value = parseFloat(res.data.totalPaid) || 0;
  } catch (err) {
    logger.error("Failed to load payments", { error: err.message });
  }
};

const addPayment = async () => {
  paymentErrors.value = {};
  paymentSuccess.value = false;
  if (!props.reservation?.id) return;

  const amount = parseFloat(newPayment.value.amount);
  if (!amount || amount <= 0) {
    paymentErrors.value = { amount: "Invalid payment amount" };
    return;
  }

  if (useSplits.value) {
    const totalSplit = totalSplitAmount.value;
    if (Math.abs(totalSplit - amount) > 0.01) {
      paymentErrors.value = {
        splits: `Split amounts (${totalSplit.toFixed(
          2
        )}) must equal the payment amount (${amount.toFixed(2)}).`,
      };
      return;
    }
    if (splits.value.length === 0) {
      paymentErrors.value = { splits: "Add at least one split." };
      return;
    }
  }

  try {
    const payload = {
      amount,
      method: useSplits.value ? "split" : newPayment.value.method,
      paidBy: newPayment.value.paidBy || null,
      reference: newPayment.value.reference || null,
    };

    if (useSplits.value) {
      payload.splits = splits.value.map((split) => ({
        method: split.method || "cash",
        amount: parseFloat(split.amount || 0),
        paidBy: split.paidBy || null,
        reference: split.reference || null,
        tip: split.tip ? parseFloat(split.tip) : 0,
      }));
    }

    const res = await paymentAPI.addPayment(props.reservation.id, payload);
    payments.value = Array.isArray(res.data.payments) ? res.data.payments : [];
    totalPaid.value = res.data.totalPaid || 0;
    clearPaymentForm();
    paymentSuccess.value = true;
    setTimeout(() => (paymentSuccess.value = false), 3000);
    emit("onEdited");
  } catch (err) {
    paymentErrors.value = getApiErrors(err) || {
      amount: getApiErrorMessage(err, "Failed"),
    };
  }
};

const removePayment = async (paymentId) => {
  deleteTargetId.value = paymentId;
  removeError.value = "";
  showDeleteConfirm.value = true;
};

const confirmRemovePayment = async () => {
  if (!deleteTargetId.value) return;
  try {
    await paymentAPI.removePayment(props.reservation.id, deleteTargetId.value);
    await loadPayments();
    emit("onEdited");
  } catch (err) {
    removeError.value = getApiErrorMessage(err, "Failed to remove payment");
    return;
  } finally {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
  }
};

watch(
  () => props.reservation?.id,
  (newId) => {
    if (newId) {
      loadPayments();
      if (props.reservation) {
        reservation.value.resDate.value = props.reservation.resDate;
        reservation.value.resTime.value = props.reservation.resTime;
        reservation.value.people.value = props.reservation.people.toString();
        reservation.value.paymentStatus.value =
          props.reservation.paymentStatus || "unpaid";
        reservation.value.expectedTotal.value =
          props.reservation.expectedTotal?.toString() || "0";
      }
    }
  }
);

watch([totalPaid, () => reservation.value.expectedTotal.value], () => {
  const status = computePaymentStatus({
    totalPaid: totalPaid.value,
    expectedTotal: reservation.value.expectedTotal.value,
  });
  reservation.value.paymentStatus.value = status;
});

onMounted(() => {
  if (props.reservation?.id) loadPayments();
});

const editReservation = async () => {
  validationErrors.value = {};
  generalErrors.value = null;
  isSuccessful.value = false;
  try {
    const payload = getValues(reservation.value);
    if (payload.expectedTotal !== undefined) {
      payload.expectedTotal = parseFloat(payload.expectedTotal) || 0;
    }
    if (payload.people !== undefined) {
      payload.people = parseInt(payload.people, 10) || 1;
    }
    await reservationAPI.editReservation(props.reservation.id, payload);
    emit("onEdited");
    isSuccessful.value = true;
    logger.debug("Reservation updated", { id: props.reservation.id });
  } catch (err) {
    validationErrors.value = getApiErrors(err);
    generalErrors.value = getApiErrorMessage(err);
    logger.error("Edit reservation failed", { error: err.message });
  }
};
</script>

<template>
  <div :class="{ 'main-wrapper': !isModal }">
    <form @submit.prevent="editReservation()">
      <TextBox
        v-for="textBox in filteredReservation"
        :key="textBox.id"
        :text-box-type="textBox.textBoxType"
        :id="textBox.id"
        :label-text="textBox.labelText"
        :placeholder-text="textBox.placeholderText"
        :errors="validationErrors"
        v-model:input="textBox.value"
      />
      <div v-if="reservation.paymentStatus" class="form-group">
        <label class="form-label">{{
          reservation.paymentStatus.labelText
        }}</label>
        <select
          :id="reservation.paymentStatus.id"
          class="form-select"
          v-model="reservation.paymentStatus.value"
        >
          <option
            v-for="opt in reservation.paymentStatus.options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="payments-section">
        <div class="payments-header">
          <PaymentIcon />
          <span class="payments-title">Payments</span>
          <span class="total-paid"
            >Total paid: {{ fmt(totalPaid.toFixed(2)) }}</span
          >
        </div>

        <div v-if="payments.length" class="payments-list">
          <div v-for="pay in payments" :key="pay.id" class="payment-row">
            <div class="payment-info">
              <span class="payment-amount"
                >{{ fmt(parseFloat(pay.amount).toFixed(2)) }}</span
              >
              <span class="payment-method">{{ pay.method }}</span>
              <span v-if="pay.paidBy" class="payment-by">{{ pay.paidBy }}</span>
              <span v-if="pay.reference" class="payment-ref"
                >Ref: {{ pay.reference }}</span
              >
              <div
                v-if="pay.splits && pay.splits.length"
                class="splits-breakdown"
              >
                <span
                  v-for="(split, idx) in pay.splits"
                  :key="idx"
                  class="split-chip"
                >
                  {{ split.method }}: GHS
                  {{ parseFloat(split.amount).toFixed(2) }}
                  <span v-if="split.tip"
                    >(tip {{ fmt(parseFloat(split.tip).toFixed(2)) }})</span
                  >
                </span>
              </div>
            </div>
            <button
              class="remove-pay-btn"
              @click="removePayment(pay.id)"
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>

        <div class="group-split-section">
          <div class="group-split-header">
            <label class="form-label">Group Split</label>
            <button
              type="button"
              class="toggle-split-btn"
              @click="showGroupSplit = !showGroupSplit"
            >
              {{ showGroupSplit ? "Hide" : "Show" }}
            </button>
          </div>
          <div v-if="showGroupSplit" class="group-split-body">
            <div class="form-group inline">
              <label class="form-label">Number of People</label>
              <input
                type="number"
                min="2"
                max="20"
                class="form-select"
                v-model.number="groupSplitCount"
              />
            </div>
            <div class="split-summary-bar">
              <span
                >Expected: GHS
                {{
                  parseFloat(
                    reservation.value.expectedTotal.value || 0
                  ).toFixed(2)
                }}</span
              >
              <span>Paid: {{ fmt(totalPaid.toFixed(2)) }}</span>
              <span class="remaining"
                >Remaining: {{ fmt(remainingBalance.toFixed(2)) }}</span
              >
            </div>
            <div class="split-summary-bar">
              <span>Per person: {{ fmt(groupSplitAmount.toFixed(2)) }}</span>
              <span>{{ groupSplitCount }} people</span>
            </div>
            <div class="group-split-buttons">
              <button
                v-for="i in groupSplitCount"
                :key="i"
                type="button"
                class="split-person-btn"
                :disabled="groupSplitAmount.value <= 0"
                @click="addGroupSplitPayment(i - 1)"
              >
                Person {{ i }}: {{ fmt(groupSplitAmount.toFixed(2)) }}
              </button>
            </div>
          </div>
        </div>

        <form class="add-payment-form" @submit.prevent="addPayment">
          <div class="form-group inline">
            <label class="form-label">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              class="form-select"
              v-model="newPayment.amount"
              placeholder="0.00"
            />
          </div>
          <div v-if="!useSplits" class="form-group inline">
            <label class="form-label">Method</label>
            <select class="form-select" v-model="newPayment.method">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div v-if="!useSplits" class="form-group inline">
            <label class="form-label">Paid By</label>
            <input
              type="text"
              class="form-select"
              v-model="newPayment.paidBy"
              placeholder="Name"
            />
          </div>
          <div v-if="!useSplits" class="form-group inline">
            <label class="form-label">Reference</label>
            <input
              type="text"
              class="form-select"
              v-model="newPayment.reference"
              placeholder="Ref #"
            />
          </div>
          <div class="form-group inline checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="useSplits"
                @change="toggleUseSplits"
              />
              <span>Split payment</span>
            </label>
          </div>
          <div v-if="useSplits" class="splits-section">
            <div
              v-for="(split, index) in splits"
              :key="index"
              class="split-row"
            >
              <select class="form-select" v-model="split.method">
                <option
                  v-for="opt in splitMethods"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                class="form-select"
                v-model="split.amount"
                placeholder="0.00"
              />
              <input
                type="text"
                class="form-select"
                v-model="split.paidBy"
                placeholder="Name"
              />
              <input
                type="text"
                class="form-select"
                v-model="split.reference"
                placeholder="Ref #"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                class="form-select"
                v-model="split.tip"
                placeholder="Tip"
              />
              <button
                type="button"
                class="remove-split-btn"
                @click="removeSplit(index)"
              >
                ×
              </button>
            </div>
            <button type="button" class="add-split-btn" @click="addSplit">
              + Add Split
            </button>
            <div class="split-summary">
              <span>Total split: {{ fmt(totalSplitAmount.toFixed(2)) }}</span>
              <span v-if="newPayment.amount"
                >of {{ fmt(parseFloat(newPayment.amount).toFixed(2)) }}</span
              >
            </div>
          </div>
          <button type="submit" class="add-pay-btn">Add</button>
        </form>
      </div>
      <ErrorMessage
        :error-flag="generalErrors"
        :error-message="generalErrors"
      />
      <SuccessMessage
        class="success"
        :is-successful="isSuccessful"
        success-message="Done!"
      />
      <ButtonFilled text="Done">
        <template #icon>
          <SaveIcon />
        </template>
      </ButtonFilled>
    </form>

    <div v-if="showDeleteConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <p class="confirm-text">
          Are you sure you want to delete this payment?
        </p>
        <p v-if="removeError" class="confirm-error">{{ removeError }}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">
            Cancel
          </button>
          <button class="btn btn-danger" @click="confirmRemovePayment">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.success {
  margin-bottom: var(--space-4);
}
.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-5);
}
.form-label {
  text-align: left;
  margin-bottom: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-secondary);
  letter-spacing: var(--tracking-wide);
}
.form-select {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--ink);
  width: 100%;
  box-sizing: border-box;
  background: var(--surface);
  transition: border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out);
}
.form-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.payments-section {
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  background: linear-gradient(
    180deg,
    var(--neutral-50) 0%,
    var(--surface) 100%
  );
  box-shadow: var(--shadow-sm);
}
.payments-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.payments-title {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 650;
  flex: 1;
  color: var(--ink);
}
.total-paid {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--earth-600);
  background: var(--earth-50);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}
.payments-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.payment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  transition: all var(--duration-fast) var(--ease-in-out);
}
.payment-row:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
}
.payment-info {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
}
.payment-amount {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 650;
  color: var(--earth-600);
}
.payment-method {
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  font-weight: 600;
  text-transform: uppercase;
  background: var(--neutral-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  color: var(--ink-secondary);
}
.payment-by {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.payment-ref {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  font-family: var(--font-sans);
}
.remove-pay-btn {
  background: none;
  border: none;
  color: var(--rose-600);
  font-size: 18px;
  cursor: pointer;
  padding: 0 var(--space-2);
  line-height: 1;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-in-out);
}
.remove-pay-btn:hover {
  background: var(--rose-50);
}
.add-payment-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: flex-end;
}
.add-payment-form .form-group.inline {
  flex: 1 1 120px;
  min-width: 100px;
  margin-bottom: 0;
}
.add-pay-btn {
  background: linear-gradient(
    135deg,
    var(--earth-500) 0%,
    var(--earth-600) 100%
  );
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  height: 40px;
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-fast) var(--ease-in-out);
}
.add-pay-btn:hover {
  background: linear-gradient(
    135deg,
    var(--earth-600) 0%,
    var(--earth-700) 100%
  );
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.group-split-section {
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-5);
  background: var(--surface);
}
.group-split-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.group-split-header .form-label {
  margin: 0;
}
.toggle-split-btn {
  background: var(--neutral-100);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  color: var(--ink-secondary);
}
.group-split-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.split-summary-bar {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-secondary);
  background: var(--neutral-50);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
}
.split-summary-bar .remaining {
  color: var(--accent);
}
.group-split-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.split-person-btn {
  background: linear-gradient(
    135deg,
    var(--earth-500) 0%,
    var(--earth-600) 100%
  );
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-fast) var(--ease-in-out);
}
.split-person-btn:hover:not(:disabled) {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.split-person-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}
.confirm-box {
  background: var(--surface);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 420px;
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--border);
}
.confirm-text {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--ink);
  margin: 0 0 var(--space-5) 0;
}
.confirm-error {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--rose-600);
  margin: 0 0 var(--space-4) 0;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
.btn-danger {
  background: var(--rose-50);
  color: var(--rose-600);
  border: 1px solid var(--rose-200);
}
.btn-danger:hover {
  background: var(--rose-100);
}

@media (min-width: 640px) {
  .add-payment-form .form-group.inline {
    flex: 1 1 160px;
  }
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-family: "Inter-Medium";
  color: var(--primary-black);
  cursor: pointer;
}

.splits-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.split-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.split-row .form-select {
  flex: 1 1 120px;
  min-width: 100px;
}

.remove-split-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #fee2e2;
  color: #991b1b;
  cursor: pointer;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.add-split-btn {
  align-self: flex-start;
  padding: 8px 12px;
  border: 1px dashed var(--primary-blue);
  background: white;
  color: var(--primary-blue);
  border-radius: 8px;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
}

.split-summary {
  font-size: 13px;
  font-family: "Inter-Medium";
  color: var(--secondary-gray);
  display: flex;
  gap: 8px;
}

.splits-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.split-chip {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #dbeafe;
  color: #1e40af;
  font-family: "Inter-Medium";
}
</style>
