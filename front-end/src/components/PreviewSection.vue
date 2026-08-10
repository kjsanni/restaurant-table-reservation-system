<script setup lang="ts">
import { Icon } from "@iconify/vue";
import CardSkeleton from "@/components/CardSkeleton.vue";

const props = defineProps<{
  isSalon: boolean;
  hasTableManagement: boolean;
  loading: boolean;
  apiError: boolean;
  activeTab: string;
  menuItems: any[];
  tables: any[];
  services: any[];
  addingToCart: number | string | null;
}>();

const emit = defineEmits<{
  (e: "update:activeTab", value: string): void;
  (e: "addToCart", item: any): void;
  (e: "reserve"): void;
}>();

const dietaryTag = (item: any) => {
  const tags = item.dietaryTags || item.tags || [];
  return tags.slice(0, 2);
};

const fmt = (value: number) => {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} GHS`;
  }
};
</script>

<template>
  <div class="preview-section reveal-section">
    <div class="section-header">
      <h2 class="section-title">Explore</h2>
      <p class="section-subtitle">See what's fresh and what's free.</p>
    </div>
    <div class="tab-bar">
      <button
        v-if="!isSalon"
        :class="['tab', activeTab === 'menu' && 'tab-active']"
        @click="emit('update:activeTab', 'menu')"
      >
        <Icon icon="mdi:food" width="18" height="18" />
        Menu
      </button>
      <button
        v-if="!isSalon && hasTableManagement"
        :class="['tab', activeTab === 'tables' && 'tab-active']"
        @click="emit('update:activeTab', 'tables')"
      >
        <Icon icon="mdi:table-chair" width="18" height="18" />
        Free Tables
      </button>
      <button
        v-if="isSalon"
        :class="['tab', activeTab === 'services' && 'tab-active']"
        @click="emit('update:activeTab', 'services')"
      >
        <Icon icon="mdi:content-cut" width="18" height="18" />
        Services
      </button>
    </div>

    <div v-if="loading" class="preview-skeleton">
      <div class="skeleton-grid">
        <CardSkeleton v-for="n in 4" :key="n" />
      </div>
    </div>
    <div v-else-if="apiError" class="empty-state">
      <p>
        We couldn't load the latest menu and table info. Please try again later.
      </p>
    </div>
    <template v-else>
      <div v-if="!isSalon && activeTab === 'menu'" class="menu-grid">
        <div v-for="item in menuItems" :key="item.id" class="menu-card">
          <div class="menu-card-media">
            <img
              :src="
                item.image ||
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'
              "
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
                @click="emit('addToCart', item)"
                :aria-label="'Add ' + item.name + ' to cart'"
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

      <div
        v-else-if="isSalon && activeTab === 'services'"
        class="services-grid"
      >
        <div v-for="svc in services" :key="svc.id" class="service-card">
          <div class="service-card-body">
            <h3>{{ svc.name }}</h3>
            <p class="service-desc">{{ svc.description }}</p>
            <div class="service-meta">
              <span class="service-price">{{ fmt(svc.price) }}</span>
              <span class="service-duration"
                >{{ svc.durationMinutes }} min</span
              >
            </div>
            <p v-if="svc.depositAmount > 0" class="service-deposit">
              Deposit: {{ fmt(svc.depositAmount) }}
            </p>
            <span v-if="svc.category" class="service-category">{{
              svc.category.name
            }}</span>
          </div>
          <button class="btn-book" @click="emit('reserve')">Book Now</button>
        </div>
        <div v-if="!services.length" class="empty-state">
          No services available right now.
        </div>
      </div>
      <div v-else class="tables-grid">
        <div v-for="table in tables" :key="table.id" class="table-card">
          <div class="table-media">
            <img
              src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80"
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
            <button class="btn-reserve" @click="emit('reserve')">
              Reserve
            </button>
          </div>
        </div>
        <div v-if="!tables.length" class="empty-state">
          No free tables right now. Check back soon.
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
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

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.service-card {
  background: white;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.service-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.service-card-body {
  padding: 18px;
}

.service-card-body h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
}

.service-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.5;
}

.service-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.service-price {
  font-weight: 700;
  color: var(--accent-600);
}

.service-duration {
  font-size: 12px;
  color: var(--ink-secondary);
  background: var(--neutral-100);
  padding: 4px 10px;
  border-radius: 999px;
}

.service-deposit {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--ink-muted);
}

.service-category {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--neutral-100);
  color: var(--ink-secondary);
}

.btn-book {
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

.btn-book:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 119, 6, 0.35);
}

.btn-book:active {
  transform: translateY(0) scale(0.98);
}

.preview-skeleton {
  max-width: 1200px;
  margin: 0 auto;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-muted);
  font-size: 15px;
}
</style>
