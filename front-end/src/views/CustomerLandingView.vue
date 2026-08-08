<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import menuAPI from "@/services/menuAPI";
import tableAPI from "@/services/tableAPI";
import salonAPI from "@/services/salonAPI";
import { useCartStore } from "@/stores/cart";
import logger from "@/utils/logger";
import LandingHero from "@/components/LandingHero.vue";
import PreviewSection from "@/components/PreviewSection.vue";
import CtaStrip from "@/components/CtaStrip.vue";
import MarqueeStrip from "@/components/MarqueeStrip.vue";
import FeaturesStrip from "@/components/FeaturesStrip.vue";
import LandingFooter from "@/components/LandingFooter.vue";
import { useCurrency } from "@/composables/useCurrency";
import { Icon } from "@iconify/vue";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const { format: fmt } = useCurrency();

const loading = ref(true);
const menuItems = ref<any[]>([]);
const tables = ref<any[]>([]);
const services = ref<any[]>([]);
const activeTab = ref<"menu" | "tables" | "services">("menu");
const addingToCart = ref<number | null>(null);
const heroLoaded = ref(false);
const apiError = ref(false);
const businessVertical = computed(
  () =>
    authStore.currentTenant?.businessVertical ||
    authStore.capabilities?.businessVertical ||
    "restaurant"
);
const isSalon = computed(() => businessVertical.value === "salon");

const isAuthenticated = computed(() => authStore.isAuthenticated);
const menuTotal = computed(() => cartStore.total);
const menuCount = computed(() => cartStore.count);
const capabilities = computed(() => authStore.capabilities);
const hasDineIn = computed(() =>
  capabilities.value?.serviceModes?.includes("dine_in")
);
const hasDelivery = computed(() =>
  capabilities.value?.serviceModes?.includes("delivery")
);
const hasTableManagement = computed(
  () => capabilities.value?.featureFlags?.table_management
);

onMounted(async () => {
  if (isSalon.value) {
    activeTab.value = "services";
    await loadServices();
  } else {
    await Promise.all([loadMenu(), loadTables()]);
  }
  heroLoaded.value = true;
  initScrollReveal();
});

onUnmounted(() => {});

watch(
  () => businessVertical.value,
  (vertical) => {
    if (typeof document !== "undefined") {
      const allowed = ["restaurant", "salon"];
      const safe = allowed.includes(vertical) ? vertical : "";
      document.documentElement.setAttribute("data-vertical", safe);
    }
  },
  { immediate: true }
);

const loadMenu = async () => {
  try {
    const res = await menuAPI.getAvailableMenu();
    menuItems.value = (res.data?.items || []).slice(0, 8);
  } catch (err) {
    menuItems.value = [];
    apiError.value = true;
    logger.error("Failed to load menu", { error: err });
  } finally {
    loading.value = false;
  }
};

const loadTables = async () => {
  try {
    const res = await tableAPI.getTables();
    const all = res.data?.tables || res.data || [];
    tables.value = all.filter((t: any) => t.status === "available").slice(0, 6);
  } catch (err) {
    tables.value = [];
    apiError.value = true;
    logger.error("Failed to load tables", { error: err });
  }
};

const loadServices = async () => {
  try {
    const res = await salonAPI.getServices();
    services.value = (res.data?.data || res.data || []).slice(0, 8);
  } catch (err) {
    services.value = [];
    apiError.value = true;
    logger.error("Failed to load services", { error: err });
  } finally {
    loading.value = false;
  }
};

const addToCart = async (item: any) => {
  addingToCart.value = item.id;
  try {
    cartStore.addItem({
      menuItemId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      selectedOptions: [],
      itemNotes: null,
    });
    await new Promise((r) => setTimeout(r, 400));
  } catch (err) {
    logger.error("Failed to add to cart", { error: err });
  } finally {
    addingToCart.value = null;
  }
};

const goToCheckout = () => {
  if (menuCount.value === 0) return;
  router.push("/checkout");
};

