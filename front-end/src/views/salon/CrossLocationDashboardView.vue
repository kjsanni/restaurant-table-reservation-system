<script setup lang="ts">
import { ref, onMounted } from "vue";
import crossLocationDashboardAPI from "@/services/crossLocationDashboardAPI";
import { useI18n } from "@/composables/useI18n";
import { useToastStore } from "@/stores/toast";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";

const { t } = useI18n();
const toastStore = useToastStore();

const loading = ref(true);
const summary = ref({
  totalLocations: 0,
  totalStaff: 0,
  totalStations: 0,
  totalRevenue: 0,
  totalAppointments: 0,
  appointmentsToday: 0,
  revenueToday: 0,
});
const locations = ref<
  Array<{
    locationId: number;
    locationName: string;
    locationCity?: string;
    appointmentCount: number;
    revenue: number;
  }>
>([]);
const locationDetails = ref<
  Array<{
    id: number;
    name: string;
    address?: string;
    city?: string;
    region?: string;
    latitude: number | null;
    longitude: number | null;
    isPrimary: boolean;
    isActive: boolean;
  }>
>([]);
const activeTab = ref("table");

const loadDashboard = async () => {
  loading.value = true;
  try {
    const res = await crossLocationDashboardAPI.list();
    const data = res.data;
    if (data?.success) {
      summary.value = data.summary || summary.value;
      locations.value = data.locations || [];
      locationDetails.value = data.locationDetails || [];
    }
  } catch (err) {
    toastStore.add(
      t(
        "salon.crossLocationLoadFailed",
        "Failed to load cross-location dashboard"
      ),
      "error"
    );
  } finally {
    loading.value = false;
  }
};

const mapCenter = ref<[number, number]>([5.6037, -0.187]);
const mapZoom = ref(12);

const updateMapCenter = () => {
  const coords = locationDetails.value
    .filter((loc) => loc.latitude && loc.longitude)
    .map((loc) => [loc.latitude, loc.longitude] as [number, number]);
  if (coords.length) {
    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    mapCenter.value = [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];
    mapZoom.value = coords.length === 1 ? 14 : 12;
  }
};

onMounted(() => {
  loadDashboard();
  updateMapCenter();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>
          {{ t("salon.crossLocationDashboard", "Cross-Location Dashboard") }}
        </h1>
        <p>
          {{
            t(
              "salon.crossLocationSubtitle",
              "Consolidated view across all locations"
            )
          }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      {{ t("salon.loadingDashboard") }}
    </div>

    <template v-else>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">{{ t("salon.locations", "Locations") }}</div>
          <div class="kpi-value">{{ summary.totalLocations }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">{{ t("salon.staff", "Staff") }}</div>
          <div class="kpi-value">{{ summary.totalStaff }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">{{ t("salon.stations", "Stations") }}</div>
          <div class="kpi-value">{{ summary.totalStations }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">{{ t("salon.appointmentsToday") }}</div>
          <div class="kpi-value">{{ summary.appointmentsToday }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">
            {{ t("salon.revenueToday", "Revenue Today") }}
          </div>
          <div class="kpi-value">
            GHS {{ summary.revenueToday.toLocaleString() }}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">
            {{ t("salon.totalRevenue", "Total Revenue") }}
          </div>
          <div class="kpi-value">
            GHS {{ summary.totalRevenue.toLocaleString() }}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">
            {{ t("salon.totalAppointments", "Total Appointments") }}
          </div>
          <div class="kpi-value">{{ summary.totalAppointments }}</div>
        </div>
      </div>

      <div class="tabs">
        <button
          :class="['tab-button', { active: activeTab === 'table' }]"
          @click="activeTab = 'table'"
        >
          {{ t("salon.locationTable", "Location Table") }}
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'map' }]"
          @click="activeTab = 'map'"
        >
          {{ t("salon.locationMap", "Location Map") }}
        </button>
      </div>

      <div class="card">
        <template v-if="activeTab === 'table'">
          <h2>{{ t("salon.locationBreakdown", "Location Breakdown") }}</h2>
          <div v-if="!locations.length" class="empty-state">
            {{ t("salon.noLocationData", "No location data available") }}
          </div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t("salon.location", "Location") }}</th>
                  <th>{{ t("salon.city", "City") }}</th>
                  <th>{{ t("salon.appointments", "Appointments") }}</th>
                  <th>{{ t("salon.revenue", "Revenue") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="loc in locations" :key="loc.locationId">
                  <td>{{ loc.locationName }}</td>
                  <td>{{ loc.locationCity || "-" }}</td>
                  <td>{{ loc.appointmentCount }}</td>
                  <td>GHS {{ loc.revenue.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else>
          <h2>{{ t("salon.locationMap", "Location Map") }}</h2>
          <div v-if="!locationDetails.length" class="empty-state">
            {{ t("salon.noLocationData", "No location data available") }}
          </div>
          <div v-else class="map-wrap">
            <l-map
              v-model:zoom="mapZoom"
              :center="mapCenter"
              :options="{ scrollWheelZoom: false }"
            >
              <l-tile-layer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <l-marker
                v-for="loc in locationDetails"
                :key="loc.id"
                :lat-lng="[loc.latitude, loc.longitude]"
              >
                <l-popup>
                  <strong>{{ loc.name }}</strong
                  ><br />
                  {{ loc.address }}<br />
                  {{ loc.city }}<br />
                  {{ loc.region }}
                </l-popup>
              </l-marker>
            </l-map>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #666);
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.kpi-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-lg, 14px);
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.kpi-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted, #6b7280);
  margin-bottom: 0.5rem;
}
.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #111827);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.topbar-left h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
}
.topbar-left p {
  margin: 0;
  color: var(--text-secondary, #4b5563);
}
.card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-lg, 14px);
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
}
.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-secondary, #6b7280);
}
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tab-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--card-bg, #fff);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-weight: 500;
  color: var(--text-secondary, #4b5563);
}
.tab-button.active {
  background: var(--primary, #4f46e5);
  color: #fff;
  border-color: var(--primary, #4f46e5);
}
.map-wrap {
  height: 500px;
  border-radius: var(--radius-lg, 14px);
  overflow: hidden;
}
</style>
