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
      toastStore.add(
        res.data.message || "Failed to cancel reservation",
        "error"
      );
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
      <div v-else-if="!reservations.length" class="empty">
        No reservations found.
      </div>
      <div v-else class="reservation-list">
        <div v-for="r in reservations" :key="r.id" class="reservation-item">
          <div class="reservation-info">
            <div class="reservation-date">
              {{ r.resDate }} at {{ r.resTime }}
            </div>
            <div class="reservation-details">
              {{ r.people }} people • Table: {{ r.tableName || "Unassigned" }}
            </div>
            <div class="reservation-status" :class="r.resStatus">
              {{ r.resStatus }}
            </div>
          </div>
          <button
            v-if="
              r.resStatus === RESERVATION_STATUS.CONFIRMED ||
              r.resStatus === RESERVATION_STATUS.PENDING
            "
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
.page {
  padding: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
}
.page-title {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin-bottom: var(--space-4);
}
.loading,
.empty {
  text-align: center;
  padding: var(--space-10);
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.reservation-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.reservation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface);
  transition: border-color var(--duration-150) var(--ease-in-out);
}
.reservation-item:hover {
  border-color: var(--border);
}
.reservation-date {
  font-weight: 600;
  color: var(--ink);
}
.reservation-details {
  color: var(--ink-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-1);
}
.reservation-status {
  display: inline-block;
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  text-transform: capitalize;
  margin-top: var(--space-2);
  font-weight: 600;
}
.reservation-status.confirmed {
  background: var(--earth-100);
  color: var(--earth-600);
}
.reservation-status.pending {
  background: var(--accent-100);
  color: var(--accent-600);
}
.reservation-status.cancelled {
  background: var(--rose-100);
  color: var(--rose-600);
}
.reservation-status.completed {
  background: var(--sky-100);
  color: var(--sky-600);
}
</style>