const goToMenu = () => router.push("/menu");
const goToReserve = () => {
  if (isSalon.value) {
    if (!isAuthenticated.value) {
      router.push({ name: "login", query: { redirect: "/salon/calendar" } });
    } else {
      router.push("/salon/calendar");
    }
    return;
  }
  if (!isAuthenticated.value) {
    router.push({ name: "login", query: { redirect: "/new-reservation" } });
  } else {
    router.push("/new-reservation");
  }
};
const goToLogin = () => router.push("/login");
const goToRegister = () => router.push("/register");

const initScrollReveal = () => {
  const sections = document.querySelectorAll<HTMLElement>(".reveal-section");
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("is-revealed");
          }, index * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
  );

  sections.forEach((section) => observer.observe(section));
};

onMounted(() => {
  initScrollReveal();
});
</script>

<template>
  <div class="landing-root">
    <nav class="landing-nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <Icon icon="mdi:silverware-fork-knife" width="28" height="28" />
          <span>Vibespot</span>
        </div>
        <div class="nav-actions">
          <button v-if="!isSalon" class="nav-link" @click="goToMenu">
            Menu
          </button>
          <button class="nav-link" @click="goToReserve">
            {{ isSalon ? "Book Appointment" : "Reserve" }}
          </button>
          <button class="nav-link" @click="router.push('/pricing')">
            Pricing
          </button>
          <button class="nav-link" @click="router.push('/status')">
            Status
          </button>
          <button class="nav-link" @click="router.push('/changelog')">
            Changelog
          </button>
          <button class="nav-link" @click="router.push('/help')">Help</button>
          <button class="nav-link" @click="router.push('/api-docs')">
            API Docs
          </button>
          <template v-if="!isAuthenticated">
            <button class="nav-link" @click="goToLogin">Login</button>
            <button class="nav-btn" @click="goToRegister">Get Started</button>
          </template>
          <template v-else>
            <button class="nav-btn" @click="router.push('/dashboard')">
              Dashboard
            </button>
          </template>
        </div>
      </div>
    </nav>

    <LandingHero
      :hasDineIn="hasDineIn"
      :hasDelivery="hasDelivery"
      :isSalon="isSalon"
      @menu="goToMenu"
      @reserve="goToReserve"
    />

    <PreviewSection
      :isSalon="isSalon"
      :hasTableManagement="hasTableManagement"
      :loading="loading"
      :apiError="apiError"
      v-model:activeTab="activeTab"
      :menuItems="menuItems"
      :tables="tables"
      :services="services"
      :addingToCart="addingToCart"
      @addToCart="addToCart"
      @reserve="goToReserve"
    />

    <CtaStrip :isSalon="isSalon" @menu="goToMenu" @reserve="goToReserve" />

    <MarqueeStrip :isSalon="isSalon" />

    <FeaturesStrip :isSalon="isSalon" />

    <LandingFooter>
      <template #admin-link>
        <button
          v-if="
            isAuthenticated &&
            (authStore.user?.role === 'admin' ||
              authStore.user?.role === 'manager' ||
              authStore.user?.role === 'staff')
          "
          class="admin-link"
          @click="router.push('/dashboard')"
        >
          <Icon icon="mdi:cog" width="14" height="14" />
          Staff / Admin
        </button>
      </template>
    </LandingFooter>

    <Transition name="cart-fly">
      <button
        v-if="!isSalon && menuCount > 0"
        class="floating-cart"
        @click="goToCheckout"
        aria-label="Open cart"
      >
        <Icon icon="mdi:cart" width="22" height="22" />
        <span class="cart-count">{{ menuCount }}</span>
        <span class="cart-total">{{ fmt(menuTotal) }}</span>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
/* ─── Base ─── */
.landing-root {
  min-height: 100vh;
  background: var(--background-warm);
  color: var(--ink);
  font-family: var(--font-sans);
  overflow-x: hidden;
}

/* ─── Navigation ─── */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid var(--border);
  transition: all 0.3s ease;
}

