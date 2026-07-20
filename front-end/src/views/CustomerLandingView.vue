<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import menuAPI from "@/services/menuAPI";
import tableAPI from "@/services/tableAPI";
import { useCartStore } from "@/stores/cart";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const { format: fmt } = useCurrency();

const loading = ref(true);
const menuItems = ref<any[]>([]);
const tables = ref<any[]>([]);
const activeTab = ref<"menu" | "tables">("menu");
const addingToCart = ref<number | null>(null);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const menuTotal = computed(() => cartStore.total);
const menuCount = computed(() => cartStore.count);

onMounted(async () => {
  await Promise.all([loadMenu(), loadTables()]);
});

const loadMenu = async () => {
  try {
    const res = await menuAPI.getAvailableMenu();
    menuItems.value = (res.data?.items || []).slice(0, 8);
  } catch (err) {
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
    logger.error("Failed to load tables", { error: err });
  }
};

const addToCart = async (item: any) => {
  addingToCart.value = item.id;
  try {
    cartStore.addItem({
      menuItemId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1,
      selectedOptions: [],
      itemNotes: null,
    });
    await new Promise((r) => setTimeout(r, 300));
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

const goToMenu = () => {
  router.push("/menu");
};

const goToReserve = (tableId?: number) => {
  if (!isAuthenticated.value) {
    router.push({ name: "login", query: { redirect: "/new-reservation" } });
  } else {
    router.push("/new-reservation");
  }
};

const goToLogin = () => router.push("/login");
const goToRegister = () => router.push("/register");

const dietaryTag = (item: any) => {
  const tags = item.dietaryTags || item.tags || [];
  return tags.slice(0, 2);
};
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
          <button class="nav-link" @click="goToMenu">Menu</button>
          <button class="nav-link" @click="goToReserve">Reserve</button>
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

    <section class="hero">
      <div class="hero-bg">
        <div class="hero-orb hero-orb-1"></div>
        <div class="hero-orb hero-orb-2"></div>
        <div class="hero-orb hero-orb-3"></div>
      </div>
      <div class="hero-content reveal-section">
        <div class="hero-badge">
          <Icon icon="mdi:whatsapp" width="16" height="16" />
          Order via WhatsApp
        </div>
        <h1 class="hero-title">
          Great food,<br />
          <span class="hero-accent">zero hassle.</span>
        </h1>
        <p class="hero-subtitle">
          Browse our menu, check free tables, and book your table in seconds.
          Takeaway, walk-in, or reservation — we’ve got you covered.
        </p>
        <div class="hero-actions">
          <button class="btn-primary-lg" @click="goToMenu">
            <Icon icon="mdi:book-open-outline" width="20" height="20" />
            View Menu
          </button>
          <button class="btn-secondary-lg" @click="goToReserve">
            <Icon icon="mdi:calendar-check" width="20" height="20" />
            Book a Table
          </button>
        </div>
        <div class="hero-social-proof">
          <div class="hero-avatars">
            <div class="avatar avatar-1">AK</div>
            <div class="avatar avatar-2">KO</div>
            <div class="avatar avatar-3">EA</div>
          </div>
          <p class="hero-proof-text">
            <span class="proof-bold">2,400+</span> happy guests this month
          </p>
        </div>
      </div>
    </section>

    <section class="preview-section reveal-section">
      <div class="section-header">
        <h2 class="section-title">Explore</h2>
        <p class="section-subtitle">See what’s fresh and what’s free.</p>
      </div>
      <div class="tab-bar">
        <button
          :class="['tab', activeTab === 'menu' && 'tab-active']"
          @click="activeTab = 'menu'"
        >
          <Icon icon="mdi:food" width="18" height="18" />
          Menu
        </button>
        <button
          :class="['tab', activeTab === 'tables' && 'tab-active']"
          @click="activeTab = 'tables'"
        >
          <Icon icon="mdi:table-chair" width="18" height="18" />
          Free Tables
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading…</p>
      </div>

      <template v-else>
        <div v-if="activeTab === 'menu'" class="menu-grid">
          <div v-for="item in menuItems" :key="item.id" class="menu-card">
            <div class="menu-card-media">
              <img
                :src="item.image || '/src/assets/images/hero-section-img.png'"
                :alt="item.name"
                loading="lazy"
              />
              <div v-if="item.isAvailable === false" class="media-badge sold">
                Sold out
              </div>
            </div>
            <div class="menu-card-body">
              <div class="menu-card-header">
                <h3>{{ item.name }}</h3>
                <span class="menu-price">{{ fmt(item.price) }}</span>
              </div>
              <p class="menu-card-desc">{{ item.description }}</p>
              <div class="menu-card-footer">
                <div class="dietary-chips">
                  <span
                    v-for="tag in dietaryTag(item)"
                    :key="tag"
                    class="dietary-chip"
                  >
                    {{ tag }}
                  </span>
                </div>
                <button
                  :class="['add-btn', addingToCart === item.id && 'adding']"
                  :disabled="
                    item.isAvailable === false || addingToCart === item.id
                  "
                  @click="addToCart(item)"
                >
                  <Icon
                    :icon="
                      addingToCart === item.id ? 'mdi:check' : 'mdi:cart-plus'
                    "
                    width="18"
                    height="18"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tables-grid">
          <div v-for="table in tables" :key="table.id" class="table-card">
            <div class="table-media">
              <img
                src="/src/assets/images/hero-section-img.png"
                alt="Table"
                loading="lazy"
              />
            </div>
            <div class="table-body">
              <div class="table-header">
                <h3>{{ table.name || `Table ${table.id}` }}</h3>
                <span class="table-capacity">{{ table.capacity }} seats</span>
              </div>
              <p class="table-section">{{ table.section || "Main" }}</p>
              <button class="btn-reserve" @click="goToReserve(table.id)">
                Reserve
              </button>
            </div>
          </div>
          <div v-if="!tables.length" class="empty-state">
            No free tables right now. Check back soon.
          </div>
        </div>
      </template>
    </section>

    <section class="cta-strip reveal-section">
      <div class="cta-inner">
        <div>
          <h2>Ready to dine?</h2>
          <p>Join 2,400+ guests who order and book with us every month.</p>
        </div>
        <div class="cta-actions">
          <button class="btn-primary-lg" @click="goToMenu">Order Now</button>
          <button class="btn-secondary-lg" @click="goToReserve">
            Book Table
          </button>
        </div>
      </div>
    </section>

    <section class="features-strip reveal-section">
      <div class="feature-item">
        <div class="feature-icon">
          <Icon icon="mdi:clock-fast" width="28" height="28" />
        </div>
        <h3>Quick Checkout</h3>
        <p>Save time with saved preferences and quick reorder.</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">
          <Icon icon="mdi:whatsapp" width="28" height="28" />
        </div>
        <h3>WhatsApp Confirmations</h3>
        <p>Get instant updates on your order and reservation.</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">
          <Icon icon="mdi:shield-check" width="28" height="28" />
        </div>
        <h3>Secure Payments</h3>
        <p>Pay with Mobile Money, card, or cash — GHS pricing.</p>
      </div>
    </section>

    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <Icon icon="mdi:silverware-fork-knife" width="24" height="24" />
          <span>Vibespot</span>
        </div>
        <p class="footer-text">
          Restaurant Table Reservation System by Vibespot Technologies Ltd.
        </p>
        <p class="footer-copy">&copy; 2026 All rights reserved.</p>
        <button
          v-if="isAuthenticated && (authStore.user?.role === 'admin' || authStore.user?.role === 'manager' || authStore.user?.role === 'staff')"
          class="admin-link"
          @click="router.push('/dashboard')"
        >
          <Icon icon="mdi:cog" width="14" height="14" />
          Staff / Admin
        </button>
      </div>
    </footer>

    <Transition name="cart-fly">
      <button
        v-if="menuCount > 0"
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
.landing-root {
  min-height: 100vh;
  background: var(--background-warm);
  color: var(--ink);
  font-family: var(--font-sans);
  overflow-x: hidden;
}

.landing-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(14px);
  background: rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid var(--border);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-link {
  background: transparent;
  border: none;
  color: var(--ink-secondary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--ink);
  background: var(--neutral-100);
}

.nav-btn {
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.nav-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.hero {
  position: relative;
  padding: 100px 24px 80px;
  text-align: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.35;
  animation: float 10s ease-in-out infinite;
}

.hero-orb-1 {
  width: 400px;
  height: 400px;
  background: var(--accent-300);
  top: -120px;
  left: -80px;
}

.hero-orb-2 {
  width: 320px;
  height: 320px;
  background: var(--earth-300);
  bottom: -80px;
  right: -60px;
  animation-delay: 3s;
}

.hero-orb-3 {
  width: 260px;
  height: 260px;
  background: var(--sky-300);
  top: 40%;
  left: 50%;
  animation-delay: 6s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-24px) scale(1.05);
  }
}

.hero-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.08);
  color: #166534;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 20px;
  animation: fadeInDown 0.6s ease both;
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--neutral-900);
  margin: 0 0 18px;
  animation: fadeInUp 0.7s ease both;
}

