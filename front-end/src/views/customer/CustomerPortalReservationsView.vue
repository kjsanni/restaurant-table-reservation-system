<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";
import RESERVATION_STATUS from "@/constants/reservationStatus";

const authStore = useAuthStore();
const toastStore = useToastStore();

const reservations = ref([]);
const profile = ref(null);
const loading = ref(false);
const cancelling = ref<number | null>(null);

const firstName = computed(() => {
  const name =
    profile.value?.name ||
    authStore.user?.username ||
    authStore.user?.name ||
    "there";
  return String(name).split(" ")[0];
});

const reservationsByState = computed(() => {
  const list = reservations.value || [];
  const isUpcoming = (r: any) =>
    r.resStatus === RESERVATION_STATUS.CONFIRMED ||
    r.resStatus === RESERVATION_STATUS.PENDING;
  return {
    upcoming: list.filter(isUpcoming),
    past: list.filter((r: any) => !isUpcoming(r)),
  };
});

const loadProfile = async () => {
  try {
    const res = await customerPortalAPI.getProfile();
    profile.value = res.data?.profile || res.data || null;
  } catch (err) {
    logger.warn("Customer profile unavailable", { error: err });
  }
};

const loadReservations = async () => {
  loading.value = true;
  try {
    const res = await customerPortalAPI.getReservations();
    reservations.value = res.data.reservations || [];
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

const dateParts = (d: string) => {
  if (!d) return { mon: "—", day: "" };
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return { mon: "—", day: d };
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
  if (s === RESERVATION_STATUS.CONFIRMED || s === RESERVATION_STATUS.PENDING)
    return "t-upcoming";
  if (s === RESERVATION_STATUS.CANCELLED) return "t-past";
  return "t-past";
};

onMounted(async () => {
  await Promise.all([loadProfile(), loadReservations()]);
});
</script>

<template>
  <div class="portal-page">
    <div class="hero">
      <h1>Welcome back, {{ firstName }}</h1>
      <p>
        Manage your reservations at
        {{ authStore.currentTenant?.name || "your restaurant" }}
      </p>
      <div class="search">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <input placeholder="Find a booking by name, date, or confirmation #" />
        <button>Search</button>
      </div>
    </div>

    <div class="portal-grid">
      <section class="card">
        <h3>Your Reservations</h3>

        <div v-if="loading" class="state">Loading…</div>
        <div v-else-if="!reservations.length" class="state">
          No reservations found.
        </div>

        <template v-else>
          <div
            v-for="r in reservationsByState.upcoming"
            :key="r.id"
            class="booking"
          >
            <div class="booking-date">
              {{ dateParts(r.resDate).mon
              }}<small>{{ dateParts(r.resDate).day }}</small>
            </div>
            <div class="booking-who">
              <b>{{ r.occasion || "Reservation" }}</b>
              <p>
                {{ r.resTime }} · Party of {{ r.people }} ·
                {{ r.tableName || "Unassigned" }}
              </p>
            </div>
            <span class="booking-tag" :class="statusClass(r.resStatus)">
              {{ statusLabel(r.resStatus) }}
            </span>
            <button
              class="cancel-btn"
              :disabled="cancelling === r.id"
              @click="cancelReservation(r.id)"
            >
              {{ cancelling === r.id ? "Cancelling…" : "Cancel" }}
            </button>
          </div>

          <div v-if="reservationsByState.past.length" class="past-label">
            Past
          </div>
          <div
            v-for="r in reservationsByState.past"
            :key="r.id"
            class="booking"
          >
            <div class="booking-date">
              {{ dateParts(r.resDate).mon
              }}<small>{{ dateParts(r.resDate).day }}</small>
            </div>
            <div class="booking-who">
              <b>{{ r.occasion || "Reservation" }}</b>
              <p>
                {{ r.resTime }} · Party of {{ r.people }} ·
                {{ r.tableName || "Unassigned" }}
              </p>
            </div>
            <span class="booking-tag t-past">{{
              statusLabel(r.resStatus)
            }}</span>
          </div>
        </template>
      </section>

      <aside class="card profile-card">
        <h3>Profile</h3>
        <div class="prof">
          <div class="prof-av">
            {{ (profile?.name || firstName || "G").charAt(0).toUpperCase() }}
          </div>
          <div>
            <b>{{ profile?.name || firstName }}</b>
            <span>{{ profile?.email || authStore.user?.email || "" }}</span>
          </div>
        </div>
        <div class="plist">
          <div>
            <span>Total visits</span><b>{{ profile?.totalVisits ?? "—" }}</b>
          </div>
          <div>
            <span>Member since</span><b>{{ profile?.memberSince ?? "—" }}</b>
          </div>
          <div>
            <span>Loyalty tier</span><b>{{ profile?.loyaltyTier ?? "—" }}</b>
          </div>
          <div>
            <span>Dietary notes</span
            ><b>{{ profile?.dietaryNotes ?? "None" }}</b>
          </div>
        </div>
        <div class="cta">
          <button class="primary">Book Again</button>
          <button>Edit Profile</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.portal-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-6) var(--space-10);
}
.hero {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-sm);
  padding: var(--space-8);
  text-align: center;
  margin-bottom: var(--space-6);
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    600px 200px at 50% -40%,
    var(--accent-soft),
    transparent 60%
  );
}
.hero h1 {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
  position: relative;
}
.hero p {
  color: var(--ink-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
  position: relative;
}
.search {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-5);
  position: relative;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  align-items: center;
}
.search svg {
  position: absolute;
  left: var(--space-4);
  color: var(--ink-muted);
}
.search input {
  flex: 1;
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-9);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  background: var(--surface);
  color: var(--ink);
}
.search input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.search button {
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border: none;
  padding: 0 var(--space-5);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  font-family: var(--font-sans);
}

.portal-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--space-5);
  align-items: start;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
}
.card h3 {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
  margin-bottom: var(--space-4);
}
.state {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.booking {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.booking:last-child {
  border-bottom: none;
}
.booking-date {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  background: var(--brand-100);
  color: var(--brand-800);
  display: grid;
  place-items: center;
  text-align: center;
  font-weight: 700;
  line-height: 1.1;
  flex-shrink: 0;
}
.booking-date small {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
}
.booking-who {
  min-width: 0;
}
.booking-who b {
  color: var(--ink);
  font-size: var(--text-sm);
}
.booking-who p {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin-top: 2px;
}
.booking-tag {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.t-upcoming {
  background: var(--sky-100);
  color: var(--sky-600);
}
.t-past {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.cancel-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--rose-600);
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.cancel-btn:hover:not(:disabled) {
  border-color: var(--rose-200);
  background: var(--rose-100);
}
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.past-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
  font-weight: 600;
  margin-top: var(--space-4);
}

.profile-card {
  position: sticky;
  top: var(--space-4);
}
.prof {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.prof-av {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--brand-500);
  color: var(--white);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: var(--text-lg);
}
.prof b {
  font-size: var(--text-sm);
  color: var(--ink);
  display: block;
}
.prof span {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.plist div {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.plist div:last-child {
  border-bottom: none;
}
.plist span {
  color: var(--ink-muted);
}
.plist b {
  color: var(--brand-800);
}
.cta {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
.cta button {
  flex: 1;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--brand-800);
  cursor: pointer;
  font-family: var(--font-sans);
}
.cta button.primary {
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border: none;
}

@media (max-width: 860px) {
  .portal-grid {
    grid-template-columns: 1fr;
  }
  .profile-card {
    position: static;
  }
}
</style>
