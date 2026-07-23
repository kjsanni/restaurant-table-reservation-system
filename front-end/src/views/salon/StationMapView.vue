<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import stationAPI from "@/services/stationAPI";
import floorPlanAPI from "@/services/floorPlanAPI";
import logger from "@/utils/logger";

interface Station {
  id: number;
  name: string;
  type: string;
  zone?: string;
  floorPlanId?: number | null;
  floorPlan?: { id?: number; name?: string } | null;
  isOccupied: boolean;
  isBlocked: boolean;
}

interface FloorPlan {
  id: number;
  name: string;
}

const stations = ref<Station[]>([]);
const floorPlans = ref<FloorPlan[]>([]);
const loading = ref(true);

const grouped = computed(() => {
  const map = new Map<number | string, Station[]>();
  const ensure = (key: number | string) => {
    if (!map.has(key)) map.set(key, []);
    return map.get(key)!;
  };

  floorPlans.value.forEach((plan) => {
    ensure(plan.id).push(...[]);
  });

  stations.value.forEach((station) => {
    const key = station.floorPlanId ?? "unassigned";
    ensure(key).push(station);
  });

  return Array.from(map.entries()).map(([key, items]) => ({
    key: String(key),
    label:
      key === "unassigned"
        ? "Unassigned"
        : floorPlans.value.find((p) => p.id === key)?.name || `Floor ${key}`,
    stations: items,
  }));
});

const loadStations = async () => {
  loading.value = true;
  try {
    const [stationRes, planRes] = await Promise.all([
      stationAPI.getStations({ limit: 100 }),
      floorPlanAPI.getFloorPlans(),
    ]);
    stations.value = stationRes.data.data || [];
    floorPlans.value = planRes.data.floorPlans || planRes.data.data || [];
  } catch (err) {
    logger.error("Failed to load map data", { error: err });
  } finally {
    loading.value = false;
  }
};

onMounted(loadStations);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Station Map</h1>
        <p>Stations grouped by floor plan</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading stations...</p>
      </div>

      <div v-else class="zones-container">
        <div v-for="group in grouped" :key="group.key" class="zone">
          <h3>{{ group.label }}</h3>
          <div class="stations-row">
            <div
              v-for="station in group.stations"
              :key="station.id"
              :class="[
                'station-chip',
                station.isBlocked
                  ? 'blocked'
                  : station.isOccupied
                  ? 'occupied'
                  : 'free',
              ]"
            >
              {{ station.name }}
              <span class="station-type">{{ station.type }}</span>
            </div>
          </div>
          <div v-if="!group.stations.length" class="no-stations">
            No stations in this floor plan.
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
.zones-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.zone {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
}
.zone h3 {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 14px;
}
.stations-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.station-chip {
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 14px;
  min-width: 120px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.station-chip.free {
  background: #dbeafe;
  color: #1e40af;
}
.station-chip.occupied {
  background: #e0e7ff;
  color: #3730a3;
}
.station-chip.blocked {
  background: #fee2e2;
  color: #991b1b;
}
.station-type {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.85;
  text-transform: capitalize;
}
.no-stations {
  color: var(--neutral-600);
  font-size: 13px;
  font-style: italic;
}
</style>
