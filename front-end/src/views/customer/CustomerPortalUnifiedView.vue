<template>
  <div class="unified-portal">
    <div class="page-header">
      <div>
        <h1>My Dashboard</h1>
        <p class="subtitle">
          Unified view across all your bookings and loyalty
        </p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading your dashboard...</p>
    </div>
    <div v-else-if="!profile" class="empty-state">
      <p>Profile not found.</p>
    </div>
    <div v-else>
      <div class="summary-cards">
        <div class="card">
          <div class="card-label">Total Visits</div>
          <div class="card-value">{{ profile.totalVisits }}</div>
        </div>
        <div class="card">
          <div class="card-label">Loyalty Points</div>
          <div class="card-value">{{ profile.points }}</div>
        </div>
        <div class="card">
          <div class="card-label">Total Spent</div>
          <div class="card-value">{{ formatGhs(profile.totalSpent) }}</div>
        </div>
        <div class="card">
          <div class="card-label">Verticals</div>
          <div class="card-value">{{ verticalCount }}</div>
        </div>
      </div>

      <div class="loyalty-actions">
        <button class="btn-primary" @click="showAddPoints = true">
          + Add Points
        </button>
        <button class="btn-secondary" @click="showRedeemPoints = true">
          Redeem Points
        </button>
      </div>

      <div v-if="showAddPoints" class="card form-card">
        <h3>Add Points</h3>
        <form @submit.prevent="handleAddPoints">
          <input
            v-model="pointsForm.amount"
            type="number"
            min="1"
            placeholder="Points"
            required
          />
          <input
            v-model="pointsForm.source"
            placeholder="Source (e.g. booking)"
          />
          <div class="form-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="showAddPoints = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">Add</button>
          </div>
        </form>
      </div>

      <div v-if="showRedeemPoints" class="card form-card">
        <h3>Redeem Points</h3>
        <form @submit.prevent="handleRedeemPoints">
          <input
            v-model="pointsForm.amount"
            type="number"
            min="1"
            :max="profile.points"
            placeholder="Points"
            required
          />
          <div class="form-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="showRedeemPoints = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">Redeem</button>
          </div>
        </form>
      </div>

      <div class="section">
        <h2>Recent Activity</h2>
        <div v-if="!profile.recentActivity?.length" class="empty-state">
          No activity yet.
        </div>
        <div v-else class="activity-list">
          <div
            v-for="item in profile.recentActivity"
            :key="item.date + item.type"
            class="activity-item"
          >
            <div class="activity-icon">
              {{ item.type === "reservation" ? "🍽️" : "🎫" }}
            </div>
            <div class="activity-body">
              <div class="activity-title">{{ item.title }}</div>
              <div class="activity-meta">
                {{ formatDate(item.date) }} · {{ item.status }}
              </div>
            </div>
            <div class="activity-total">
              {{ item.total ? formatGhs(item.total) : "" }}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Cross-Vertical History</h2>
        <div v-if="loadingHistory" class="loading-state">
          Loading history...
        </div>
        <div v-else-if="!history" class="empty-state">No history found.</div>
        <div v-else class="history-grid">
          <div class="card">
            <h3>Restaurant Reservations</h3>
            <div v-if="!history.reservations.length" class="empty-state">
              No reservations
            </div>
            <div v-else class="list">
              <div
                v-for="item in history.reservations"
                :key="item.id"
                class="list-item"
              >
                <div>{{ item.tenantName }}</div>
                <div class="meta">
                  {{ formatDate(item.date) }} · {{ item.status }}
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <h3>Event Bookings</h3>
            <div v-if="!history.events.length" class="empty-state">
              No event bookings
            </div>
            <div v-else class="list">
              <div
                v-for="item in history.events"
                :key="item.id"
                class="list-item"
              >
                <div>{{ item.eventName || "Event" }}</div>
                <div class="meta">
                  {{ formatDate(item.date) }} · {{ item.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import customerPortalAPI from "@/services/customerPortalAPI";

interface Profile {
  customerId: number;
  name: string;
  email: string;
  phone: string;
  points: number;
  totalVisits: number;
  totalSpent: number;
  verticals: { restaurant: number; event: number };
  recentActivity: Array<{
    type: string;
    date: string;
    title: string;
    status: string;
    total?: number;
  }>;
}

const loading = ref(true);
const loadingHistory = ref(true);
const profile = ref<Profile | null>(null);
const history = ref<{ reservations: any[]; events: any[] } | null>(null);
const showAddPoints = ref(false);
const showRedeemPoints = ref(false);
const pointsForm = ref({ amount: 1, source: "manual" });

const verticalCount = computed(() => {
  if (!profile.value) return 0;
  return Object.values(profile.value.verticals).filter((v) => v > 0).length;
});

const loadProfile = async () => {
  loading.value = true;
  try {
    const res = await customerPortalAPI.getUnifiedProfile();
    profile.value = (res.data?.profile || res.data) as Profile;
  } finally {
    loading.value = false;
  }
};

const loadHistory = async () => {
  loadingHistory.value = true;
  try {
    const res = await customerPortalAPI.getCrossVerticalHistory();
    history.value = (res.data?.history || res.data) as {
      reservations: any[];
      events: any[];
    };
  } finally {
    loadingHistory.value = false;
  }
};

const handleAddPoints = async () => {
  await customerPortalAPI.addLoyaltyPoints(
    pointsForm.value.amount,
    pointsForm.value.source
  );
  showAddPoints.value = false;
  pointsForm.value = { amount: 1, source: "manual" };
  await loadProfile();
};

const handleRedeemPoints = async () => {
  await customerPortalAPI.redeemLoyaltyPoints(pointsForm.value.amount);
  showRedeemPoints.value = false;
  pointsForm.value = { amount: 1, source: "manual" };
  await loadProfile();
};

const formatGhs = (amount: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString();
};

onMounted(() => {
  loadProfile();
  loadHistory();
});
</script>

<style scoped>
.unified-portal {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0;
  font-size: 24px;
}
.subtitle {
  margin: var(--space-1) 0 0;
  color: var(--neutral-500);
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.card-label {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--neutral-500);
  font-weight: 600;
}
.card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--neutral-900);
  margin-top: var(--space-1);
}
.loyalty-actions {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.btn-primary {
  padding: 10px 18px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 18px;
  background: white;
  color: var(--neutral-700);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.form-card {
  margin-bottom: var(--space-6);
}
.form-card h3 {
  margin: 0 0 var(--space-3);
}
.form-card input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
}
.form-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
.section {
  margin-bottom: var(--space-6);
}
.section h2 {
  font-size: 18px;
  margin: 0 0 var(--space-3);
}
.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--neutral-500);
}
.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.activity-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
}
.activity-icon {
  font-size: 20px;
}
.activity-body {
  flex: 1;
}
.activity-title {
  font-weight: 600;
  color: var(--neutral-900);
}
.activity-meta {
  font-size: 13px;
  color: var(--neutral-500);
}
.activity-total {
  font-weight: 700;
  color: var(--neutral-900);
}
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}
.list-item {
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--neutral-100);
}
.list-item:last-child {
  border-bottom: none;
}
.meta {
  font-size: 13px;
  color: var(--neutral-500);
}
</style>
