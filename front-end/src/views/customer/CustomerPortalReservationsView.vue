<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCapabilities } from "@/composables/useCapabilities";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";

interface Reservation {
  id: number;
  resDate: string;
  resTime: string;
  people: number;
  tableName?: string;
  occasion?: string;
  resStatus: string;
}

interface Profile {
  name?: string;
  email?: string;
}

const authStore = useAuthStore();
const router = useRouter();
const { businessVertical } = useCapabilities();
const isSalon = computed(() => businessVertical.value === "salon");
const reservations = ref<Reservation[]>([]);
const profile = ref<Profile | null>(null);
const loading = ref(true);
const searchQuery = ref("");

const loadProfile = async () => {
  try {
    const res = await customerPortalAPI.getProfile();
    profile.value = (res.data?.profile || res.data || null) as Profile | null;
  } catch (err) {
    logger.warn("Customer profile unavailable", { error: err });
  }
};

const loadReservations = async () => {
  loading.value = true;
  try {
    const res = await customerPortalAPI.getReservations();
    reservations.value = (res.data?.reservations || []) as Reservation[];
  } catch (err) {
    logger.error("Failed to load reservations", { error: err });
    throw err;
  } finally {
    loading.value = false;
  }
};

let pollTimer: ReturnType<typeof setInterval> | null = null;
const pollErrorCount = ref(0);
const MAX_POLL_ERRORS = 3;
const pollError = ref(false);

const startPolling = () => {
  pollTimer = setInterval(async () => {
    try {
      await loadReservations();
      pollErrorCount.value = 0;
      pollError.value = false;
    } catch {
      pollErrorCount.value += 1;
      if (pollErrorCount.value >= MAX_POLL_ERRORS && pollTimer) {
        pollError.value = true;
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }
  }, 30000);
};

const retryPolling = async () => {
  pollError.value = false;
  pollErrorCount.value = 0;
  try {
    await loadReservations();
  } catch {
    // will be handled by next poll cycle
  }
  startPolling();
};

const firstName = computed(() => {
  const name =
    profile.value?.name ||
    authStore.user?.username ||
    (authStore.user as any)?.name ||
    "Guest";
  return String(name).split(" ")[0];
});

const filteredReservations = computed(() => {
  if (!searchQuery.value) return reservations.value;
  const q = searchQuery.value.toLowerCase();
  return reservations.value.filter((r: Reservation) => {
    const occasion = (r.occasion || "").toLowerCase();
    const table = (r.tableName || "").toLowerCase();
    const date = (r.resDate || "").toLowerCase();
    const id = String(r.id || "");
    return (
      occasion.includes(q) ||
      table.includes(q) ||
      date.includes(q) ||
      id.includes(q)
    );
  });
});

const dateParts = (d: string) => {
  if (!d) return { mon: "—", day: "—" };
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return { mon: "—", day: "—" };
  return {
    mon: dt.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: dt.getDate(),
  };
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    confirmed: "Upcoming",
    pending: "Upcoming",
    seated: "Completed",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No-show",
  };
  return map[s] || s;
};

const statusClass = (s: string) => {
  if (s === "confirmed" || s === "pending") return "t-upcoming";
  return "t-past";
};

const goToReview = (reservationId: number) => {
  router.push(`/portal/reviews?reservationId=${reservationId}`);
};

onMounted(async () => {
  try {
    await Promise.all([loadProfile(), loadReservations()]);
  } catch {
    pollError.value = true;
  }
  startPolling();
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Customer Portal</h1>
        <p>Find and manage your bookings</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="portal-hero">
        <h2>Welcome back, {{ firstName }}</h2>
        <p>
          Manage your reservations at
          {{
            authStore.currentTenant?.name ||
            (isSalon ? "your salon" : "your restaurant")
          }}
        </p>
        <div class="portal-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Find a booking by name, date, or confirmation #"
            aria-label="Search reservations by name, date, or confirmation number"
          />
        </div>
      </div>

      <div class="bookings">
        <h3>Your Reservations</h3>
        <div v-if="loading" class="state">Loading…</div>
        <div v-else-if="pollError" class="state error-state">
          <p>Unable to load reservations. Please try again.</p>
          <button @click="retryPolling" class="retry-btn">Retry</button>
        </div>
        <div v-else-if="!filteredReservations.length" class="state">
          No reservations found.
        </div>
        <ul v-else role="list" class="booking-list">
          <li v-for="r in filteredReservations" :key="r.id" class="booking">
            <div class="date-badge">
              {{ dateParts(r.resDate).mon
              }}<small>{{ dateParts(r.resDate).day }}</small>
            </div>
            <div class="booking-meta">
              <b>{{ r.occasion || "Reservation" }}</b>
              <span>
                {{ r.resTime }} · Party of {{ r.people }} ·
                {{ r.tableName || "Unassigned" }}
              </span>
            </div>
            <span :class="['pill', statusClass(r.resStatus)]">
              {{ statusLabel(r.resStatus) }}
            </span>
            <button
              v-if="r.resStatus === 'completed' || r.resStatus === 'seated'"
              class="review-btn"
              @click="goToReview(r.id)"
            >
              Review
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
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
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.portal-hero {
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border-radius: var(--radius-xl);
  padding: 28px;
  margin-bottom: 22px;
  position: relative;
  overflow: hidden;
}

.portal-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    360px 160px at 100% -20%,
    rgba(251, 191, 36, 0.25),
    transparent 60%
  );
  pointer-events: none;
}

.portal-hero h2 {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  position: relative;
}

.portal-hero p {
  position: relative;
  opacity: 0.85;
  margin-top: 6px;
  font-size: 14px;
}

.portal-search {
  margin-top: 14px;
  position: relative;
  max-width: 420px;
}

.portal-search input {
  width: 100%;
  padding: 12px 14px 12px 38px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
  color: var(--white);
  font-family: var(--font-sans);
  font-size: 13px;
  backdrop-filter: blur(6px);
}

.portal-search input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.portal-search::before {
  content: "🔍";
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  opacity: 0.8;
}

.bookings {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 22px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}

.booking-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.bookings h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}

.booking {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--neutral-100);
}

.booking:last-child {
  border-bottom: none;
}

.date-badge {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  background: var(--brand-100);
  color: var(--brand-800);
  display: grid;
  place-items: center;
  text-align: center;
  font-weight: 700;
  line-height: 1.1;
  flex-shrink: 0;
  font-family: var(--font-sans);
  font-size: 12px;
}

.date-badge small {
  display: block;
  font-size: 9px;
  text-transform: uppercase;
}

.booking-meta {
  flex: 1;
  min-width: 0;
}

.booking-meta b {
  display: block;
  font-size: 14px;
  color: var(--neutral-900);
}

.booking-meta span {
  font-size: 12px;
  color: var(--neutral-600);
}

.pill {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
  font-family: var(--font-sans);
}

.t-upcoming {
  background: var(--accent-100);
  color: var(--accent-600);
}

.t-past {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.review-btn {
  margin-left: 8px;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--brand-600);
  background: var(--white);
  color: var(--brand-600);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.review-btn:hover {
  background: var(--brand-50);
}

.state {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}
.error-state {
  color: var(--rose-600);
}
.retry-btn {
  margin-top: var(--space-3);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}
.retry-btn:hover {
  background: var(--neutral-100);
}
</style>
