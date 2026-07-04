<script setup>
import { ref, onMounted } from "vue";
import tableAPI from "@/services/tableAPI";
import reservationAPI from "@/services/reservationAPI";
import waitlistAPI from "@/services/waitlistAPI";
import paymentAPI from "@/services/paymentAPI";
import floorPlanAPI from "@/services/floorPlanAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";
import FloorPlan from "@/components/FloorPlan.vue";
import logger from "@/utils/logger";
import PageHeader from "@/components/PageHeader.vue";

const tables = ref([]);
const reservations = ref([]);
const waitlist = ref([]);
const loading = ref(true);
const assignPopupOpen = ref(false);
const selectedLinkedTables = ref([]);
const errorPopupOpen = ref(false);
const errorMessage = ref("");
const draggingReservation = ref(null);

const waitlistReservations = computed(() => {
  return (waitlist.value || []).filter(
    (w) => w.status === "waiting" || w.resStatus === "waiting"
  );
});

const loadData = async () => {
  loading.value = true;
  try {
    const [tRes, rRes, wRes] = await Promise.all([
      tableAPI.getTables(),
      reservationAPI.getReservations(),
      waitlistAPI.getEntries().catch(() => ({ data: { waitlist: [] } })),
    ]);
    tables.value = tRes.data.collection;
    reservations.value = rRes.data.collection;
    waitlist.value = wRes.data.waitlist || wRes.data.collection || [];
    await loadFloorPlans();
  } catch (err) {
    logger.error("Failed to load floor plan", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const handleAssign = async ({ reservationId, tableId }) => {
  try {
    await reservationAPI.chooseTable(reservationId, tableId);
    assignPopupOpen.value = false;
    draggingReservation.value = null;
    selectedTable.value = null;
    selectedLinkedTables.value = [];
    await loadData();
  } catch (err) {
    logger.error("Assign table error", {
      error: err.response?.data || err.message,
    });
    errorMessage.value = getApiErrorMessage(err, "Failed to assign table");
    errorPopupOpen.value = true;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Floor Plan" subtitle="Visual table layout and seating" />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading floor plan...</p>
      </div>
      <FloorPlan
        v-else
        :tables="tables"
        :reservations="reservations"
        @assign="handleAssign"
      />

      <PopupBox
        :is-open="errorPopupOpen"
        header-text="Error"
        :is-closable="true"
        @close-modal="errorPopupOpen = false"
      >
        <template #popup-content>
          <div class="error-content">
            <p>{{ errorMessage }}</p>
            <div class="confirm-actions">
              <button class="btn btn-secondary" @click="errorPopupOpen = false">
                OK
              </button>
            </div>
          </div>
        </template>
      </PopupBox>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}
.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: "Inter-Light";
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--sky-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.error-content p {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--ink);
  margin: 0;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
}
</style>
