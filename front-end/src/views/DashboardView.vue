<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { VaCard, VaCardContent, VaButton, VaChip } from "vuestic-ui";
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";
import reservationAPI from "@/services/reservationAPI";
import waitlistAPI from "@/services/waitlistAPI";
import paymentAPI from "@/services/paymentAPI";
import tableAPI from "@/services/tableAPI";

const router = useRouter();

const loading = ref(true);
const today = ref(new Date().toISOString().split("T")[0]);
const thirtyDaysAgo = ref(
  (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  })()
);

const stats = ref({
  todayReservations: 0,
  waitlistCount: 0,
  revenue: 0,
  occupancyRate: 0,
  totalTables: 0,
  occupiedTables: 0,
});

const recentReservations = ref([]);
const reservationStats = ref({});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: "primary",
    seated: "success",
    cancelled: "danger",
    completed: "info",
    missed: "warning",
    waiting: "warning",
  };
  return colors[status] || "secondary";
};

const loadData = async () => {
  loading.value = true;
  try {
    const [resStats, waitlistStats, revenueStats, tables] = await Promise.all([
      reservationAPI.getReservationStats({
        from: thirtyDaysAgo.value,
        to: today.value,
      }),
      waitlistAPI.getStats(),
      paymentAPI.getRevenueStats(thirtyDaysAgo.value, today.value),
      tableAPI.getTables().catch(() => ({ data: { collection: [] } })),
    ]);

    reservationStats.value = resStats.data.stats || {};

    const todayRes = await reservationAPI.getReservations({
      resDate: today.value,
    });
    stats.value.todayReservations = todayRes.data.collection?.length || 0;

    stats.value.waitlistCount = waitlistStats.data.stats?.waiting || 0;
    stats.value.revenue = revenueStats.data.stats?.totalRevenue || 0;

    const tableList = tables.data.collection || [];
    stats.value.totalTables = tableList.length;
    stats.value.occupiedTables = tableList.filter(
      (t: any) => t.reservationId && !t.isBlocked
    ).length;
    stats.value.occupancyRate =
      stats.value.totalTables > 0
        ? Math.round(
            (stats.value.occupiedTables / stats.value.totalTables) * 100
          )
        : 0;

    const recent = await reservationAPI.getReservations({});
    recentReservations.value = (recent.data.collection || []).slice(0, 8);
  } catch (err) {
    console.error("Failed to load dashboard", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const navigateTo = (route: string) => {
  router.push({ name: route });
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening today."
    />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div v-else class="dashboard-content">
        <div class="stats-grid">
          <VaCard class="stat-card" hoverable>
            <VaCardContent>
              <div class="stat-header">
                <div class="stat-icon today-icon">
                  <Icon icon="mdi:calendar-today" width="24" height="24" />
                </div>
                <VaChip color="primary" size="small">Today</VaChip>
              </div>
              <div class="stat-value">{{ stats.todayReservations }}</div>
              <div class="stat-label">Today's Reservations</div>
            </VaCardContent>
          </VaCard>

          <VaCard class="stat-card" hoverable>
            <VaCardContent>
              <div class="stat-header">
                <div class="stat-icon waitlist-icon">
                  <Icon icon="mdi:clock-outline" width="24" height="24" />
                </div>
                <VaChip color="warning" size="small">Active</VaChip>
              </div>
              <div class="stat-value">{{ stats.waitlistCount }}</div>
              <div class="stat-label">Waitlist</div>
            </VaCardContent>
          </VaCard>

          <VaCard class="stat-card" hoverable>
            <VaCardContent>
              <div class="stat-header">
                <div class="stat-icon revenue-icon">
                  <Icon icon="mdi:currency-usd" width="24" height="24" />
                </div>
                <VaChip color="success" size="small">30 days</VaChip>
              </div>
              <div class="stat-value">{{ formatCurrency(stats.revenue) }}</div>
              <div class="stat-label">Revenue</div>
            </VaCardContent>
          </VaCard>

          <VaCard class="stat-card" hoverable>
            <VaCardContent>
              <div class="stat-header">
                <div class="stat-icon occupancy-icon">
                  <Icon icon="mdi:chart-donut" width="24" height="24" />
                </div>
                <VaChip
                  :color="stats.occupancyRate > 80 ? 'danger' : 'primary'"
                  size="small"
                >
                  {{ stats.occupancyRate }}%
                </VaChip>
              </div>
              <div class="stat-value">
                {{ stats.occupiedTables }}/{{ stats.totalTables }}
              </div>
              <div class="stat-label">Table Occupancy</div>
            </VaCardContent>
          </VaCard>
        </div>

        <div class="dashboard-sections">
          <VaCard class="recent-card">
            <VaCardContent>
              <div class="section-header">
                <h2 class="section-title">Recent Reservations</h2>
                <VaButton
                  preset="secondary"
                  size="small"
                  @click="navigateTo('reservations')"
                >
                  View All
                </VaButton>
              </div>
              <div
                v-if="recentReservations.length === 0"
                class="empty-state-inline"
              >
                <p>No reservations yet.</p>
              </div>
              <div v-else class="recent-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Party</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="res in recentReservations" :key="res.id">
                      <td>#{{ res.id }}</td>
                      <td>{{ res.Customer?.name || "Guest" }}</td>
                      <td>{{ formatDate(res.resDate) }}</td>
                      <td>{{ res.resTime?.slice(0, 5) || "—" }}</td>
                      <td>{{ res.people }}</td>
                      <td>
                        <VaChip
                          :color="getStatusColor(res.resStatus)"
                          size="small"
                        >
                          {{ res.resStatus }}
                        </VaChip>
                      </td>
                      <td>
                        <VaChip
                          :color="
                            res.paymentStatus === 'paid' ? 'success' : 'warning'
                          "
                          size="small"
                        >
                          {{ res.paymentStatus }}
                        </VaChip>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VaCardContent>
          </VaCard>

          <div class="quick-actions">
            <VaCard
              class="action-card"
              hoverable
              @click="navigateTo('new-reservation')"
            >
              <VaCardContent>
                <div class="action-icon">
                  <Icon icon="mdi:calendar-plus" width="32" height="32" />
                </div>
                <div class="action-text">
                  <div class="action-title">New Reservation</div>
                  <div class="action-subtitle">Create a booking</div>
                </div>
              </VaCardContent>
            </VaCard>

            <VaCard
              class="action-card"
              hoverable
              @click="navigateTo('waitlist')"
            >
              <VaCardContent>
                <div class="action-icon">
                  <Icon icon="mdi:clock-outline" width="32" height="32" />
                </div>
                <div class="action-text">
                  <div class="action-title">Waitlist</div>
                  <div class="action-subtitle">Manage queue</div>
                </div>
              </VaCardContent>
            </VaCard>

            <VaCard
              class="action-card"
              hoverable
              @click="navigateTo('table-management')"
            >
              <VaCardContent>
                <div class="action-icon">
                  <Icon icon="mdi:table" width="32" height="32" />
                </div>
                <div class="action-text">
                  <div class="action-title">Tables</div>
                  <div class="action-subtitle">Manage seating</div>
                </div>
              </VaCardContent>
            </VaCard>

            <VaCard
              class="action-card"
              hoverable
              @click="navigateTo('schedule')"
            >
              <VaCardContent>
                <div class="action-icon">
                  <Icon icon="mdi:calendar-clock" width="32" height="32" />
                </div>
                <div class="action-text">
                  <div class="action-title">Schedule</div>
                  <div class="action-subtitle">Hours & holidays</div>
                </div>
              </VaCardContent>
            </VaCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--restaurant-background);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-6) var(--x-spacing-mobile);
  max-width: 1400px;
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-6);
  gap: var(--space-4);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--restaurant-border);
  border-top-color: var(--restaurant-accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .content-wrapper {
    margin: var(--space-8) var(--x-spacing-desktop);
  }
}

.stat-card {
  background: var(--restaurant-surface);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.today-icon {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info-600);
}

.waitlist-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warm-600);
}

.revenue-icon {
  background: rgba(22, 163, 74, 0.1);
  color: var(--color-success-600);
}

.occupancy-icon {
  background: rgba(220, 38, 38, 0.1);
  color: var(--color-accent-600);
}

.stat-value {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--restaurant-charcoal);
  margin-bottom: var(--space-1);
  letter-spacing: var(--tracking-tight);
}

.stat-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
  font-weight: 500;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .dashboard-sections {
    grid-template-columns: 2fr 1fr;
  }
}

.recent-card {
  background: var(--restaurant-surface);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.section-title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--restaurant-charcoal);
  margin: 0;
  letter-spacing: var(--tracking-tight);
}

.recent-table-wrapper {
  overflow-x: auto;
}

.empty-state-inline {
  text-align: center;
  padding: var(--space-10);
  color: var(--restaurant-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (min-width: 1024px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
}

.action-card {
  background: var(--restaurant-surface);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  color: var(--restaurant-charcoal);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.action-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.action-title {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--restaurant-charcoal);
}

.action-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
}
</style>
