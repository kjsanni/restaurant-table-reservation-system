<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { getApiErrors, getApiErrorMessage } from "@/utils/apiError";
import paymentAPI from "@/services/paymentAPI";
import reservationAPI from "@/services/reservationAPI";
import getValues from "@/utils/getValues";

const props = defineProps({
  reservation: Object,
  isModal: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["onEdited"]);

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
const paymentErrors = ref({});
const paymentSuccess = ref(false);
const showDeleteConfirm = ref(false);
const deleteTargetId = ref(null);
const removeError = ref("");

const loadPayments = async () => {
  if (!props.reservation?.id) return;
  try {
    const res = await paymentAPI.getPayments(props.reservation.id);
    payments.value = Array.isArray(res.data.payments) ? res.data.payments : [];
    totalPaid.value = res.data.totalPaid || 0;
  } catch {
    // Payment load failed, table will be empty
  }
};

const addPayment = async () => {
  paymentErrors.value = {};
  paymentSuccess.value = false;
  if (!props.reservation?.id) return;
  try {
    const res = await paymentAPI.addPayment(props.reservation.id, {
      amount: newPayment.value.amount,
      method: newPayment.value.method,
      paidBy: newPayment.value.paidBy || null,
      reference: newPayment.value.reference || null,
    });
    payments.value = Array.isArray(res.data.payments) ? res.data.payments : [];
    totalPaid.value = res.data.totalPaid || 0;
    newPayment.value = {
      amount: "",
      method: "cash",
      paidBy: "",
      reference: "",
    };
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

onMounted(() => {
  if (props.reservation?.id) loadPayments();
});

const editReservation = async () => {
  validationErrors.value = {};
  generalErrors.value = null;
  isSuccessful.value = false;
  try {
    await reservationAPI.editReservation(
      props.reservation.id,
      getValues(reservation.value)
    );
    emit("onEdited");
    isSuccessful.value = true;
  } catch (err) {
    validationErrors.value = getApiErrors(err);
    generalErrors.value = getApiErrorMessage(err);
  }
};
</script>

<template>
  <div :class="{ 'main-wrapper': !isModal }">
    <VaForm @submit="editReservation()">
      <div
        v-for="textBox in filteredReservation"
        :key="textBox.id"
        class="form-group"
      >
        <VaInput
          :type="textBox.textBoxType"
          :id="textBox.id"
          :label="textBox.labelText"
          :placeholder="textBox.placeholderText"
          v-model="textBox.value"
        />
      </div>
      <div v-if="reservation.paymentStatus" class="form-group">
        <label class="form-label">{{
          reservation.paymentStatus.labelText
        }}</label>
        <VaSelect
          :id="reservation.paymentStatus.id"
          v-model="reservation.paymentStatus.value"
          :options="reservation.paymentStatus.options"
        />
      </div>

      <div class="payments-section">
        <div class="payments-header">
          <span class="payments-title">Payments</span>
          <span class="total-paid"
            >Total paid: GHS {{ totalPaid.toFixed(2) }}</span
          >
        </div>

        <div v-if="payments.length" class="payments-list">
          <div v-for="pay in payments" :key="pay.id" class="payment-row">
            <div class="payment-info">
              <span class="payment-amount"
                >GHS {{ parseFloat(pay.amount).toFixed(2) }}</span
              >
              <span class="payment-method">{{ pay.method }}</span>
              <span v-if="pay.paidBy" class="payment-by">{{ pay.paidBy }}</span>
              <span v-if="pay.reference" class="payment-ref"
                >Ref: {{ pay.reference }}</span
              >
            </div>
            <VaButton
              icon="close"
              preset="danger"
              @click="removePayment(pay.id)"
              title="Remove"
            />
          </div>
        </div>

        <div class="add-payment-form">
          <div class="form-group inline">
            <label class="form-label">Amount</label>
            <VaInput
              type="number"
              step="0.01"
              min="0.01"
              v-model="newPayment.amount"
              placeholder="0.00"
            />
          </div>
          <div class="form-group inline">
            <label class="form-label">Method</label>
            <VaSelect
              v-model="newPayment.method"
              :options="[
                { label: 'Cash', value: 'cash' },
                { label: 'Card', value: 'card' },
                { label: 'Transfer', value: 'transfer' },
                { label: 'Other', value: 'other' },
              ]"
            />
          </div>
          <div class="form-group inline">
            <label class="form-label">Paid By</label>
            <VaInput v-model="newPayment.paidBy" placeholder="Name" />
          </div>
          <div class="form-group inline">
            <label class="form-label">Reference</label>
            <VaInput v-model="newPayment.reference" placeholder="Ref #" />
          </div>
          <VaButton preset="success" @click="addPayment">Add</VaButton>
        </div>
      </div>
      <VaAlert v-if="generalErrors" color="danger">{{ generalErrors }}</VaAlert>
      <VaAlert v-if="isSuccessful" color="success">Done!</VaAlert>
      <VaButton preset="primary" @click="editReservation">Done</VaButton>
    </VaForm>

    <VaModal v-model="showDeleteConfirm" title="Confirm" size="small">
      <VaCard>
        <VaCardContent>
          <p class="confirm-text">
            Are you sure you want to delete this payment?
          </p>
          <VaAlert v-if="removeError" color="danger">{{ removeError }}</VaAlert>
        </VaCardContent>
        <template #actions>
          <VaButton preset="secondary" @click="showDeleteConfirm = false"
            >Cancel</VaButton
          >
          <VaButton preset="danger" @click="confirmRemovePayment"
            >Delete</VaButton
          >
        </template>
      </VaCard>
    </VaModal>
  </div>
</template>

<style scoped>
.success {
  margin-bottom: 20px;
}
.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.form-label {
  text-align: left;
  margin-bottom: 5px;
  font-family: "Inter-Medium";
  font-size: 14px;
}
.form-select {
  padding: 10px;
  border: 1px solid var(--lighter-gray);
  border-radius: 6px;
  font-size: 14px;
  font-family: "Inter-Light";
  width: 100%;
  box-sizing: border-box;
  background-color: white;
}

.payments-section {
  width: 100%;
  border: 1px solid var(--lighter-gray);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 15px;
  background: #fefefe;
}
.payments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.payments-title {
  font-family: "Inter-Bold";
  font-size: 15px;
  flex: 1;
}
.total-paid {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: #16a34a;
}
.payments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.payment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  padding: 8px 12px;
}
.payment-info {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.payment-amount {
  font-family: "Inter-Bold";
  font-size: 14px;
  color: #16a34a;
}
.payment-method {
  font-size: 12px;
  font-family: "Inter-Medium";
  text-transform: uppercase;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 6px;
}
.payment-by {
  font-size: 12px;
  color: var(--secondary-gray);
}
.payment-ref {
  font-size: 11px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}
.remove-pay-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.add-payment-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.add-payment-form .form-group.inline {
  flex: 1 1 120px;
  min-width: 100px;
  margin-bottom: 0;
}
.add-pay-btn {
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  height: 40px;
}
.add-pay-btn:hover {
  background: #15803d;
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-box {
  background-color: white;
  padding: 24px;
  border-radius: 14px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.confirm-text {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
  margin: 0 0 20px 0;
}

.confirm-error {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-red);
  margin: 0 0 16px 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-danger {
  background-color: var(--primary-red);
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}
</style>
