<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import deliveryAPI from "@/services/deliveryAPI";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const { format: fmt } = useCurrency();

const deliveries = ref<any[]>([]);
const loading = ref(true);
const syncing = ref<number | null>(null);
const cancelling = ref<number | null>(null);
const regions = ref<any[]>([]);
const showCreateModal = ref(false);
const creating = ref(false);

const form = ref({
  orderId: "",
  customerName: "",
  customerPhone: "",
  region: "",
  city: "",
  address: "",
  address2: "",
  postalCode: "",
  latitude: "",
  longitude: "",
});

const statusColors: Record<string, string> = {
  pending: "status-pending",
  received: "status-confirmed",
  warehouse_received: "status-confirmed",
  collected: "status-preparing",
  ready_for_pickup: "status-ready",
  shipped: "status-preparing",
  assigned: "status-preparing",
  in_transit: "status-preparing",
  dispatched: "status-preparing",
  confirmed: "status-confirmed",
  delivered: "status-completed",
  not_delivered: "status-cancelled",
  rescheduled: "status-pending",
  customer_hold: "status-pending",
  customer_unreachable: "status-cancelled",
  suspected_scam: "status-cancelled",
  cancelled: "status-cancelled",
};

onMounted(async () => {
  await loadDeliveries();
  await loadRegions();
});

const loadDeliveries = async () => {
  loading.value = true;
  try {
    const res = await deliveryAPI.getDeliveries();
    deliveries.value = res.data?.collection || res.data || [];
  } catch (err) {
    logger.error("Failed to load deliveries", { error: err });
  } finally {
    loading.value = false;
  }
};

const loadRegions = async () => {
  try {
    const res = await deliveryAPI.getRegions();
    regions.value = res.data?.regions || [];
  } catch (err) {
    logger.error("Failed to load regions", { error: err });
  }
};

const openCreateModal = () => {
  form.value = {
    orderId: "",
    customerName: "",
    customerPhone: "",
    region: "",
    city: "",
    address: "",
    address2: "",
    postalCode: "",
    latitude: "",
    longitude: "",
  };
  showCreateModal.value = true;
};

const createDelivery = async () => {
  creating.value = true;
  try {
    await deliveryAPI.createDelivery({
      orderId: parseInt(form.value.orderId, 10),
      deliveryAddress: {
        customerName: form.value.customerName,
        customerPhone: form.value.customerPhone,
        region: form.value.region,
        city: form.value.city,
        address: form.value.address,
        address2: form.value.address2 || undefined,
        postalCode: form.value.postalCode || undefined,
        latitude: form.value.latitude
          ? parseFloat(form.value.latitude)
          : undefined,
        longitude: form.value.longitude
          ? parseFloat(form.value.longitude)
          : undefined,
      },
    });
    showCreateModal.value = false;
    await loadDeliveries();
  } catch (err) {
    logger.error("Failed to create delivery", { error: err });
  } finally {
    creating.value = false;
  }
};

const syncDelivery = async (id: number) => {
  syncing.value = id;
  try {
    await deliveryAPI.syncDelivery(id);
    await loadDeliveries();
  } catch (err) {
    logger.error("Failed to sync delivery", { error: err });
  } finally {
    syncing.value = null;
  }
};

const cancelDelivery = async (id: number) => {
  if (!confirm("Cancel this delivery?")) return;
  cancelling.value = id;
  try {
    await deliveryAPI.cancelDelivery(id);
    await loadDeliveries();
  } catch (err) {
    logger.error("Failed to cancel delivery", { error: err });
  } finally {
    cancelling.value = null;
  }
};