@supports (backdrop-filter: blur(1px)) {
  .landing-nav {
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    will-change: transform;
  }
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--neutral-900);
  letter-spacing: -0.02em;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  background: transparent;
  border: none;
  color: var(--ink-secondary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--ink);
  background: var(--neutral-100);
}

.nav-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
  transition: all 0.2s ease;
}

.nav-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.35);
}

.nav-btn:active {
  transform: translateY(0) scale(0.98);
}

/* ─── Hero ─── */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 80px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-slide {
  position: absolute;
  inset: -40px;
  animation: heroFade 16s ease-in-out infinite;
}

.hero-slide:nth-child(1) {
  animation-delay: 0s;
}
.hero-slide:nth-child(2) {
  animation-delay: 4s;
}
.hero-slide:nth-child(3) {
  animation-delay: 8s;
}
.hero-slide:nth-child(4) {
  animation-delay: 12s;
}

.hero-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: kenBurns 20s ease-in-out infinite alternate;
  will-change: transform;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(26, 20, 16, 0.55) 0%,
    rgba(26, 20, 16, 0.35) 40%,
    rgba(26, 20, 16, 0.65) 100%
  );
  z-index: 1;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
  animation: float 14s ease-in-out infinite;
}

.hero-orb-1 {
  width: 520px;
  height: 520px;
  background: var(--accent-300);
  top: -180px;
  left: -120px;
  animation-delay: 0s;
}

.hero-orb-2 {
  width: 420px;
  height: 420px;
  background: var(--earth-300);
  bottom: -120px;
  right: -100px;
  animation-delay: 5s;
}

.hero-orb-3 {
  width: 320px;
  height: 320px;
  background: var(--sky-300);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 9s;
}

.hero-glow {
  position: absolute;
  inset: 0;
  transition: background 0.12s ease;
  pointer-events: none;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-35px) scale(1.06);
  }
}

@keyframes kenBurns {
  0% {
    transform: scale(1) translate(0, 0);
  }
  100% {
    transform: scale(1.08) translate(-10px, -8px);
  }
}

@keyframes heroFade {
  0%,
  18% {
    opacity: 1;
  }
  20%,
  38% {
    opacity: 0;
  }
  40%,
  58% {
    opacity: 1;
  }
  60%,
  78% {
    opacity: 0;
  }
  80%,
  98% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.hero-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease 0.2s forwards;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(40px, 7vw, 72px);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin: 0 0 20px;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.7s ease 0.35s forwards;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.35);
}

.hero-accent {
  background: linear-gradient(135deg, var(--accent-400), var(--earth-400));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: clamp(16px, 2.2vw, 20px);
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
  margin: 0 auto 32px;
  line-height: 1.6;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.7s ease 0.5s forwards;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.3);
}

.hero-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.7s ease 0.65s forwards;
}

.btn-primary-lg {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.3);
  transition: all 0.25s ease;
}

.btn-primary-lg:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(217, 119, 6, 0.4);
}

.btn-primary-lg:active {
  transform: translateY(-1px) scale(0.98);
}

.btn-secondary-lg {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border: 1.5px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.8);
  color: var(--neutral-800);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;
}

.btn-secondary-lg:hover {
  transform: translateY(-3px);
  border-color: var(--neutral-400);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  background: white;
}

.btn-secondary-lg:active {
  transform: translateY(-1px) scale(0.98);
}

.hero-social-proof {
  margin-top: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.7s ease 0.8s forwards;
}

.hero-avatars {
  display: flex;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  border: 2.5px solid white;
  margin-left: -12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.avatar:first-child {
  margin-left: 0;
}

.avatar:hover {
  transform: translateY(-3px) scale(1.1);
  z-index: 2;
}

.avatar-1 {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
}
.avatar-2 {
  background: linear-gradient(135deg, var(--earth-400), var(--earth-600));
}
.avatar-3 {
  background: linear-gradient(135deg, var(--sky-400), var(--sky-600));
}

.hero-proof-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
}

.proof-bold {
  font-weight: 700;
  color: #ffffff;
}

/* ─── Preview Section ─── */
.preview-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
}

