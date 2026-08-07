<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import stationAPI from "@/services/stationAPI";
import locationAPI from "@/services/locationAPI";
import logger from "@/utils/logger";
import { io, Socket } from "socket.io-client";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

interface Station {
  id: number;
  name: string;
  type: string;
  zone?: string;
  isOccupied: boolean;
  isBlocked: boolean;
  maintenanceNotes?: string;
  locationId?: number | null;
  location?: { id: number; name: string };
}

const stations = ref<Station[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  name: "",
  type: "chair",
  zone: "",
  maintenanceNotes: "",
  locationId: null,
});
const socket = ref<Socket | null>(null);
const locations = ref<Array<{ id: number; name: string }>>([]);
const selectedLocationId = ref<number | "">("");

const typeOptions = ["chair", "wash", "color", "nail", "therapy"];

const loadStations = async () => {
  loading.value = true;
  try {
    const params: any = { limit: 100 };
    if (selectedLocationId.value) {
      params.locationId = selectedLocationId.value;
    }
    const res = await stationAPI.getStations(params);
    stations.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load stations", { error: err });
  } finally {
    loading.value = false;
  }
};

const loadLocations = async () => {
  try {
    const res = await locationAPI.list();
    locations.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load locations", { error: err });
  }
};

const resetForm = () => {
  form.value = {
    name: "",
    type: "chair",
    zone: "",
    maintenanceNotes: "",
    locationId: null,
  };
  editingId.value = null;
};

const editStation = (station: Station) => {
  editingId.value = station.id;
  form.value = {
    name: station.name,
    type: station.type,
    zone: station.zone || "",
    maintenanceNotes: station.maintenanceNotes || "",
    locationId: station.locationId || null,
  };
  showForm.value = true;
};

const submitForm = async () => {
  try {
    const payload = {
      ...form.value,
      zone: form.value.zone || null,
      locationId: form.value.locationId || null,
    };
    if (editingId.value) {
      const res = await stationAPI.updateStation(editingId.value, payload);
      const idx = stations.value.findIndex((s) => s.id === editingId.value);
      if (idx !== -1) stations.value[idx] = res.data.data;
    } else {
      const res = await stationAPI.createStation(payload);
      stations.value.push(res.data.data);
    }
    showForm.value = false;
    resetForm();
  } catch (err) {
    logger.error("Failed to save station", { error: err });
  }
};

const deleteStation = async (id: number) => {
  if (!confirm(t("salon.confirmDeleteStation"))) return;
  try {
    await stationAPI.deleteStation(id);
    stations.value = stations.value.filter((s) => s.id !== id);
  } catch (err) {
    logger.error("Failed to delete station", { error: err });
  }
};

onMounted(async () => {
  await Promise.all([loadStations(), loadLocations()]);
  socket.value = io("", { path: "/socket.io" });
  socket.value.on("salon-appointment-created", loadStations);
  socket.value.on("salon-appointment-updated", loadStations);
  socket.value.on("salon-appointment-deleted", loadStations);
});