const trackUrl = (trackingNumber: string) =>
  `https://public-api.shaqexpress.com/tracking/${trackingNumber}`;
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Deliveries</h1>
        <p>Manage Shaq Express deliveries</p>
      </div>
      <div class="topbar-right">
        <button class="btn-primary" @click="openCreateModal">
          <Icon icon="mdi:plus" width="18" height="18" />
          New Delivery
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading deliveries...</p>
      </div>

      <div v-else-if="!deliveries.length" class="empty-state">
        <Icon icon="mdi:truck-delivery-outline" width="48" height="48" />
        <p>No deliveries yet.</p>
      </div>

      <div v-else class="delivery-list">
        <div
          v-for="delivery in deliveries"
          :key="delivery.id"
          class="delivery-card"
        >
          <div class="delivery-header">
            <div>
              <h3>#{{ delivery.partnerRef }}</h3>
              <p class="delivery-meta">
                Order #{{ delivery.orderId }} · {{ delivery.destinationCity }},
                {{ delivery.destinationRegion }}
              </p>
            </div>
            <span
              class="status-badge"
              :class="statusColors[delivery.status] || 'status-pending'"
            >
              {{ delivery.status }}
            </span>
          </div>

          <div class="delivery-body">
            <div class="delivery-info">
              <div><strong>Customer:</strong> {{ delivery.customerName }}</div>
              <div><strong>Phone:</strong> {{ delivery.customerPhone }}</div>
              <div>
                <strong>Address:</strong> {{ delivery.destinationAddress }}
              </div>
              <div v-if="delivery.trackingNumber">
                <strong>Tracking:</strong>
                <a
                  :href="trackUrl(delivery.trackingNumber)"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ delivery.trackingNumber }}
                </a>
              </div>
              <div v-if="delivery.eta">
                <strong>ETA:</strong> {{ delivery.eta }}
              </div>
            </div>
            <div class="delivery-actions">
              <button
                class="btn-small"
                @click="syncDelivery(delivery.id)"
                :disabled="syncing === delivery.id"
              >
                {{ syncing === delivery.id ? "Syncing..." : "Sync" }}
              </button>
              <button
                class="btn-small btn-danger"
                @click="cancelDelivery(delivery.id)"
                :disabled="cancelling === delivery.id"
              >
                {{ cancelling === delivery.id ? "..." : "Cancel" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showCreateModal"
      class="modal-overlay"
      @click.self="showCreateModal = false"
    >
      <div class="modal">
        <h2>Create Delivery</h2>
        <div class="form-grid">
          <div class="field">
            <label>Order ID</label>
            <input
              v-model.number="form.orderId"
              type="number"
              placeholder="123"
            />
          </div>
          <div class="field">
            <label>Customer Name</label>
            <input v-model="form.customerName" placeholder="Kwame Mensah" />
          </div>
          <div class="field">
            <label>Customer Phone</label>
            <input v-model="form.customerPhone" placeholder="+233241234567" />
          </div>
          <div class="field">
            <label>Region</label>
            <select v-model="form.region">
              <option value="">Select region</option>
              <option
                v-for="region in regions"
                :key="region.id"
                :value="region.name"
              >
                {{ region.name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>City</label>
            <input v-model="form.city" placeholder="Accra" />
          </div>
          <div class="field">
            <label>Address</label>
            <input v-model="form.address" placeholder="123 Main Street" />
          </div>
          <div class="field">
            <label>Address 2</label>
            <input v-model="form.address2" placeholder="Apt 4B" />
          </div>
          <div class="field">
            <label>Postal Code</label>
            <input v-model="form.postalCode" placeholder="00233" />
          </div>
          <div class="field">
            <label>Latitude</label>
            <input
              v-model="form.latitude"
              type="number"
              step="0.00000001"
              placeholder="5.6037"
            />
          </div>
          <div class="field">
            <label>Longitude</label>
            <input
              v-model="form.longitude"
              type="number"
              step="0.00000001"
              placeholder="-0.1870"
            />
          </div>
        </div>
        <div class="form-actions">
          <button
            class="btn-primary"
            :disabled="creating"
            @click="createDelivery"
          >
            {{ creating ? "Creating..." : "Create Delivery" }}
          </button>
          <button class="btn-ghost" @click="showCreateModal = false">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.delivery-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.delivery-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: 20px;
  box-shadow: var(--card-shadow);
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.delivery-header h3 {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 16px;
  color: var(--ink);
}

.delivery-meta {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ink-muted);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
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

.delivery-body {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.delivery-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--ink-secondary);
}

.delivery-info a {
  color: var(--accent);
  text-decoration: none;
}

.delivery-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-small.btn-danger {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
}

.btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.modal {
  background: white;
  border-radius: var(--card-radius);
  padding: 24px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal h2 {
  margin: 0 0 16px;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 12px;
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field input,
.field select {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:focus,
.field select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.form-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--ink-secondary);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-muted);
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

@media (max-width: 768px) {
  .delivery-header {
    flex-direction: column;
  }

  .delivery-body {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
