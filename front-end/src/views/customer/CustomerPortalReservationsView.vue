<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";
import RESERVATION_STATUS from "@/constants/reservationStatus";

const authStore = useAuthStore();
const toastStore = useToastStore();

const reservations = ref([]);
const loading = ref(false);
const cancelling = ref<number | null>(null);

const loadReservations = async () => {
  loading.value = true;
  try {
    const res = await customerPortalAPI.getReservations();
    reservations.value = res.data.reservations;
  } catch (err) {
    logger.error("Failed to load reservations", { error: err });
  } finally {
    loading.value = false;
  }
};

const cancelReservation = async (id: number) => {
  cancelling.value = id;
  try {
    const res = await customerPortalAPI.cancelReservation(id);
    if (res.data.success) {
      toastStore.add("Reservation cancelled", "success");
      await loadReservations();
    } else {
      toastStore.add(res.data.message || "Failed to cancel reservation", "error");
    }
  } catch (err) {
    logger.error("Failed to cancel reservation", { error: err });
    toastStore.add("Failed to cancel reservation", "error");
  } finally {
    cancelling.value = null;
  }
};

onMounted(loadReservations);
</script>

<template>
  <div class="page">
    <VaCard>
      <h1 class="page-title">My Reservations</h1>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="!reservations.length" class="empty">No reservations found.</div>
      <div v-else class="reservation-list">
        <div v-for="r in reservations" :key="r.id" class="reservation-item">
          <div class="reservation-info">
            <div class="reservation-date">{{ r.resDate }} at {{ r.resTime }}</div>
            <div class="reservation-details">
              {{ r.people }} people • Table: {{ r.tableName || "Unassigned" }}
            </div>
            <div class="reservation-status" :class="r.resStatus">
              {{ r.resStatus }}
            </div>
          </div>
          <button
            v-if="r.resStatus === RESERVATION_STATUS.CONFIRMED || r.resStatus === RESERVATION_STATUS.PENDING"
            class="btn btn-secondary"
            :disabled="cancelling === r.id"
            @click="cancelReservation(r.id)"
          >
            {{ cancelling === r.id ? "Cancelling..." : "Cancel" }}
          </button>
        </div>
      </div>
    </VaCard>
  </div>
</template>

<style scoped>
.page { padding: 24px; max-width: 800px; margin: 0 auto; }
.page-title { font-size: 1.5rem; margin-bottom: 16px; }
.loading, .empty { text-align: center; padding: 40px; color: #666; }
.reservation-list { display: flex; flex-direction: column; gap: 12px; }
.reservation-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
.reservation-date { font-weight: 600; }
.reservation-details { color: #666; font-size: 0.9rem; }
.reservation-status { font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; text-transform: capitalize; }
.reservation-status.confirmed { background: #dcfce7; color: #166534; }
.reservation-status.pending { background: #fef9c3; color: #854d0e; }
.reservation-status.cancelled { background: #fee2e2; color: #991b1b; }
.reservation-status.completed { background: #dbeafe; color: #1e40af; }
</style>
