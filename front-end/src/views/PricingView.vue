<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const plans = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const billingPeriod = ref<"monthly" | "yearly">("monthly");

const goToRegister = () => {
  router.push("/tenant/signup");
};

onMounted(async () => {
  try {
    const response = await fetch("/api/v1/public/plans");
    const data = await response.json();
    if (data.success) {
      plans.value = data.plans || [];
    }
  } catch (err) {
    error.value = "Unable to load pricing. Please try again later.";
  } finally {
    loading.value = false;
  }
});

const formatPrice = (price: number, currency: string) => {
  if (!price && price !== 0) return "Free";
  const symbol = currency === "GHS" ? "₵" : currency === "USD" ? "$" : currency;
  return `${symbol}${Number(price).toLocaleString()}`;
};

const features = [
  "Table management",
  "Reservation scheduling",
  "Customer profiles",
  "Menu management",
  "Reports & analytics",
  "WhatsApp integration",
  "Paystack payments",
  "Email support",
];
</script>

<template>
  <div class="pricing-root">
    <nav class="pricing-nav">
      <div class="nav-inner">
        <div class="nav-brand" @click="router.push('/')">
          <Icon icon="mdi:silverware-fork-knife" width="28" height="28" />
          <span>Vibespot</span>
        </div>
        <div class="nav-actions">
          <button class="nav-link" @click="router.push('/')">Home</button>
          <template v-if="!authStore.isAuthenticated">
            <button class="nav-link" @click="router.push('/customer/login')">
              Login
            </button>
            <button class="nav-btn" @click="goToRegister">Get Started</button>
          </template>
          <template v-else>
            <button class="nav-btn" @click="router.push('/portal')">
              Dashboard
            </button>
          </template>
        </div>
      </div>
    </nav>

    <section class="pricing-hero">
      <h1>Simple, transparent pricing</h1>
      <p>
        No hidden fees. Scale as you grow. All plans include WhatsApp ordering
        and Paystack payments.
      </p>
      <div class="billing-toggle">
        <button
          :class="['toggle-btn', billingPeriod === 'monthly' && 'active']"
          @click="billingPeriod = 'monthly'"
        >
          Monthly
        </button>
        <button
          :class="['toggle-btn', billingPeriod === 'yearly' && 'active']"
          @click="billingPeriod = 'yearly'"
        >
          Yearly <span class="save-badge">Save 20%</span>
        </button>
      </div>
    </section>

    <section class="pricing-cards">
      <div v-if="loading" class="loading-state">Loading plans...</div>
      <div v-else-if="error" class="error-state">{{ error }}</div>
      <div v-else-if="!plans.length" class="empty-state">
        No plans available right now.
      </div>
      <div v-else class="cards-grid">
        <div v-for="plan in plans" :key="plan.id" class="plan-card">
          <div class="plan-header">
            <h3>{{ plan.name }}</h3>
            <div class="plan-price">
              <span class="price-amount">{{
                formatPrice(
                  billingPeriod === "yearly" ? plan.price * 10 : plan.price,
                  plan.currency
                )
              }}</span>
              <span class="price-period"
                >/ {{ billingPeriod === "yearly" ? "year" : "month" }}</span
              >
            </div>
          </div>
          <ul class="plan-features">
            <li>
              <Icon icon="mdi:check" width="18" /> Up to
              {{ plan.maxTables }} tables
            </li>
            <li>
              <Icon icon="mdi:check" width="18" />
              {{ plan.maxReservationsPerMonth.toLocaleString() }}
              reservations/month
            </li>
            <li v-for="feature in features" :key="feature">
              <Icon icon="mdi:check" width="18" /> {{ feature }}
            </li>
          </ul>
          <button class="plan-cta" @click="goToRegister">
            Start free trial
          </button>
        </div>
      </div>
    </section>

    <section class="pricing-faq">
      <h2>Frequently asked questions</h2>
      <div class="faq-list">
        <div class="faq-item">
          <h4>Can I switch plans later?</h4>
          <p>
            Yes. Upgrade or downgrade anytime from your dashboard. Prorated
            billing applies automatically.
          </p>
        </div>
        <div class="faq-item">
          <h4>Do you offer a free trial?</h4>
          <p>
            Every plan includes a 14-day free trial. No credit card required to
            start.
          </p>
        </div>
        <div class="faq-item">
          <h4>What payment methods do you support?</h4>
          <p>
            We accept Mobile Money (Momo), Visa/Mastercard, and bank transfers
            via Paystack — all in GHS.
          </p>
        </div>
        <div class="faq-item">
          <h4>Is my data secure?</h4>
          <p>
            Yes. We comply with Ghana’s Data Protection Act 2012 and use
            encrypted storage with daily backups.
          </p>
        </div>
      </div>
    </section>

    <footer class="pricing-footer">
      <p>© 2026 Vibespot Technologies Ltd. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.pricing-root {
  min-height: 100vh;
  background: #faf9f7;
  color: #312e2a;
  font-family: inherit;
}
.pricing-nav {
  background: #ffffff;
  border-bottom: 1px solid #e7e4de;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  font-size: 1.15rem;
  cursor: pointer;
  color: #1a1410;
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.nav-link {
  background: transparent;
  border: none;
  color: #4a4540;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 0.4rem;
}
.nav-link:hover {
  background: #f3f1ed;
}
.nav-btn {
  background: #1a1410;
  color: #fff;
  border: none;
  padding: 0.55rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}
.pricing-hero {
  text-align: center;
  padding: 4rem 1.5rem 2rem;
}
.pricing-hero h1 {
  font-size: 2.5rem;
  margin: 0 0 0.75rem;
  color: #1a1410;
}
.pricing-hero p {
  color: #645d54;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto 1.5rem;
}
.billing-toggle {
  display: inline-flex;
  background: #ffffff;
  border: 1px solid #d6d1c9;
  border-radius: 0.5rem;
  padding: 0.25rem;
  gap: 0.25rem;
}
.toggle-btn {
  background: transparent;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.4rem;
  cursor: pointer;
  font-weight: 500;
  color: #4a4540;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.toggle-btn.active {
  background: #1a1410;
  color: #fff;
}
.save-badge {
  background: #d97706;
  color: #fff;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  font-weight: 700;
}
.pricing-cards {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem 4rem;
}
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #645d54;
}
.error-state {
  color: #e11d48;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
.plan-card {
  background: #ffffff;
  border: 1px solid #e7e4de;
  border-radius: 0.75rem;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.plan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}
.plan-header {
  margin-bottom: 1rem;
}
.plan-header h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #1a1410;
}
.plan-price {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}
.price-amount {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1410;
}
.price-period {
  color: #645d54;
  font-size: 0.95rem;
}
.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  flex: 1;
}
.plan-features li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  color: #4a4540;
  font-size: 0.95rem;
}
.plan-features li :deep(svg) {
  color: #4d7c0f;
}
.plan-cta {
  width: 100%;
  padding: 0.7rem;
  background: #1a1410;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}
.plan-cta:hover {
  background: #2d221c;
}
.pricing-faq {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}
.pricing-faq h2 {
  text-align: center;
  margin: 0 0 2rem;
  color: #1a1410;
}
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.faq-item {
  background: #ffffff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1.25rem;
}
.faq-item h4 {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  color: #1a1410;
}
.faq-item p {
  margin: 0;
  color: #645d54;
  font-size: 0.95rem;
  line-height: 1.5;
}
.pricing-footer {
  text-align: center;
  padding: 2rem;
  color: #9a9389;
  font-size: 0.9rem;
  border-top: 1px solid #e7e4de;
}
</style>
