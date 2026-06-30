<script setup lang="ts">
import ReservationInfo from "@/components/ReservationInfo.vue";
import ListContainer from "@/components/ListContainer.vue";
import SearchIcon from "~icons/ant-design/search-outlined";
import ClearIcon from "~icons/fluent/dismiss-16-filled";

import reservationAPI from "@/services/reservationAPI";
import logger from "@/utils/logger";
import { useAuthStore } from "@/stores/auth";

import { ref, computed, onMounted } from "vue";

const searchVal = ref("");
const searchNotes = ref(true);
const reservations = ref([]);
const loading = ref(true);
const authStore = useAuthStore();
const canEditReservations = computed(
  () => authStore.user?.permissions?.edit_reservations === true
);

const showDeleteModal = ref(false);
const deleteTargetId = ref(null);

const showNoShowModal = ref(false);
const noShowTargetId = ref(null);

const getReservations = async () => {
  loading.value = true;
  try {
    const res = await reservationAPI.getReservations();
    reservations.value = res.data.collection.filter(
      (r) => r.resStatus !== "seated" && r.resStatus !== "cancelled"
    );
  } catch (err) {
    logger.error("Failed to load reservations", { error: err.message });
  } finally {
    loading.value = false;
  }
};

onMounted(getReservations);

const filteredReservations = computed(() => {
  const query = searchVal.value.trim().toLowerCase();
  if (!query) return reservations.value;

  return reservations.value.filter((item) => {
    const searchableKeys = searchNotes.value
      ? Object.keys(item)
      : Object.keys(item).filter((key) => key !== "notes");

    return searchableKeys.some((key) => {
      const val = item[key];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(query);
    });
  });
});

const clearSearch = () => {
  searchVal.value = "";
};

const openDeleteModal = (id) => {
  deleteTargetId.value = id;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteTargetId.value = null;
};

const openNoShowModal = (id) => {
  noShowTargetId.value = id;
  showNoShowModal.value = true;
};

const closeNoShowModal = () => {
  showNoShowModal.value = false;
  noShowTargetId.value = null;
};

const confirmNoShow = async () => {
  if (!noShowTargetId.value) return;
  loading.value = true;
  try {
    await reservationAPI.editReservation(noShowTargetId.value, {
      resStatus: "missed",
    });
    reservations.value = reservations.value.filter(
      (r) => r.id !== noShowTargetId.value
    );
  } catch (err) {
    logger.error("Failed to mark no-show", { error: err.message });
  } finally {
    loading.value = false;
    closeNoShowModal();
  }
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  loading.value = true;
  try {
    await reservationAPI.cancelReservation(deleteTargetId.value);
    reservations.value = reservations.value.filter(
      (r) => r.id !== deleteTargetId.value
    );
  } catch (err) {
    logger.error("Failed to delete reservation", { error: err.message });
  } finally {
    loading.value = false;
    closeDeleteModal();
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <div class="header-content">
        <h1 class="page-title">Search Reservations</h1>
        <div class="search-bar">
          <span class="search-icon"><SearchIcon /></span>
          <input
            type="search"
            class="search-input"
            placeholder="Search by name, phone, email, date..."
            v-model="searchVal"
          />
          <button
            v-if="searchVal"
            type="button"
            class="clear-btn"
            @click="clearSearch"
          >
            <ClearIcon />
          </button>
        </div>
        <label class="notes-toggle">
          <input type="checkbox" v-model="searchNotes" />
          <span>Include notes in search</span>
        </label>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading reservations...</p>
      </div>

      <div v-else class="results-container">
        <div class="results-meta">
          <span class="results-count">
            {{ filteredReservations.length }}
            {{ filteredReservations.length === 1 ? "result" : "results" }}
          </span>
        </div>

        <ListContainer
          class="results-wrapper"
          :collection="reservations"
          :filteredCollection="filteredReservations"
        >
          <template #card="slotProps">
            <div class="search-result-card">
              <ReservationInfo
                :reservation="slotProps.item"
                :can-delete="canEditReservations"
                :search-query="searchVal"
                @on-delete="openDeleteModal"
              />
              <div
                class="card-actions"
                v-if="
                  slotProps.item.resStatus === 'pending' && canEditReservations
                "
              >
                <button
                  class="action-btn no-show-btn"
                  @click="openNoShowModal(slotProps.item.id)"
                >
                  Mark No-Show
                </button>
              </div>
            </div>
          </template>
        </ListContainer>

        <div
          v-if="!loading && filteredReservations.length === 0"
          class="empty-state"
        >
          <span class="empty-icon">🔍</span>
          <p class="empty-text">
            {{
              searchVal
                ? "No matching reservations found"
                : "No reservations available"
            }}
          </p>
        </div>
      </div>
    </div>

    <va-modal v-model="showDeleteModal" title="Confirm Delete" size="small">
      <template #content>
        <div class="confirm-content">
          <p>Are you sure you want to delete this reservation?</p>
          <div class="confirm-actions">
            <va-button preset="secondary" @click="closeDeleteModal"
              >Cancel</va-button
            >
            <va-button preset="danger" @click="confirmDelete">Delete</va-button>
          </div>
        </div>
      </template>
    </va-modal>

    <va-modal v-model="showNoShowModal" title="Confirm No-Show" size="small">
      <template #content>
        <div class="confirm-content">
          <p>Mark this reservation as a no-show?</p>
          <div class="confirm-actions">
            <va-button preset="secondary" @click="closeNoShowModal"
              >Cancel</va-button
            >
            <va-button preset="warning" @click="confirmNoShow"
              >Mark No-Show</va-button
            >
          </div>
        </div>
      </template>
    </va-modal>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/search-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
}

.page-title {
  margin: 0;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--lighter-gray);
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.search-bar {
  position: relative;
  max-width: 420px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--secondary-gray);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.search-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 42px 12px 44px;
  border: 1px solid #f0f0f0;
  border-radius: var(--input-radius);
  font-family: "Inter-Light";
  font-size: 15px;
  color: var(--primary-black);
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--secondary-gray);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: #f3f4f6;
  color: var(--primary-black);
}

.clear-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.notes-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--secondary-gray);
  cursor: pointer;
  user-select: none;
}

.notes-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary-blue);
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.results-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-count {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--secondary-gray);
}

.results-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.empty-icon {
  font-size: 36px;
  opacity: 0.45;
}

.empty-text {
  margin: 0;
  font-size: 15px;
}

.test {
  transition: opacity 0.5s ease, filter 0.5s ease;
  filter: blur(var(--blur-val));
  opacity: var(--opacity-val);
}

@media screen and (min-width: 1024px) {
  .header-content {
    margin-left: var(--x-spacing-desktop);
    margin-bottom: 20px;
  }
  .page-title {
    font-size: 45px;
  }
  .content-wrapper {
    margin-left: var(--x-spacing-desktop);
    margin-right: var(--x-spacing-desktop);
  }
}

.confirm-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.confirm-content p {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background-color: #e5e7eb;
  color: var(--primary-black);
}

.btn-cancel:hover {
  background-color: #d1d5db;
}

.btn-danger {
  background-color: var(--primary-red);
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background-color: #d97706;
}

.search-result-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-left: 15px;
}

.action-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-family: "Inter-Medium";
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.no-show-btn {
  background-color: #f59e0b;
  color: white;
}

.no-show-btn:hover {
  background-color: #d97706;
}
</style>
