<script setup>
import { computed } from "vue";
import ButtonAction from "@/components/ButtonAction.vue";
import NotFoundResource from "@/components/NotFoundResource.vue";
import { getPaymentStatusLabel, getPaymentStatusColor } from "@/constants";
import { useAuthStore } from "@/stores/auth";

defineProps({
  fields: Object,
  collection: Array,
});

const emit = defineEmits(["onSelectedReservation"]);

const authStore = useAuthStore();
const canManageTables = computed(
  () => authStore.user?.permissions?.manage_tables === true
);
const canEditReservations = computed(
  () => authStore.user?.permissions?.edit_reservations === true
);

const getFieldValue = (item, fieldKey) => {
  const val = item[fieldKey];
  if (fieldKey === "resStatus" || fieldKey === "paymentStatus") {
    return val ? val.toUpperCase() : "";
  }
  return val || "";
};
</script>

<template>
  <div class="table-view-container">
    <div v-if="collection.length === 0" class="empty-state">
      <NotFoundResource text="No Reservations" position="relative" />
    </div>
    <div v-else class="reservations-grid">
      <div v-for="item in collection" :key="item.id" class="res-card">
        <div class="res-header">
          <div class="res-avatar">
            {{ (item.name || "G")[0]?.toUpperCase() }}
          </div>
          <div class="res-info">
            <span class="res-name">{{ item.name || "Guest" }}</span>
            <span class="res-id">#{{ item.id }}</span>
          </div>
          <span class="status-chip" :class="item.resStatus">
            {{ getFieldValue(item, "resStatus") }}
          </span>
        </div>

        <div class="res-details">
          <div
            class="detail-row"
            v-for="fieldKey in Object.keys(fields)"
            :key="fieldKey"
          >
            <span class="detail-label">{{ fields[fieldKey] }}</span>
            <span class="detail-value">{{
              getFieldValue(item, fieldKey)
            }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment</span>
            <span
              class="payment-chip"
              :style="{
                backgroundColor: getPaymentStatusColor(item.paymentStatus),
              }"
            >
              {{ getPaymentStatusLabel(item.paymentStatus) }}
            </span>
          </div>
          <div class="detail-row" v-if="item.visitCount || item.tags?.length">
            <span class="detail-label">Customer</span>
            <div class="loyalty-info">
              <span v-if="item.visitCount" class="visit-count">
                {{ item.visitCount }} visits
              </span>
              <div v-if="item.tags?.length" class="tag-chips">
                <span v-for="tag in item.tags" :key="tag" class="loyalty-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="res-actions"
          v-if="['pending', 'missed'].includes(item.resStatus)"
        >
          <ButtonAction
            text="Seat"
            color="#22c55e"
            @click="
              emit('onSelectedReservation', { ...item, action: 'choose-table' })
            "
          />
          <ButtonAction
            text="Edit"
            color="#3b82f6"
            @click="emit('onSelectedReservation', { ...item, action: 'edit' })"
          />
          <ButtonAction
            v-if="canManageTables"
            text="Assign"
            color="#f59e0b"
            @click="
              emit('onSelectedReservation', { ...item, action: 'assign-staff' })
            "
          />
          <ButtonAction
            text="Cancel"
            color="#ef4444"
            @click="
              emit('onSelectedReservation', { ...item, action: 'cancel' })
            "
          />
        </div>
        <div class="res-actions" v-else-if="canEditReservations">
          <ButtonAction
            text="Delete"
            color="#ef4444"
            @click="
              emit('onSelectedReservation', { ...item, action: 'delete' })
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-view-container {
  width: 100%;
}

.reservations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.res-card {
  background: var(--surface);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--card-shadow);
  transition: all 0.2s ease;
}

.res-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.res-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.res-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
  color: var(--sky-600);
  font-family: "Inter-Bold";
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.res-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.res-name {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--ink);
}

.res-id {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--ink-muted);
}

.status-chip {
  font-family: "Inter-Medium";
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  text-transform: capitalize;
  color: white;
}

.status-chip.pending {
  background: #3b82f6;
}

.status-chip.seated {
  background: #22c55e;
}

.status-chip.cancelled {
  background: #ef4444;
}

.status-chip.completed {
  background: #9ca3af;
}

.status-chip.missed {
  background: #f59e0b;
}

.res-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--ink-muted);
}

.detail-value {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--ink);
}

.payment-chip {
  font-family: "Inter-Medium";
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  color: white;
  text-transform: uppercase;
}

.loyalty-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.visit-count {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--ink-muted);
}

.tag-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.loyalty-tag {
  font-family: "Inter-Light";
  font-size: 10px;
  background: #e5e7eb;
  color: var(--ink);
  padding: 2px 8px;
  border-radius: 6px;
}

.res-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  padding: 40px 20px;
}
</style>
