<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import salonCustomerPortalAPI from "@/services/salonCustomerPortalAPI";
import logger from "@/utils/logger";

interface SalonAppointment {
  id: number;
  start: string;
  end?: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  source: string;
  service?: { name?: string; price?: number };
  station?: { name?: string };
  stylist?: { name?: string };
  notes?: string;
}

interface CustomerProfile {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const authStore = useAuthStore();
const loading = ref(false);
const appointments = ref<SalonAppointment[]>([]);
const profile = ref<CustomerProfile | null>(null);
const searchQuery = ref("");
const cancellingId = ref<number | null>(null);

const loadData = async () => {
  loading.value = true;
  try {
    const [profileRes, appointmentsRes] = await Promise.all([
      salonCustomerPortalAPI.getProfile(),
      salonCustomerPortalAPI.getAppointments(),
    ]);
    profile.value = (profileRes.data?.customer ||
      profileRes.data ||
      null) as CustomerProfile | null;
    appointments.value = (appointmentsRes.data?.appointments ||
      []) as SalonAppointment[];
  } catch (err) {
    logger.error("Failed to load salon portal data", { error: err });
  } finally {
    loading.value = false;
  }
};

const customerName = computed(() => {
  const first = profile.value?.firstName || authStore.user?.username || "Guest";
  const last = profile.value?.lastName || "";
  return last ? `${first} ${last}` : first;
});

const customerPhone = computed(
  () => profile.value?.phone || (authStore.user as any)?.phone || ""
);

const filteredAppointments = computed(() => {
  if (!searchQuery.value) return appointments.value;
  const q = searchQuery.value.toLowerCase();
  return appointments.value.filter((apt) => {
    const service = (apt.service?.name || "").toLowerCase();
    const station = (apt.station?.name || "").toLowerCase();
    const stylist = (apt.stylist?.name || "").toLowerCase();
    const id = String(apt.id || "");
    const status = apt.status.toLowerCase();
    return (
      service.includes(q) ||
      station.includes(q) ||
      stylist.includes(q) ||
      id.includes(q) ||
      status.includes(q)
    );
  });
});

const formatDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "Upcoming",
    confirmed: "Upcoming",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No-show",
  };
  return map[status] || status;
};

const statusClass = (status: string) => {
  if (["pending", "confirmed"].includes(status)) return "t-upcoming";
  if (status === "cancelled" || status === "no_show") return "t-cancelled";
  return "t-past";
};

const cancelAppointment = async (apt: SalonAppointment) => {
  if (!confirm("Cancel this appointment?")) return;
  cancellingId.value = apt.id;
  try {
    await salonCustomerPortalAPI.cancelAppointment(apt.id);
    apt.status = "cancelled";
  } catch (err) {
    logger.error("Failed to cancel appointment", { error: err });
  } finally {
    cancellingId.value = null;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>My Salon Appointments</h1>
        <p>
          Manage your bookings at
          {{ authStore.currentTenant?.name || "the salon" }}
        </p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="portal-hero">
        <h2>Welcome back, {{ customerName.split(" ")[0] }}</h2>
        <p v-if="customerPhone">Contact: {{ customerPhone }}</p>
        <div class="portal-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Find a booking by service, stylist, station, or status"
          />
        </div>
      </div>

      <div class="bookings">
        <h3>Your Appointments</h3>
        <div v-if="loading" class="state">Loading…</div>
        <div v-else-if="!filteredAppointments.length" class="state">
          No appointments found.
        </div>
        <template v-else>
          <div
            v-for="apt in filteredAppointments"
            :key="apt.id"
            class="booking"
          >
            <div class="date-badge">
              {{ formatDate(apt.start).split(" ")[0]?.toUpperCase() || "APT" }}
              <small>{{ new Date(apt.start).getDate() }}</small>
            </div>
            <div class="booking-meta">
              <b>{{ apt.service?.name || "Appointment" }}</b>
              <span>
                {{ formatTime(apt.start) }} · {{ apt.durationMinutes }} min ·
                {{ apt.stylist?.name || "Unassigned" }} ·
                {{ apt.station?.name || "Unassigned" }}
              </span>
            </div>
            <span :class="['pill', statusClass(apt.status)]">
              {{ statusLabel(apt.status) }}
            </span>
            <button
              v-if="['pending', 'confirmed'].includes(apt.status)"
              class="btn-danger-sm"
              :disabled="cancellingId === apt.id"
              @click="cancelAppointment(apt)"
            >
              {{ cancellingId === apt.id ? "Cancelling…" : "Cancel" }}
            </button>
          </div>
        </template>
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
  padding: 24px 28px;
  border-radius: var(--radius-xl);
  margin-bottom: 24px;
}

.portal-hero h2 {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
}

.portal-hero p {
  margin: 0;
  font-size: 14px;
  opacity: 0.85;
}

.portal-search {
  margin-top: 14px;
}

.portal-search input {
  width: 100%;
  max-width: 360px;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.18);
  color: var(--white);
}
.portal-search input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.bookings h3 {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 14px;
  color: var(--neutral-900);
}

.state {
  text-align: center;
  color: var(--neutral-600);
  padding: 28px;
}

.booking {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 16px;
  margin-bottom: 12px;
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--brand-100);
  color: var(--brand-800);
  border-radius: var(--radius-lg);
  font-weight: 800;
  font-size: 12px;
  line-height: 1.1;
  flex-shrink: 0;
}

.date-badge small {
  font-size: 16px;
  margin-top: 2px;
}

.booking-meta {
  flex: 1;
  min-width: 0;
}

.booking-meta b {
  display: block;
  font-size: 14px;
  color: var(--neutral-900);
  margin-bottom: 4px;
}

.booking-meta span {
  font-size: 13px;
  color: var(--neutral-600);
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.t-upcoming {
  background: #dbeafe;
  color: #1e40af;
}

.t-past {
  background: #d1fae5;
  color: #065f46;
}

.t-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.btn-danger-sm {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-danger-sm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
