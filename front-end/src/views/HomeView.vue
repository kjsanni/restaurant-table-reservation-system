<script setup lang="ts">
import { VaButton, VaCard, VaCardContent } from "vuestic-ui";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { ref, onMounted } from "vue";
import reservationAPI from "@/services/reservationAPI";
import waitlistAPI from "@/services/waitlistAPI";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const todayReservations = ref(0);
const waitlistCount = ref(0);
const recent = ref([]);

const loadData = async () => {
  if (!authStore.isAuthenticated) return;
  loading.value = true;
  try {
    const today = new Date().toISOString().split("T")[0];
    const [todayRes, waitlistStats, recentRes] = await Promise.all([
      reservationAPI
        .getReservations({ resDate: today })
        .catch(() => ({ data: { collection: [] } })),
      waitlistAPI.getStats().catch(() => ({ data: { stats: { waiting: 0 } } })),
      reservationAPI
        .getReservations({})
        .catch(() => ({ data: { collection: [] } })),
    ]);
    todayReservations.value = todayRes.data.collection?.length || 0;
    waitlistCount.value = waitlistStats.data.stats?.waiting || 0;
    recent.value = (recentRes.data.collection || []).slice(0, 5);
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const changeRoute = (routeName: string) => router.push({ name: routeName });
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
          @click="changeRoute('new-reservation')"
        >
          <template #icon>
            <Icon icon="mdi:calendar-plus" width="20" height="20" />
          </template>
          New Reservation
        </VaButton>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>

      <div v-else class="preview-content">
        <div class="stat-cards">
          <VaCard class="stat-card" hoverable>
            <VaCardContent>
              <div class="stat-icon today-icon">
                <Icon icon="mdi:calendar-today" width="24" height="24" />
              </div>
              <div class="stat-value">{{ todayReservations }}</div>
              <div class="stat-label">Today's Reservations</div>
            </VaCardContent>
          </VaCard>

          <VaCard class="stat-card" hoverable>
            <VaCardContent>
              <div class="stat-icon waitlist-icon">
                <Icon icon="mdi:clock-outline" width="24" height="24" />
              </div>
              <div class="stat-value">{{ waitlistCount }}</div>
              <div class="stat-label">Waitlist</div>
            </VaCardContent>
          </VaCard>

          <VaCard
            class="stat-card"
            hoverable
            @click="changeRoute('reservations')"
          >
            <VaCardContent>
              <div class="stat-icon reservations-icon">
                <Icon icon="mdi:format-list-bulleted" width="24" height="24" />
              </div>
              <div class="stat-value">{{ recent.length }}</div>
              <div class="stat-label">Recent Bookings</div>
            </VaCardContent>
          </VaCard>
        </div>

        <VaCard class="recent-card">
          <VaCardContent>
            <div class="recent-header">
              <h2 class="recent-title">Recent Reservations</h2>
              <VaButton
                preset="secondary"
                size="small"
                @click="changeRoute('reservations')"
              >
                View All
              </VaButton>
            </div>
            <div v-if="recent.length === 0" class="empty-state-inline">
              <p>No reservations yet.</p>
            </div>
            <div v-else class="recent-list">
              <div v-for="res in recent" :key="res.id" class="recent-item">
                <div class="recent-info">
                  <div class="recent-name">
                    {{ res.Customer?.name || "Guest" }}
                  </div>
                  <div class="recent-meta">
                    {{ res.resDate }} at {{ res.resTime?.slice(0, 5) }}
                  </div>
                </div>
                <div class="recent-party">
                  {{ res.people }} {{ res.people === 1 ? "guest" : "guests" }}
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>
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
              @click="changeRoute('new-reservation')"
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
              @click="changeRoute('login')"
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
  min-height: calc(100vh - var(--header-height));
  background: var(--restaurant-background);
}

.dashboard-preview {
  padding: var(--space-8) var(--x-spacing-mobile);
  max-width: 1400px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .dashboard-preview {
    padding: var(--space-10) var(--x-spacing-desktop);
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
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--restaurant-charcoal);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: var(--tracking-tight);
}

.preview-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--restaurant-secondary);
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

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .stat-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.today-icon {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info-600);
}

.waitlist-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warm-600);
}

.reservations-icon {
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

.recent-card {
  background: var(--restaurant-surface);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.recent-title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--restaurant-charcoal);
  margin: 0;
  letter-spacing: var(--tracking-tight);
}

.empty-state-inline {
  text-align: center;
  padding: var(--space-10);
  color: var(--restaurant-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--restaurant-border);
}
.recent-item:last-child {
  border-bottom: none;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.recent-name {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--restaurant-charcoal);
}

.recent-meta {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
}

.recent-party {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--restaurant-secondary);
}

.public-landing {
  /* Reuse existing public styles */
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-10);
  padding: var(--space-20) var(--x-spacing-mobile) var(--space-16);
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  flex: 1;
  max-width: 540px;
  text-align: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background: linear-gradient(
    135deg,
    var(--restaurant-charcoal) 0%,
    var(--restaurant-slate) 100%
  );
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: var(--shadow-sm);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: var(--text-4xl);
  color: var(--restaurant-charcoal);
  margin: 0 0 var(--space-4) 0;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.hero-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  color: var(--restaurant-secondary);
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
}

.hero-visual {
  flex: 1;
  display: none;
  justify-content: center;
}

.hero-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
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
  padding: var(--space-16) var(--x-spacing-mobile) var(--space-20);
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  color: var(--restaurant-charcoal);
  margin: 0 0 var(--space-10) 0;
  letter-spacing: var(--tracking-tight);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-6);
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  transition: transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}
.feature-card:hover {
  transform: translateY(-6px);
}

.feature-icon {
  color: var(--restaurant-accent);
  margin-bottom: var(--space-4);
}

.feature-card h3 {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--restaurant-charcoal);
  margin: 0 0 var(--space-2) 0;
}

.feature-card p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
}
</style>