.section-header {
  text-align: center;
  margin-bottom: 36px;
}

.section-title {
  font-family: var(--font-serif);
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.section-subtitle {
  color: var(--neutral-600);
  font-size: 16px;
  margin: 0;
}

.tab-bar {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 36px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border);
  background: white;
  color: var(--ink-secondary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab:hover {
  border-color: var(--neutral-300);
  color: var(--ink);
}

.tab-active {
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.menu-card {
  background: white;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.menu-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.menu-card-media {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.menu-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.menu-card:hover .menu-card-media img {
  transform: scale(1.08);
}

.media-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.media-badge.sold {
  background: rgba(244, 63, 94, 0.9);
  color: white;
  backdrop-filter: blur(4px);
}

.menu-card-body {
  padding: 18px;
}

.menu-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.menu-card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
}

.menu-price {
  font-weight: 700;
  color: var(--accent-600);
  font-size: 14px;
  white-space: nowrap;
}

.menu-card-desc {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dietary-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.dietary-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--neutral-100);
  color: var(--ink-secondary);
}

.add-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.2);
  transition: all 0.2s ease;
}

.add-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
}

.add-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-btn.adding {
  background: linear-gradient(135deg, #166534, #15803d);
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.table-card {
  background: white;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.table-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.table-media {
  height: 160px;
  overflow: hidden;
}

.table-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.table-card:hover .table-media img {
  transform: scale(1.08);
}

.table-body {
  padding: 18px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.table-capacity {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-secondary);
  background: var(--neutral-100);
  padding: 4px 10px;
  border-radius: 999px;
}

.table-section {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--ink-muted);
}

.btn-reserve {
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
  transition: all 0.2s ease;
}

.btn-reserve:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 119, 6, 0.35);
}

.btn-reserve:active {
  transform: translateY(0) scale(0.98);
}

/* ─── CTA Strip ─── */
.cta-strip {
  background: linear-gradient(
    135deg,
    var(--neutral-900) 0%,
    var(--brand-800) 100%
  );
  color: white;
  padding: 80px 24px;
  position: relative;
  overflow: hidden;
}

.cta-strip::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(217, 119, 6, 0.15), transparent 60%);
  pointer-events: none;
}

.cta-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.cta-inner h2 {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 700;
  color: #ffffff;
}

.cta-inner p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
}

.cta-actions {
  display: flex;
  gap: 12px;
}

.cta-strip .btn-primary-lg {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
}

.cta-strip .btn-secondary-lg {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(8px);
}

.cta-strip .btn-secondary-lg:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.3);
}

/* ─── Features ─── */
.features-strip {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.feature-item {
  text-align: center;
  padding: 32px 24px;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  background: white;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.06);
}

.feature-icon {
  display: inline-grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.feature-item:hover .feature-icon {
  transform: scale(1.1) rotate(-5deg);
}

.feature-item h3 {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}

.feature-item p {
  margin: 0;
  font-size: 14px;
  color: var(--ink-muted);
  line-height: 1.6;
}

/* ─── Footer ─── */
.landing-footer {
  border-top: 1px solid var(--border);
  padding: 48px 24px;
  text-align: center;
  background: white;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--ink);
}

.footer-text {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--ink-muted);
}

.footer-copy {
  margin: 0;
  font-size: 12px;
  color: var(--ink-subtle);
}

.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-link:hover {
  background: var(--neutral-100);
  color: var(--ink);
  border-color: var(--neutral-300);
}

/* ─── Floating Cart ─── */
.floating-cart {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(217, 119, 6, 0.35);
  z-index: 200;
  transition: all 0.25s ease;
}

.floating-cart:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 12px 36px rgba(217, 119, 6, 0.45);
}

.floating-cart:active {
  transform: translateY(0) scale(0.97);
}

.cart-count {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.cart-total {
  font-weight: 700;
}

/* ─── States ─── */
.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--ink-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-muted);
  font-size: 15px;
}

