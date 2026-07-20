<script setup lang="ts">
import { VaButton, VaCard, VaCardContent, VaChip } from "vuestic-ui";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { ref, onMounted, watch, onUnmounted } from "vue";

const router = useRouter();
const authStore = useAuthStore();

const navigateTo = (routeName: string) => router.push({ name: routeName });

const heroGlow = ref({ x: 0, y: 0, visible: false });
let heroEl: HTMLElement | null = null;

const onHeroMouseMove = (e: MouseEvent) => {
  if (!heroEl) return;
  const rect = heroEl.getBoundingClientRect();
  heroGlow.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    visible: true,
  };
};

const onHeroMouseLeave = () => {
  heroGlow.value.visible = false;
};

const initScrollReveal = () => {
  const sections = document.querySelectorAll<HTMLElement>(".reveal-section");
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
  );

  sections.forEach((section) => observer.observe(section));
};

const countersStarted = ref(false);
const stats = ref({
  restaurants: 0,
  reservations: 0,
  uptime: 0,
  satisfaction: 0,
});

const animateCounters = () => {
  if (countersStarted.value) return;
  countersStarted.value = true;

  const targets = {
    restaurants: 2500,
    reservations: 180000,
    uptime: 99,
    satisfaction: 98,
  };

  const duration = 2200;
  const startTime = performance.now();

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    stats.value = {
      restaurants: Math.floor(eased * targets.restaurants),
      reservations: Math.floor(eased * targets.reservations),
      uptime: Math.floor(eased * targets.uptime),
      satisfaction: Math.floor(eased * targets.satisfaction),
    };

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

onMounted(() => {
  heroEl = document.querySelector(".hero-spotlight");
  if (heroEl) {
    heroEl.addEventListener("mousemove", onHeroMouseMove);
    heroEl.addEventListener("mouseleave", onHeroMouseLeave);
  }

  initScrollReveal();

  const statsSection = document.querySelector(".stats-counter-section");
  if (statsSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(statsSection);
  }
});

onUnmounted(() => {
  if (heroEl) {
    heroEl.removeEventListener("mousemove", onHeroMouseMove);
    heroEl.removeEventListener("mouseleave", onHeroMouseLeave);
  }
});

watch(
  () => authStore.isLoading,
  (loading) => {
    if (!loading && authStore.isAuthenticated) {
      router.replace("/dashboard");
    }
  }
);
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
      <div class="preview-content">
        <div class="stats-grid">
          <VaCard class="stat-card" hoverable>
            <VaCardContent>
              <div class="stat-header">
                <div class="stat-icon today-icon">
                  <Icon icon="mdi:calendar-today" width="24" height="24" />
                </div>
                <VaChip color="primary" size="small">Today</VaChip>
              </div>
              <div class="stat-value">0</div>
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
              <div class="stat-value">0</div>
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
              <div class="stat-value">GHS 0</div>
              <div class="stat-label">Revenue</div>
            </VaCardContent>
          </VaCard>
          <VaCard class="stat-card" hoverable>
            <VaCardContent>
              <div class="stat-header">
                <div class="stat-icon occupancy-icon">
                  <Icon icon="mdi:chart-donut" width="24" height="24" />
                </div>
                <VaChip color="primary" size="small">0%</VaChip>
              </div>
              <div class="stat-value">0/0</div>
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
                  >View All</VaButton
                >
              </div>
              <div class="empty-state-inline"><p>No reservations yet.</p></div>
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
      <section class="hero-section hero-spotlight">
        <div
          class="hero-glow"
          :style="{
            background: heroGlow.visible
              ? `radial-gradient(600px circle at ${heroGlow.x}px ${heroGlow.y}px, rgba(217,119,6,0.12), transparent 40%)`
              : 'none',
          }"
        ></div>
        <div class="hero-content">
          <div class="badge">
            <Icon icon="mdi:star-four-points" width="16" height="16" />
            Restaurant Management
          </div>
          <h1 class="hero-title">
            Table Reservations<br /><span class="hero-title-accent"
              >Simplified</span
            >
          </h1>
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
              <template #icon
                ><Icon icon="mdi:calendar-plus" width="20" height="20"
              /></template>
              New Reservation
            </VaButton>
            <VaButton
              preset="secondary"
              size="large"
              class="cta-button"
              @click="navigateTo('login')"
            >
              <template #icon
                ><Icon icon="mdi:login" width="20" height="20"
              /></template>
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
      </section>

      <section class="stats-counter-section reveal-section">
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-number">
              {{ stats.restaurants.toLocaleString() }}
            </div>
            <div class="stat-text">Restaurants</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">
              {{ stats.reservations.toLocaleString() }}
            </div>
            <div class="stat-text">Reservations</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.uptime }}%</div>
            <div class="stat-text">Uptime</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.satisfaction }}%</div>
            <div class="stat-text">Satisfaction</div>
          </div>
        </div>
      </section>

      <section class="how-it-works reveal-section">
        <div class="section-header">
          <h2 class="section-title">How It Works</h2>
          <p class="section-subtitle">
            Get started in minutes with our simple three-step process
          </p>
        </div>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">01</div>
            <div class="step-icon">
              <Icon icon="mdi:account-plus" width="32" height="32" />
            </div>
            <h3 class="step-title">Create Account</h3>
            <p class="step-desc">
              Sign up in seconds and set up your restaurant profile with your
              details.
            </p>
          </div>
          <div class="step-card">
            <div class="step-number">02</div>
            <div class="step-icon">
              <Icon icon="mdi:table-chair" width="32" height="32" />
            </div>
            <h3 class="step-title">Setup Tables</h3>
            <p class="step-desc">
              Configure your floor plan, table capacities, and dining area
              layout visually.
            </p>
          </div>
          <div class="step-card">
            <div class="step-number">03</div>
            <div class="step-icon">
              <Icon icon="mdi:calendar-check" width="32" height="32" />
            </div>
            <h3 class="step-title">Start Booking</h3>
            <p class="step-desc">
              Begin accepting reservations, manage waitlists, and delight your
              guests.
            </p>
          </div>
        </div>
      </section>

      <section class="features-section reveal-section">
        <div class="section-header">
          <h2 class="section-title">Everything You Need</h2>
          <p class="section-subtitle">
            Powerful features to streamline your restaurant operations
          </p>
        </div>
        <div class="features-grid">
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <div class="feature-icon-wrapper">
                <Icon
                  icon="mdi:table-multiple"
                  width="28"
                  height="28"
                  class="feature-icon"
                />
              </div>
              <h3>Floor Plan</h3>
              <p>Visual drag-and-drop seating management</p>
            </VaCardContent>
          </VaCard>
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <div class="feature-icon-wrapper">
                <Icon
                  icon="mdi:account-clock"
                  width="28"
                  height="28"
                  class="feature-icon"
                />
              </div>
              <h3>Waitlist</h3>
              <p>Smart queue with auto-seating suggestions</p>
            </VaCardContent>
          </VaCard>
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <div class="feature-icon-wrapper">
                <Icon
                  icon="mdi:currency-usd"
                  width="28"
                  height="28"
                  class="feature-icon"
                />
              </div>
              <h3>Revenue Reports</h3>
              <p>Track payments and generate insights</p>
            </VaCardContent>
          </VaCard>
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <div class="feature-icon-wrapper">
                <Icon
                  icon="mdi:shield-account"
                  width="28"
                  height="28"
                  class="feature-icon"
                />
              </div>
              <h3>Secure Access</h3>
              <p>Role-based permissions and audit logs</p>
            </VaCardContent>
          </VaCard>
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <div class="feature-icon-wrapper">
                <Icon
                  icon="mdi:cellphone"
                  width="28"
                  height="28"
                  class="feature-icon"
                />
              </div>
              <h3>Mobile Ready</h3>
              <p>Manage on the go with our responsive interface</p>
            </VaCardContent>
          </VaCard>
          <VaCard class="feature-card" hoverable>
            <VaCardContent>
              <div class="feature-icon-wrapper">
                <Icon
                  icon="mdi:chart-areaspline"
                  width="28"
                  height="28"
                  class="feature-icon"
                />
              </div>
              <h3>Analytics</h3>
              <p>Real-time insights into your restaurant performance</p>
            </VaCardContent>
          </VaCard>
        </div>
      </section>

      <section class="testimonials reveal-section">
        <div class="section-header">
          <h2 class="section-title">Loved by Restaurants</h2>
          <p class="section-subtitle">See what our customers have to say</p>
        </div>
        <div class="testimonials-grid">
          <VaCard class="testimonial-card" hoverable>
            <VaCardContent>
              <div class="testimonial-rating">
                <Icon
                  v-for="n in 5"
                  :key="n"
                  icon="mdi:star"
                  width="18"
                  height="18"
                  class="star-icon"
                />
              </div>
              <p class="testimonial-text">
                "This platform transformed how we manage reservations. Our
                no-show rate dropped by 40% in the first month."
              </p>
              <div class="testimonial-author">
                <div class="author-avatar">AK</div>
                <div class="author-info">
                  <div class="author-name">Ama K.</div>
                  <div class="author-role">Owner, Golden Spoon</div>
                </div>
              </div>
            </VaCardContent>
          </VaCard>
          <VaCard class="testimonial-card" hoverable>
            <VaCardContent>
              <div class="testimonial-rating">
                <Icon
                  v-for="n in 5"
                  :key="n"
                  icon="mdi:star"
                  width="18"
                  height="18"
                  class="star-icon"
                />
              </div>
              <p class="testimonial-text">
                "The waitlist feature alone is worth it. Auto-seating
                suggestions have made our hosts so much more efficient."
              </p>
              <div class="testimonial-author">
                <div class="author-avatar">KO</div>
                <div class="author-info">
                  <div class="author-name">Kwame O.</div>
                  <div class="author-role">Manager, Savanna Grill</div>
                </div>
              </div>
            </VaCardContent>
          </VaCard>
          <VaCard class="testimonial-card" hoverable>
            <VaCardContent>
              <div class="testimonial-rating">
                <Icon
                  v-for="n in 5"
                  :key="n"
                  icon="mdi:star"
                  width="18"
                  height="18"
                  class="star-icon"
                />
              </div>
              <p class="testimonial-text">
                "Finally, a reservation system built for Ghana. Mobile Money
                integration and GHS pricing work flawlessly."
              </p>
              <div class="testimonial-author">
                <div class="author-avatar">EA</div>
                <div class="author-info">
                  <div class="author-name">Efua A.</div>
                  <div class="author-role">Director, La Palm Beach</div>
                </div>
              </div>
            </VaCardContent>
          </VaCard>
        </div>
      </section>

      <section class="cta-section reveal-section">
        <div class="cta-card">
          <h2 class="cta-title">Ready to streamline your restaurant?</h2>
          <p class="cta-subtitle">
            Join hundreds of restaurants already using our platform.
          </p>
          <div class="cta-actions">
            <VaButton
              preset="primary"
              size="large"
              @click="navigateTo('register')"
            >
              <template #icon
                ><Icon icon="mdi:account-plus" width="20" height="20"
              /></template>
              Get Started Free
            </VaButton>
            <VaButton
              preset="secondary"
              size="large"
              @click="navigateTo('login')"
            >
              <template #icon
                ><Icon icon="mdi:login" width="20" height="20"
              /></template>
              Sign In
            </VaButton>
          </div>
        </div>
      </section>

      <footer class="landing-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <Icon
              icon="mdi:silverware-fork-knife"
              width="28"
              height="28"
            /><span>RTRS</span>
          </div>
          <p class="footer-text">
            Restaurant Table Reservation System by Vibespot Technologies Ltd.
          </p>
          <p class="footer-copy">&copy; 2026 All rights reserved.</p>
        </div>
      </footer>
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
  color: var(--sky-600);
}
.waitlist-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--accent-600);
}
.revenue-icon {
  background: rgba(22, 163, 74, 0.1);
  color: var(--earth-600);
}
.occupancy-icon {
  background: rgba(220, 38, 38, 0.1);
  color: var(--rose-600);
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
  margin-top: var(--space-8);
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
  background: var(--neutral-50);
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
  overflow: hidden;
}
.hero-section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-10);
  padding: var(--space-20) var(--space-6) var(--space-16);
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
  overflow: hidden;
}
.hero-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}
.hero-content {
  flex: 1;
  max-width: 600px;
  text-align: center;
  position: relative;
  z-index: 1;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
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
  letter-spacing: 0.14em;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.hero-title {
  font-family: var(--font-sans);
  font-size: var(--text-5xl);
  color: var(--ink);
  margin: 0 0 var(--space-4) 0;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
  font-weight: 700;
}
.hero-title-accent {
  background: linear-gradient(
    135deg,
    var(--accent-500) 0%,
    var(--accent-400) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  color: var(--ink-secondary);
  margin: 0 0 var(--space-8) 0;
  line-height: var(--leading-relaxed);
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
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
  height: 56px;
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
  .hero-subtitle {
    margin-left: 0;
    margin-right: 0;
  }
  .hero-actions {
    justify-content: flex-start;
  }
}

.stats-counter-section {
  padding: var(--space-16) var(--space-6);
  background: linear-gradient(
    180deg,
    var(--brand-900) 0%,
    var(--brand-800) 100%
  );
  color: white;
  text-align: center;
}
.stats-container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-8);
  align-items: center;
}
@media (min-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(4, 1fr);
  }
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.stat-number {
  font-family: var(--font-serif);
  font-size: var(--text-4xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  background: linear-gradient(
    135deg,
    var(--accent-300) 0%,
    var(--accent-400) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--brand-200);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
}
.stat-divider {
  display: none;
}
@media (min-width: 768px) {
  .stat-divider {
    display: block;
    width: 1px;
    height: 60px;
    background: rgba(255, 255, 255, 0.15);
    margin: 0 auto;
  }
}

.how-it-works {
  padding: var(--space-20) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}
.section-header {
  margin-bottom: var(--space-12);
}
.section-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  color: var(--ink-secondary);
  margin: var(--space-3) 0 0 0;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
  line-height: var(--leading-relaxed);
}
.steps-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--space-8);
}
@media (min-width: 768px) {
  .steps-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.step-card {
  position: relative;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--border);
  text-align: left;
  transition: transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}