onUnmounted(() => {
  socket.value?.disconnect();
  socket.value = null;
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.stations") }}</h1>
        <p>{{ t("salon.manageStationsAndZones") }}</p>
      </div>
      <div class="topbar-right">
        <button
          class="btn-primary"
          @click="
            showForm = true;
            resetForm();
          "
        >
          {{ t("salon.addStation") }}
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t("salon.loadingStations") }}</p>
      </div>

      <div v-else class="stations-grid">
        <div v-if="locations.length" class="location-filter-bar">
          <label>{{ t("salon.location", "Location") }}</label>
          <select
            v-model="selectedLocationId"
            class="field-input"
            @change="loadStations"
          >
            <option value="">
              {{ t("salon.allLocations", "All locations") }}
            </option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
        <div v-for="station in stations" :key="station.id" class="station-card">
          <div class="station-head">
            <div>
              <h3>{{ station.name }}</h3>
              <span class="station-type">{{ station.type }}</span>
              <span v-if="station.zone" class="station-zone">{{
                station.zone
              }}</span>
              <span v-if="station.location" class="station-location">
                {{ station.location.name }}
              </span>
            </div>
            <div class="station-actions">
              <button class="btn-sm" @click="editStation(station)">
                {{ t("common.edit") }}
              </button>
              <button class="btn-danger-sm" @click="deleteStation(station.id)">
                {{ t("common.delete") }}
              </button>
            </div>
          </div>
          <div class="station-status">
            <span
              :class="[
                'status-badge',
                station.isBlocked ? 'blocked' : 'active',
              ]"
            >
              {{ station.isBlocked ? t("salon.blocked") : t("salon.active") }}
            </span>
            <span
              :class="[
                'status-badge',
                station.isOccupied ? 'occupied' : 'free',
              ]"
            >
              {{ station.isOccupied ? t("salon.occupied") : t("salon.free") }}
            </span>
          </div>
          <p v-if="station.maintenanceNotes" class="station-notes">
            {{ station.maintenanceNotes }}
          </p>
        </div>
        <div v-if="!stations.length" class="empty-state">
          {{ t("salon.noStations") }}
        </div>
      </div>

      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal">
          <h2>
            {{ editingId ? t("salon.editStation") : t("salon.newStation") }}
          </h2>
          <div class="form-group">
            <label>{{ t("salon.name") }}</label>
            <input
              v-model="form.name"
              :placeholder="t('salon.stationNamePlaceholder')"
            />
          </div>
          <div class="form-group">
            <label>{{ t("salon.type") }}</label>
            <select v-model="form.type">
              <option v-for="t in typeOptions" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t("salon.zone") }} ({{ t("salon.optional") }})</label>
            <input
              v-model="form.zone"
              :placeholder="t('salon.zonePlaceholder')"
            />
          </div>
          <div class="form-group">
            <label>{{ t("salon.location", "Location") }}</label>
            <select v-model="form.locationId">
              <option value="">
                {{ t("salon.selectLocation", "Select location") }}
              </option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t("salon.maintenanceNotes") }}</label>
            <textarea
              v-model="form.maintenanceNotes"
              rows="3"
              :placeholder="t('salon.maintenanceNotesPlaceholder')"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button
              class="btn-secondary"
              @click="
                showForm = false;
                resetForm();
              "
            >
              {{ t("salon.cancelBtn") }}
            </button>
            <button class="btn-primary" @click="submitForm">
              {{ t("salon.save") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}
.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}
.topbar-right {
  display: flex;
  gap: 12px;
}
.content-wrapper {
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--neutral-600);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.stations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.station-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
}
.station-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.station-head h3 {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}
.station-type {
  display: inline-block;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-md);
  background: var(--neutral-100);
  color: var(--neutral-700);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.station-zone {
  display: inline-block;
  margin-left: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent-600);
  font-size: 12px;
  font-weight: 600;
}
.station-actions {
  display: flex;
  gap: 8px;
}
.station-status {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
}
.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}
.status-badge.blocked {
  background: #fee2e2;
  color: #991b1b;
}
.status-badge.occupied {
  background: #e0e7ff;
  color: #3730a3;
}
.status-badge.free {
  background: #dbeafe;
  color: #1e40af;
}
.location-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
}
.location-filter-bar label {
  font-weight: 600;
  font-size: 14px;
  color: var(--neutral-700);
}
.station-location {
  display: inline-block;
  margin-left: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-md);
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
}
.station-notes {
  margin-top: 10px;
  font-size: 13px;
  color: var(--neutral-600);
  font-style: italic;
}
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--neutral-600);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.modal h2 {
  font-family: var(--font-serif);
  font-size: 22px;
  margin: 0 0 16px;
}
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 6px;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--neutral-900);
  background: var(--white);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
.btn-primary {
  background: var(--brand-500);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 18px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  background: var(--neutral-100);
  color: var(--neutral-700);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  padding: 10px 18px;
  font-weight: 600;
  cursor: pointer;
}
.btn-sm {
  background: var(--brand-500);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger-sm {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>