/* ─── Skeleton ─── */
.preview-skeleton {
  max-width: 1200px;
  margin: 0 auto;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.skeleton-card {
  background: white;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--card-shadow);
}
.skeleton-media {
  height: 200px;
  background: linear-gradient(
    90deg,
    var(--neutral-100) 25%,
    var(--neutral-200) 50%,
    var(--neutral-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-line {
  height: 14px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    90deg,
    var(--neutral-100) 25%,
    var(--neutral-200) 50%,
    var(--neutral-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-title {
  width: 70%;
  height: 18px;
}
.skeleton-text {
  width: 100%;
}
.skeleton-text.short {
  width: 50%;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ─── Animations ─── */
.reveal-section {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.8s ease,
    transform 0.8s ease;
}

.reveal-section.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cart-fly-enter-active,
.cart-fly-leave-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.cart-fly-enter-from,
.cart-fly-leave-to {
  opacity: 0;
  transform: translateY(24px) scale(0.92);
}

/* ─── Marquee ─── */
.marquee {
  overflow: hidden;
  background: linear-gradient(90deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  padding: 14px 0;
}
.marquee-track {
  display: inline-flex;
  gap: 48px;
  animation: marquee 18s linear infinite;
  white-space: nowrap;
}
.marquee-item {
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 13px;
}
@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* ─── Bento ─── */
.bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;
}
.bento-item {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: 22px;
  box-shadow: var(--card-shadow);
  text-align: center;
  transition: all 0.3s ease;
}
.bento-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.06);
}
.b1 {
  grid-column: span 4;
}
.b2 {
  grid-column: span 2;
}
.b3 {
  grid-column: span 2;
}
.b4 {
  grid-column: span 3;
}
.b5 {
  grid-column: span 3;
}
.b6 {
  grid-column: span 6;
}
.salon-bento {
  grid-template-columns: repeat(6, 1fr);
}
.salon-bento .b1 {
  grid-column: span 3;
}
.salon-bento .b2 {
  grid-column: span 3;
}
.salon-bento .b3 {
  grid-column: span 3;
}
.salon-bento .b4 {
  grid-column: span 2;
}
.salon-bento .b5 {
  grid-column: span 2;
}
.salon-bento .b6 {
  grid-column: span 2;
}
@media (max-width: 1024px) {
  .salon-bento {
    grid-template-columns: repeat(4, 1fr);
  }
  .salon-bento .b1,
  .salon-bento .b2,
  .salon-bento .b3 {
    grid-column: span 4;
  }
  .salon-bento .b4,
  .salon-bento .b5,
  .salon-bento .b6 {
    grid-column: span 2;
  }
}
@media (max-width: 640px) {
  .salon-bento {
    grid-template-columns: 1fr;
  }
  .salon-bento .b1,
  .salon-bento .b2,
  .salon-bento .b3,
  .salon-bento .b4,
  .salon-bento .b5,
  .salon-bento .b6 {
    grid-column: span 1;
  }
}
.bento-item .feature-icon {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  margin-bottom: 14px;
}
.bento-item h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.bento-item p {
  margin: 0;
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.55;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .hero {
    padding: 100px 20px 60px;
    min-height: auto;
  }

  .nav-actions .nav-link {
    display: none;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary-lg,
  .btn-secondary-lg {
    justify-content: center;
  }

  .cta-inner {
    flex-direction: column;
    text-align: center;
  }

  .cta-actions {
    width: 100%;
    justify-content: center;
  }

  .features-strip {
    grid-template-columns: 1fr;
  }

  .menu-grid,
  .tables-grid {
    grid-template-columns: 1fr;
  }
}

/* ─── Reduced motion ─── */
@media (prefers-reduced-motion: reduce) {
  .reveal-section {
    transition: none;
    opacity: 1;
    transform: none;
  }

  .hero-badge,
  .hero-title,
  .hero-subtitle,
  .hero-actions,
  .hero-social-proof {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .hero-orb {
    animation: none;
  }

  .menu-card:hover,
  .table-card:hover,
  .feature-item:hover {
    transform: none;
  }

  .menu-card-media img,
  .table-media img {
    transition: none;
  }
}
</style>