.hero-accent {
  background: linear-gradient(135deg, var(--accent-500), var(--earth-500));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: clamp(15px, 2vw, 18px);
  color: var(--neutral-600);
  max-width: 600px;
  margin: 0 auto 28px;
  line-height: 1.6;
  animation: fadeInUp 0.8s ease both;
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeInUp 0.9s ease both;
}

.btn-primary-lg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary-lg:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary-lg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--neutral-800);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-secondary-lg:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.hero-social-proof {
  margin-top: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  animation: fadeInUp 1s ease both;
}

.hero-avatars {
  display: flex;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  border: 2px solid white;
  margin-left: -10px;
}

.avatar:first-child {
  margin-left: 0;
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
  font-size: 13px;
  color: var(--neutral-600);
}

.proof-bold {
  font-weight: 700;
  color: var(--ink);
}

.preview-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
}

.section-header {
  text-align: center;
  margin-bottom: 28px;
}

.section-title {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 8px;
}

.section-subtitle {
  color: var(--neutral-600);
  font-size: 15px;
  margin: 0;
}

.tab-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 28px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: white;
  color: var(--ink-secondary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-active {
  background: var(--accent);
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-sm);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.menu-card {
  background: white;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.menu-card-media {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.menu-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.menu-card:hover .menu-card-media img {
  transform: scale(1.05);
}

.media-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.media-badge.sold {
  background: rgba(244, 63, 94, 0.9);
  color: white;
}

.menu-card-body {
  padding: 16px;
}

.menu-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.menu-card-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.menu-price {
  font-weight: 700;
  color: var(--accent-600);
  font-size: 14px;
  white-space: nowrap;
}

.menu-card-desc {
  margin: 0 0 12px;
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
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--neutral-100);
  color: var(--ink-secondary);
}

.add-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, background 0.2s ease;
}

.add-btn:hover:not(:disabled) {
  transform: scale(1.05);
  background: linear-gradient(135deg, var(--accent-600), var(--accent-700));
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
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.table-card {
  background: white;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.table-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.table-media {
  height: 140px;
  overflow: hidden;
}

.table-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.table-card:hover .table-media img {
  transform: scale(1.05);
}

.table-body {
  padding: 16px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.table-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.table-capacity {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-secondary);
  background: var(--neutral-100);
  padding: 3px 10px;
  border-radius: 999px;
}

.table-section {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--ink-muted);
}

.btn-reserve {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-reserve:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.cta-strip {
  background: linear-gradient(135deg, var(--neutral-900), var(--neutral-800));
  color: white;
  padding: 60px 24px;
}

.cta-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.cta-inner h2 {
  margin: 0 0 6px;
  font-family: var(--font-serif);
  font-size: 26px;
}

.cta-inner p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.cta-actions {
  display: flex;
  gap: 12px;
}

.features-strip {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.feature-item {
  text-align: center;
  padding: 24px;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  background: white;
  box-shadow: var(--card-shadow);
  transition: transform 0.25s ease;
}

.feature-item:hover {
  transform: translateY(-4px);
}

.feature-icon {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  margin-bottom: 14px;
}

.feature-item h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
}

.feature-item p {
  margin: 0;
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.5;
}

.landing-footer {
  border-top: 1px solid var(--border);
  padding: 40px 24px;
  text-align: center;
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
  margin-bottom: 8px;
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
  color: var(--ink-muted);
}

.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 6px 14px;
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

.floating-cart {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  z-index: 200;
  transition: transform 0.2s ease;
}

.floating-cart:hover {
  transform: translateY(-2px) scale(1.02);
}

.cart-count {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.cart-total {
  font-weight: 700;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
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
}

.reveal-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.reveal-section.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cart-fly-enter-active,
.cart-fly-leave-active {
  transition: all 0.35s ease;
}

.cart-fly-enter-from,
.cart-fly-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (max-width: 768px) {
  .hero {
    padding: 70px 18px 50px;
  }

  .nav-actions .nav-link {
    display: none;
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
}
</style>
