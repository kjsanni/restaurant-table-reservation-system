<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import orderAPI from "@/services/orderAPI";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const router = useRouter();
const route = useRoute();
const { format: fmt } = useCurrency();

const order = ref<any>(null);
const loading = ref(true);
const errorMsg = ref("");

onMounted(async () => {
  const orderId = route.params.orderId;
  if (!orderId) {
    router.push("/menu");
    return;
  }
  try {
    const res = await orderAPI.getOrder(orderId);
    if (res.data?.success && res.data?.order) {
      order.value = res.data.order;
    } else {
      errorMsg.value = "Order not found.";
    }
  } catch (err) {
    logger.error("Failed to load order", { error: err });
    errorMsg.value = "Failed to load order.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Order Confirmation</h1>
        <p>Thank you for your order</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading order…</div>
      <div v-else-if="errorMsg" class="state error">{{ errorMsg }}</div>
      <div v-else-if="order" class="confirmation">
        <div class="confirmation-header">
          <h2>Order #{{ order.id }}</h2>
          <span
            :class="[
              'pill',
              order.paymentStatus === 'paid' ? 'paid' : 'pending',
            ]"
          >
            {{ order.paymentStatus }}
          </span>
        </div>

        <div class="confirmation-section">
          <h3>Items</h3>
          <div
            v-for="(item, idx) in order.orderItems"
            :key="idx"
            class="confirm-item"
          >
            <div class="confirm-item-main">
              <b>{{ item.menuItem?.name || "Item" }}</b>
              <span>x{{ item.quantity }}</span>
            </div>
            <div
              class="confirm-item-options"
              v-if="item.selectedOptions?.length"
            >
              <span
                v-for="opt in item.selectedOptions"
                :key="opt.name"
                class="option-chip"
              >
                {{ opt.name }}
              </span>
            </div>
            <div class="confirm-item-notes" v-if="item.itemNotes">
              Note: {{ item.itemNotes }}
            </div>
            <div class="confirm-item-total">{{ fmt(item.lineTotal) }}</div>
          </div>
        </div>

        <div class="confirmation-totals">
          <div class="total-row">
            <span>Total</span><span>{{ fmt(order.total) }}</span>
          </div>
        </div>

        <div v-if="order.notes" class="confirmation-notes">
          <strong>Kitchen Notes:</strong> {{ order.notes }}
        </div>

        <div class="confirmation-actions">
          <button class="btn-primary" @click="router.push('/portal/orders')">
            My Orders
          </button>
          <button class="btn-link" @click="router.push('/menu')">
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirmation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.confirmation-header h2 {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-2xl);
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

.pill.paid {
  background: linear-gradient(135deg, var(--earth-400), var(--earth-500));
  color: white;
}

.pill.pending {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  color: white;
}

.confirmation-section {
  margin-bottom: var(--space-4);
}

.confirmation-section h3 {
  margin: 0 0 var(--space-2) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
}

.confirm-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.confirm-item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-item-main b {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}

.confirm-item-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.option-chip {
  font-size: var(--text-xs);
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-full);
  background: var(--neutral-100);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-weight: 500;
}

.confirm-item-notes {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  font-style: italic;
}

.confirm-item-total {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--ink);
  text-align: right;
}

.confirmation-totals {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}

.confirmation-notes {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.confirmation-actions {
  display: flex;
  gap: var(--space-3);
}

.btn-primary {
  padding: var(--space-2) var(--space-5);
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
