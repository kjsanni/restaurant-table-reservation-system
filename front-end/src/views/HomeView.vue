<script setup lang="ts">
import { VaButton, VaCard, VaCardContent } from 'vuestic-ui'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

const changeRoute = (routeName: string) => router.push({ name: routeName })
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="hero-content">
        <div class="badge">Restaurant Management</div>
        <h1 class="hero-title">Table Reservations Simplified</h1>
        <p class="hero-subtitle">
          Streamline your restaurant operations with our intuitive booking platform.
          Manage reservations, tables, staff, and payments from a single dashboard.
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
            @click="changeRoute('search')"
          >
            <template #icon>
              <Icon icon="mdi:magnify" width="20" height="20" />
            </template>
            Find Reservation
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
            <Icon icon="mdi:table-multiple" width="48" height="48" class="feature-icon" />
            <h3>Floor Plan</h3>
            <p>Visual drag-and-drop seating management</p>
          </VaCardContent>
        </VaCard>
        <VaCard class="feature-card" hoverable>
          <VaCardContent>
            <Icon icon="mdi:account-clock" width="48" height="48" class="feature-icon" />
            <h3>Waitlist</h3>
            <p>Smart queue with auto-seating suggestions</p>
          </VaCardContent>
        </VaCard>
        <VaCard class="feature-card" hoverable>
          <VaCardContent>
            <Icon icon="mdi:currency-usd" width="48" height="48" class="feature-icon" />
            <h3>Revenue Reports</h3>
            <p>Track payments and generate insights</p>
          </VaCardContent>
        </VaCard>
        <VaCard class="feature-card" hoverable>
          <VaCardContent>
            <Icon icon="mdi:shield-account" width="48" height="48" class="feature-icon" />
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
  background: linear-gradient(180deg, #fffef8 0%, #fff8f0 100%);
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 60px var(--x-spacing-mobile) 40px;
  flex-wrap: wrap;
}

.hero-content {
  flex: 1;
  max-width: 500px;
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  background: var(--restaurant-accent);
  color: white;
  font-family: "Inter-Medium";
  font-size: 12px;
  border-radius: 20px;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-title {
  font-family: "Inter-Bold", Inter, -apple-system, sans-serif;
  font-size: 36px;
  color: var(--restaurant-primary);
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.hero-subtitle {
  font-family: "Inter-Light";
  font-size: 16px;
  color: var(--restaurant-secondary);
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button {
  font-family: "Inter-Medium";
}

.hero-visual {
  flex: 1;
  display: none;
  justify-content: center;
}

.feature-highlight {
  padding: 30px;
  background: white;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--restaurant-primary);
}

.features-section {
  padding: 60px var(--x-spacing-mobile) 80px;
  text-align: center;
}

.section-title {
  font-family: "Inter-Bold";
  font-size: 28px;
  color: var(--restaurant-primary);
  margin: 0 0 40px 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  color: var(--restaurant-accent);
  margin-bottom: 16px;
}

.feature-card h3 {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--restaurant-primary);
  margin: 0 0 8px 0;
}

.feature-card p {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--restaurant-secondary);
  margin: 0;
}

@media screen and (min-width: 1024px) {
  .hero-section {
    padding: 80px var(--x-spacing-desktop) 60px;
  }
  
  .hero-title {
    font-size: 48px;
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
    padding: 80px var(--x-spacing-desktop) 100px;
  }
}
</style>