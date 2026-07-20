<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import TheReservations from "@/components/TheReservations.vue";
import { VaSkeleton } from "vuestic-ui";
import reservationAPI from "@/services/reservationAPI";
import logger from "@/utils/logger";

const view = ref<"list" | "timeline" | "calendar">("list");
const coversByHour = ref<{ hour: string; count: number }[]>([]);
const peakHour = ref("—");

const HOURS = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
const maxCovers = computed(() =>
  Math.max(1, ...coversByHour.value.map((c) => c.count))
);

const loadCovers = async () => {
  try {
    const res = await reservationAPI.getReservationStats({ range: "today" });
    const stats = res.data?.stats || res.data || {};
    const byHour = stats.coversByHour || stats.byHour || {};
    coversByHour.value = HOURS.map((h) => ({
      hour: h,
      count: Number(byHour[h] || 0),
    }));
    const peak = coversByHour.value.reduce(
      (a, b) => (b.count > a.count ? b : a),
      { hour: "—", count: 0 }
    );
    peakHour.value = peak.count > 0 ? peak.hour : "—";
  } catch (e) {
    logger.warn("Covers-by-hour unavailable", { error: e?.message });
    coversByHour.value = HOURS.map((h) => ({ hour: h, count: 0 }));
  }
};

onMounted(loadCovers);
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Reservations"
      subtitle="View calendar and search all bookings"
    />

    <div class="content-wrapper">
      <div class="toolbar">
        <div class="seg">
          <button :class="{ on: view === 'list' }" @click="view = 'list'">
            List
          </button>
          <button
            :class="{ on: view === 'timeline' }"
            @click="view = 'timeline'"
          >
            Timeline
          </button>
          <button
            :class="{ on: view === 'calendar' }"
            @click="view = 'calendar'"
          >
            Calendar
          </button>
        </div>
        <div class="filters">
          <select aria-label="Filter status">
            <option>All statuses</option>
            <option>Confirmed</option>
            <option>Seated</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
          <select aria-label="Filter party size">
            <option>All party sizes</option>
            <option>1–2</option>
            <option>3–4</option>
            <option>5+</option>
          </select>
          <select aria-label="Filter area">
            <option>All areas</option>
            <option>Window</option>
            <option>Bar</option>
            <option>Patio</option>
            <option>Private</option>
          </select>
        </div>
      </div>

      <div class="reservations-layout">
        <div class="reservations-main">
          <Suspense>
            <template #default>
              <TheReservations :view="view" />
            </template>
            <template #fallback>
              <div class="loading-state">
                <VaSkeleton variant="text" :lines="5" />
              </div>
            </template>
          </Suspense>
        </div>

        <aside class="covers-panel">
          <h3>Covers by Hour</h3>
          <span class="panel-count">peak {{ peakHour }}</span>
          <div class="covers-bars">
            <div v-for="c in coversByHour" :key="c.hour" class="cslot">
              <div class="chour">{{ c.hour.slice(0, 2) }}</div>
              <div class="cbar">
                <i
                  :class="{ seated: c.count >= maxCovers * 0.8 }"
                  :style="{ width: (c.count / maxCovers) * 100 + '%' }"
                ></i>
              </div>
              <div class="ccount">{{ c.count }}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.toolbar {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.seg {
  display: inline-flex;
  background: var(--neutral-100);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
}
.seg button {
  border: none;
  background: transparent;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.seg button.on {
  background: var(--surface);
  color: var(--brand-800);
  box-shadow: var(--shadow-sm);
}
.filters {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.filters select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}

.reservations-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-4);
  align-items: start;
}
.reservations-main {
  min-width: 0;
}
.loading-state {
  padding: var(--space-20) var(--space-6);
  display: flex;
  justify-content: center;
  background: var(--background);
  min-height: 60vh;
}

.covers-panel {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
  position: sticky;
  top: var(--space-4);
}
.covers-panel h3 {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.panel-count {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  background: var(--neutral-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  margin-left: var(--space-2);
}
.covers-bars {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.cslot {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.chour {
  font-family: var(--font-serif);
  font-size: var(--text-xs);
  color: var(--ink-muted);
  min-width: 28px;
}
.cbar {
  flex: 1;
  height: 22px;
  background: var(--neutral-100);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}
.cbar i {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, var(--accent-400), var(--accent-600));
  border-radius: var(--radius-md);
  opacity: 0.85;
  transition: width var(--duration-300) var(--ease-out);
}
.cbar i.seated {
  background: linear-gradient(90deg, var(--earth-400), var(--earth-600));
}
.ccount {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  min-width: 28px;
  text-align: right;
  font-weight: 600;
}

@media (max-width: 980px) {
  .reservations-layout {
    grid-template-columns: 1fr;
  }
  .covers-panel {
    position: static;
  }
}
@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
</style>
