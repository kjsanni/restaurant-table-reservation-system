<script setup lang="ts">
import { ref, onMounted } from "vue";
import orderAPI from "@/services/orderAPI";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const { format: fmt } = useCurrency();

const orders = ref<any[]>([]);
const loading = ref(true);
const filterStatus = ref("");
const filterPayment = ref("");
const paymentOrderId = ref<number | null>(null);
const paymentEmail = ref("");
const paymentAmount = ref("");
const paymentSubmitting = ref(false);

onMounted(async () => {
  await loadOrders();
});

const loadOrders = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterPayment.value) params.paymentStatus = filterPayment.value;
    const res = await orderAPI.getOrders(params);
    orders.value = res.data?.collection || res.data || [];
  } catch (err) {
    logger.error("Failed to load orders", { error: err });
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (orderId: number, status: string) => {
  try {
    await orderAPI.updateOrder(orderId, { status });
    await loadOrders();
  } catch (err) {
    logger.error("Status update failed", { error: err });
  }
};

const openPayment = (orderId: number) => {
  paymentOrderId.value = orderId;
  paymentEmail.value = "";
  paymentAmount.value = "";
};

const initializePayment = async () => {
  if (!paymentOrderId.value || !paymentEmail.value || !paymentAmount.value)
    return;
  paymentSubmitting.value = true;
  try {
    const res = await orderAPI.initializeOrderPayment(paymentOrderId.value, {
      email: paymentEmail.value,
      amount: paymentAmount.value,
    });
    if (res.data?.authorizationUrl) {
      window.open(res.data.authorizationUrl, "_blank");
    }
  } catch (err) {
    logger.error("Payment initialization failed", { error: err });
  } finally {
    paymentSubmitting.value = false;
  }
};

const cancelOrder = async (orderId: number) => {
  if (!confirm("Cancel this order?")) return;
  try {
    await orderAPI.cancelOrder(orderId);
    await loadOrders();
  } catch (err) {
    logger.error("Cancel order failed", { error: err });
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Orders</h1>
        <p>Manage kitchen orders and payments</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="filters">
        <select v-model="filterStatus" @change="loadOrders">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select v-model="filterPayment" @change="loadOrders">
          <option value="">All payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="deposit">Deposit</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div v-if="loading" class="state">Loading orders…</div>
      <div v-else-if="!orders.length" class="state">No orders found.</div>
      <div v-else class="orders-grid">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <div>
              <b>Order #{{ order.id }}</b>
              <span class="order-date">{{
                new Date(order.orderedAt).toLocaleString()
              }}</span>
            </div>
            <span :class="['pill', order.status]">{{ order.status }}</span>
          </div>
          <div class="order-customer">
            {{ order.customer?.firstName }} {{ order.customer?.lastName }}
          </div>
          <div class="order-items">
            <div
              v-for="(item, idx) in order.orderItems"
              :key="idx"
              class="order-item"
            >
              <span
                >{{ item.menuItem?.name || "Item" }} x{{ item.quantity }}</span
              >
              <span>{{ fmt(item.lineTotal) }}</span>
            </div>
          </div>
          <div class="order-footer">
            <span class="order-total">{{ fmt(order.total) }}</span>
            <span :class="['pill', order.paymentStatus]">{{
              order.paymentStatus
            }}</span>
          </div>
          <div class="order-actions">
            <button
              class="btn-small"
              @click="updateStatus(order.id, 'preparing')"
            >
              Start Preparing
            </button>
            <button class="btn-small" @click="updateStatus(order.id, 'ready')">
              Mark Ready
            </button>
            <button
              class="btn-small"
              @click="updateStatus(order.id, 'completed')"
            >
              Complete
            </button>
            <button
              class="btn-small btn-outline"
              @click="openPayment(order.id)"
            >
              Pay
            </button>
            <button class="btn-small btn-danger" @click="cancelOrder(order.id)">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="paymentOrderId"
      class="modal-backdrop"
      @click.self="paymentOrderId = null"
    >
      <div class="modal">
        <h3>Pay for Order #{{ paymentOrderId }}</h3>
        <div class="field">
          <label>Email</label>
          <input v-model="paymentEmail" placeholder="customer@example.com" />
        </div>
        <div class="field">
          <label>Amount (GHS)</label>
          <input v-model.number="paymentAmount" type="number" step="0.01" />
        </div>
        <div class="modal-actions">
          <button
            class="btn-primary"
            :disabled="paymentSubmitting"
            @click="initializePayment"
          >
            {{ paymentSubmitting ? "Opening Paystack…" : "Pay with Paystack" }}
          </button>
          <button class="btn-link" @click="paymentOrderId = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.filters select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.order-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-header b {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
}

.order-date {
  display: block;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}

.order-customer {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.order-item {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--space-2);
}

.order-total {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
}

.pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: white;
}

.pill.draft {
  background: linear-gradient(135deg, var(--neutral-400), var(--neutral-500));
}
.pill.submitted {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
}
.pill.confirmed {
  background: linear-gradient(135deg, var(--sky-400), var(--sky-500));
}
.pill.preparing {
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
}
.pill.ready {
  background: linear-gradient(135deg, var(--earth-400), var(--earth-500));
}
.pill.completed {
  background: linear-gradient(135deg, var(--neutral-400), var(--neutral-500));
}
.pill.cancelled {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
}
.pill.unpaid {
  background: var(--neutral-100);
  color: var(--ink-secondary);
}
.pill.paid {
  background: linear-gradient(135deg, var(--earth-400), var(--earth-500));
  color: white;
}
.pill.partial {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  color: white;
}
.pill.deposit {
  background: linear-gradient(135deg, var(--sky-400), var(--sky-500));
  color: white;
}
.pill.refunded {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
  color: white;
}

.order-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.btn-small {
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.btn-small:hover {
  background: var(--accent-hover);
}

.btn-small.btn-outline {
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
}

.btn-small.btn-outline:hover {
  background: var(--accent-soft);
}

.btn-small.btn-danger {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
}

.btn-small.btn-danger:hover {
  background: linear-gradient(135deg, var(--rose-500), var(--rose-600));
}

.state {
  text-align: center;
  padding: var(--space-10) var(--space-5);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--card-shadow);
}

.modal h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
}

.field {
  margin-bottom: var(--space-3);
}

.field label {
  display: block;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
  margin-bottom: var(--space-1);
}

.field input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-4);
}

.btn-primary {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-link {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--accent);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
}
</style>
