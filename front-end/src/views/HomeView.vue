<script setup lang="ts">
import { VaButton, VaCard, VaCardContent, VaChip } from "vuestic-ui";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { ref, onMounted } from "vue";
import reservationAPI from "@/services/reservationAPI";
import waitlistAPI from "@/services/waitlistAPI";
import paymentAPI from "@/services/paymentAPI";
import tableAPI from "@/services/tableAPI";

const router = useRouter();
const authStore = useAuthStore();

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
    currency: "GHS",
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
  if (!authStore.isAuthenticated) return;
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

const navigateTo = (routeName: string) => router.push({ name: routeName });
</script>

<template>
  <div class="home-container">
    <div v-if="authStore.isAuthenticated" class="dashboard-preview">
      <div class="preview-header">
        <div>
          <h1 class="preview-title">
            Welcome back, {{ authStore.user?.username }}
          </h1>
          <p class="preview-subtitle">
            Here's what's happening at your restaurant today.
          </p>
        </div>
        <VaButton
          preset="primary"
          size="large"
          @click="navigateTo('new-reservation')"
        >
          <template #icon>
            <Icon icon="mdi:calendar-plus" width="20" height="20" />
          </template>
          New Reservation
        </VaButton>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div v-else class="preview-content">
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

    <div v-else class="public-landing">
      <div class="hero-section">
        <div class="hero-content">
          <div class="badge">Restaurant Management</div>
          <h1 class="hero-title">Table Reservations Simplified</h1>
          <p class="hero-subtitle">
            Streamline your restaurant operations with our intuitive booking
            platform. Manage reservations, tables, staff, and payments from a
            single dashboard.
          </p>
          <div class="hero-actions">
            <VaButton
              preset="primary"
              size="large"
              class="cta-button"
              @click="navigateTo('new-reservation')"
            >
              <template #icon>
                <Icon icon="mdi:calendar-plus" width="20" height="20" />
              </template>
              New Reservation
            </VaButton>
            <VaButton
              preset="secondary"
              size="large"
              class="cta-button"
              @click="navigateTo('login')"
            >
              <template #icon>
                <Icon icon="mdi:login" width="20" height="20" />
              </template>
              Login
            </VaButton>
          </div>
        </div>
        <div class="hero-visual">
          <img
            src="@/assets/images/hero-section-img.png"
            alt="Restaurant Management"
            class="hero-image"
          />
        </div>
      </div>

      <div class="features-section">
        <h2 class="section-title">Key Features</h2>
        <div class="features-grid">
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <Icon
                icon="mdi:table-multiple"
                width="48"
                height="48"
                class="feature-icon"
              />
              <h3>Floor Plan</h3>
              <p>Visual drag-and-drop seating management</p>
            </VaCardContent>
          </VaCard>
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <Icon
                icon="mdi:account-clock"
                width="48"
                height="48"
                class="feature-icon"
              />
              <h3>Waitlist</h3>
              <p>Smart queue with auto-seating suggestions</p>
            </VaCardContent>
          </VaCard>
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <Icon
                icon="mdi:currency-usd"
                width="48"
                height="48"
                class="feature-icon"
              />
              <h3>Revenue Reports</h3>
              <p>Track payments and generate insights</p>
            </VaCardContent>
          </VaCard>
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <Icon
                icon="mdi:shield-account"
                width="48"
                height="48"
                class="feature-icon"
              />
              <h3>Secure Access</h3>
              <p>Role-based permissions and audit logs</p>
            </VaCardContent>
          </VaCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background: var(--background-warm);
}

.dashboard-preview {
  padding: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .dashboard-preview {
    padding: var(--space-10) var(--space-8);
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.preview-title {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: var(--tracking-tight);
}

.preview-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--ink-muted);
  margin: 0;
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
  border: 3px solid var(--border);
  border-top-color: var(--accent);
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
  color: var(--ink-secondary);
}

.preview-content {
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
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
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
  color: var(--ink);
  margin-bottom: var(--space-1);
  letter-spacing: var(--tracking-tight);
}

.stat-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
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
  background: var(--surface);
  border: 1px solid var(--border);
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
  color: var(--ink);
  margin: 0;
  letter-spacing: var(--tracking-tight);
}

.recent-table-wrapper {
  overflow-x: auto;
}

.empty-state-inline {
  text-align: center;
  padding: var(--space-10);
  color: var(--ink-secondary);
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
  background: var(--surface);
  border: 1px solid var(--border);
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
  color: var(--ink);
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
  color: var(--ink);
}

.action-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.public-landing {
  /* Reuse existing public styles */
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-10);
  padding: var(--space-20) var(--space-6) var(--space-16);
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.hero-section::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--glow-warm);
  pointer-events: none;
  opacity: 0.5;
}

.hero-content {
  flex: 1;
  max-width: 540px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background: linear-gradient(
    135deg,
    var(--brand-800) 0%,
    var(--brand-700) 100%
  );
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.hero-title {
  font-family: var(--font-sans);
  font-size: var(--text-5xl);
  color: var(--ink);
  margin: 0 0 var(--space-4) 0;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
  font-weight: 750;
}

.hero-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  color: var(--ink-secondary);
  margin: 0 0 var(--space-8) 0;
  line-height: var(--leading-relaxed);
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button {
  font-family: var(--font-sans);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  height: 52px;
  padding: 0 var(--space-8);
  border-radius: var(--radius-lg);
}

.hero-visual {
  flex: 1;
  display: none;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.hero-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--border-subtle);
}

@media screen and (min-width: 1024px) {
  .hero-visual {
    display: flex;
  }

  .hero-content {
    text-align: left;
  }

  .hero-actions {
    justify-content: flex-start;
  }
}

.features-section {
  padding: var(--space-16) var(--space-6) var(--space-20);
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.section-title {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  color: var(--ink);
  margin: 0 0 var(--space-10) 0;
  letter-spacing: var(--tracking-tight);
  font-weight: 700;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-6);
  max-width: 1100px;
  margin: 0 auto;
}

.feature-card {
  transition: transform var(--duration-200) var(--ease-spring),
    box-shadow var(--duration-200) var(--ease-out);
  text-align: left;
}
.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
}

.feature-icon {
  color: var(--accent);
  margin-bottom: var(--space-4);
}

.feature-card h3 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  color: var(--ink);
  margin: 0 0 var(--space-2) 0;
  font-weight: 650;
}

.feature-card p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0;
  line-height: var(--leading-relaxed);
}
</style>