.step-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.step-number {
  font-family: var(--font-serif);
  font-size: var(--text-5xl);
  font-weight: 700;
  color: var(--brand-100);
  line-height: 1;
  margin-bottom: var(--space-4);
}
.step-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: linear-gradient(
    135deg,
    var(--brand-800) 0%,
    var(--brand-700) 100%
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-5);
}
.step-title {
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-3) 0;
}
.step-desc {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--ink-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.features-section {
  padding: var(--space-20) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
  max-width: 1100px;
  margin: 0 auto;
}
.feature-card {
  text-align: left;
  transition: transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.feature-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    135deg,
    var(--accent-100) 0%,
    var(--accent-50) 100%
  );
  color: var(--accent-600);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}
.feature-icon {
  color: var(--accent-600);
}
.feature-card h3 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  color: var(--ink);
  margin: 0 0 var(--space-2) 0;
}
.feature-card p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0;
  line-height: var(--leading-relaxed);
}

.testimonials {
  padding: var(--space-20) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--space-6);
  max-width: 1100px;
  margin: 0 auto;
}
@media (min-width: 768px) {
  .testimonials-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.testimonial-card {
  text-align: left;
  transition: transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}
.testimonial-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.testimonial-rating {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
  color: var(--accent-400);
}
.star-icon {
  color: var(--accent-400);
}
.testimonial-text {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--ink);
  line-height: var(--leading-relaxed);
  margin: 0 0 var(--space-6) 0;
  font-style: italic;
}
.testimonial-author {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    135deg,
    var(--brand-800) 0%,
    var(--brand-700) 100%
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 700;
}
.author-info {
  display: flex;
  flex-direction: column;
}
.author-name {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
}
.author-role {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-muted);
}

.cta-section {
  padding: var(--space-20) var(--space-6);
  background: linear-gradient(
    180deg,
    var(--brand-900) 0%,
    var(--brand-800) 100%
  );
  text-align: center;
}
.cta-card {
  max-width: 700px;
  margin: 0 auto;
}
.cta-title {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: white;
  margin: 0 0 var(--space-4) 0;
  letter-spacing: var(--tracking-tight);
}
.cta-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  color: var(--brand-200);
  margin: 0 0 var(--space-8) 0;
  line-height: var(--leading-relaxed);
}
.cta-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.landing-footer {
  padding: var(--space-12) var(--space-6);
  background: var(--brand-900);
  color: var(--brand-200);
  text-align: center;
}
.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  color: white;
}
.footer-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--brand-200);
  margin: 0;
}
.footer-copy {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--brand-300);
  margin: 0;
}

.reveal-section {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}
.reveal-section.is-revealed {
  opacity: 1;
  transform: translateY(0);
}
</style>
