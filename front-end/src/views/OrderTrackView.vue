<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import orderAPI from "@/services/orderAPI";
import logger from "@/utils/logger";

const route = useRoute();
const router = useRouter();

const orderId = ref<number | null>(null);
const order = ref<any | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  const id = route.params.orderId;
  if (!id) {
    error.value = "Order ID is required.";
    loading.value = false;
    return;
  }

  orderId.value = Number(id);
  await loadOrder();
});

const loadOrder = async () => {
  loading.value = true;
  error.value = null;

  try {
    const res = await orderAPI.trackOrder(orderId.value);
    if (!res.data?.success || !res.data?.order) {
      error.value = "Order not found.";
      return;
    }

    order.value = res.data.order;
  } catch (err) {
    logger.error("Failed to track order", { error: err });
    error.value = "Unable to load order details.";
  } finally {
    loading.value = false;
  }
};

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: "status-pending",
    confirmed: "status-confirmed",
    preparing: "status-preparing",
    ready: "status-ready",
    completed: "status-completed",
    cancelled: "status-cancelled",
  };
  return map[status] || "status-pending";
};

const paymentBadge = (status: string) => {
  const map: Record<string, string> = {
    unpaid: "payment-unpaid",
    deposit: "payment-deposit",
    partial: "payment-partial",
    paid: "payment-paid",
    refunded: "payment-refunded",
  };
  return map[status] || "payment-unpaid";
};
</script>

<template>
  <div class="track-root">
    <header class="track-header">
      <div class="track-header-inner">
        <button class="back-btn" @click="router.push('/')">
          <Icon icon="mdi:arrow-left" width="20" height="20" />
        </button>
        <h1>Order Tracking</h1>
      </div>
    </header>

    <main class="track-content">
      <div v-if="loading" class="state">
        <div class="spinner" />
        <p>Loading order…</p>
      </div>

      <div v-else-if="error" class="state error">
        <Icon icon="mdi:alert-circle-outline" width="40" height="40" />
        <p>{{ error }}</p>
        <button class="btn-primary" @click="router.push('/')">Go Home</button>
      </div>

      <div v-else-if="order" class="order-card">
        <div class="order-header">
          <div>
            <h2>Order #{{ order.id }}</h2>
            <p class="order-date">
              {{ new Date(order.createdAt).toLocaleString() }}
            </p>
          </div>
          <span class="status-badge" :class="statusColor(order.status)">
            {{ order.status }}
          </span>
        </div>

        <div class="order-section">
          <h3>Items</h3>
          <div class="items-list">
            <div
              v-for="item in order.items"
              :key="item.menuItemId || item.name"
              class="item-row"
            >
              <span class="item-name">{{ item.name }}</span>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <div class="payment-badge" :class="paymentBadge(order.paymentStatus)">
            {{ order.paymentStatus }}
          </div>
          <button
            v-if="order.status !== 'cancelled' && order.status !== 'completed'"
            class="btn-primary"
            @click="router.push('/menu')"
          >
            Order More
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.track-root {
  min-height: 100vh;
  background: var(--background-warm);
  color: var(--ink);
  font-family: var(--font-sans);
}

.track-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.track-header-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.2s ease;
}

.back-btn:hover {
  background: var(--neutral-100);
}

.track-header h1 {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
}

.track-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-muted);
}

.state.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.order-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: 24px;
  box-shadow: var(--card-shadow);
  animation: fadeInUp 0.4s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.order-header h2 {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 20px;
  color: var(--ink);
}

.order-date {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ink-muted);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.status-pending {
  background: var(--amber-50);
  color: var(--amber-700);
  border: 1px solid var(--amber-200);
}

.status-confirmed {
  background: var(--primary-50);
  color: var(--primary-700);
  border: 1px solid var(--primary-200);
}

.status-preparing {
  background: #eef2ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

.status-ready {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-completed {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.status-cancelled {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
}

.order-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}

.order-section h3 {
  margin: 0 0 12px;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 14px;
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border);
}

.item-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
}

.item-qty {
  font-size: 13px;
  color: var(--ink-muted);
  font-weight: 600;
}

.order-footer {
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.payment-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.payment-unpaid {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
}

.payment-deposit,
.payment-partial {
  background: var(--amber-50);
  color: var(--amber-700);
  border: 1px solid var(--amber-200);
}

.payment-paid {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.payment-refunded {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-primary {
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

@media (max-width: 480px) {
  .order-header {
    flex-direction: column;
  }

  .order-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
