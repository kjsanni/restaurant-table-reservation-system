<script setup lang="ts">
import { ref, onMounted } from "vue";
import orderAPI from "@/services/orderAPI";
import { useAuthStore } from "@/stores/auth";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const authStore = useAuthStore();
const { format: fmt } = useCurrency();

const orders = ref<any[]>([]);
const loading = ref(true);
const errorMsg = ref("");

onMounted(async () => {
  loading.value = true;
  try {
    const customerId = authStore.user?.id;
    if (!customerId) {
      errorMsg.value = "Please log in to view orders.";
      return;
    }
    const res = await orderAPI.getCustomerOrders(customerId);
    if (res.data?.success) {
      orders.value = res.data.orders || [];
    }
  } catch (err) {
    logger.error("Failed to load orders", { error: err });
    errorMsg.value = "Failed to load orders.";
  } finally {
    loading.value = false;
  }
});

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[s] || s;
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>My Orders</h1>
        <p>Track and review your orders</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading orders…</div>
      <div v-else-if="errorMsg" class="state error">{{ errorMsg }}</div>
      <div v-else-if="!orders.length" class="state">No orders yet.</div>
      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <div>
              <b>Order #{{ order.id }}</b>
              <span class="order-date">{{
                new Date(order.orderedAt).toLocaleString()
              }}</span>
            </div>
            <span
              :class="[
                'pill',
                order.status === 'cancelled' ? 'cancelled' : 'active',
              ]"
            >
              {{ statusLabel(order.status) }}
            </span>
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
            <span class="order-total">Total: {{ fmt(order.total) }}</span>
            <span
              :class="[
                'pill',
                order.paymentStatus === 'paid' ? 'paid' : 'pending',
              ]"
            >
              {{ order.paymentStatus }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-list {
  display: flex;
  flex-direction: column;
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
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-0-5) var(--space-2);
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.pill.active {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  color: white;
}

.pill.cancelled {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
  color: white;
}

.pill.paid {
  background: linear-gradient(135deg, var(--earth-400), var(--earth-500));
  color: white;
}

.pill.pending {
  background: var(--neutral-100);
  color: var(--ink-secondary);
}

.state {
  text-align: center;
  padding: var(--space-10) var(--space-5);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.state.error {
  color: var(--rose-600);
}
</style>
