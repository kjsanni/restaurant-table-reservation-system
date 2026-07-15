<script setup lang="ts">
import { VaButton, VaCard, VaCardContent } from "vuestic-ui";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const changeRoute = (routeName: string) => router.push({ name: routeName });
</script>

<template>
  <div class="home-container">
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
            v-if="!authStore.isAuthenticated"
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
        <VaCard class="feature-highlight">
          <VaCardContent>
            <Icon icon="mdi:restaurant" width="48" height="48" />
            <span>Professional Grade</span>
          </VaCardContent>
        </VaCard>
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
</template>

<style scoped>
.home-container {
  min-height: calc(100vh - var(--header-height));
  background: linear-gradient(
    180deg,
    var(--restaurant-cream) 0%,
    var(--restaurant-stone) 100%
  );
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

.feature-highlight {
  padding: var(--space-10);
  background: white;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  color: var(--restaurant-charcoal);
  border: 1px solid var(--restaurant-border);
  transition: transform var(--duration-slow) var(--ease-out),
    box-shadow var(--duration-slow) var(--ease-out);
}
.feature-highlight:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
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

@media screen and (min-width: 1024px) {
  .hero-section {
    padding: var(--space-24) var(--x-spacing-desktop) var(--space-20);
  }

  .hero-title {
    font-size: var(--text-4xl);
  }

  .hero-content {
    text-align: left;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .hero-visual {
    display: flex;
  }

  .features-section {
    padding: var(--space-20) var(--x-spacing-desktop) var(--space-24);
  }
}
</style>
