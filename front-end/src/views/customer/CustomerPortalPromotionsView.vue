<script setup lang="ts">
import { ref, onMounted } from "vue";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";

interface Promotion {
  id: number;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
}

const promotions = ref<Promotion[]>([]);
const loading = ref(true);
const selected = ref<Promotion | null>(null);
const message = ref("");

const loadPromotions = async () => {
  loading.value = true;
  message.value = "";
  try {
    const res = await customerPortalAPI.getPromotions();
    promotions.value = (res.data?.promotions || []) as Promotion[];
  } catch (err) {
    logger.error("Failed to load promotions", { error: err });
  } finally {
    loading.value = false;
  }
};

const viewPromotion = async (id: number) => {
  try {
    const res = await customerPortalAPI.getPromotion(id);
    selected.value = (res.data?.promotion || null) as Promotion | null;
  } catch (err) {
    message.value = "Failed to load promotion details.";
    logger.error("Load promotion failed", { error: err });
  }
};

const closeDetail = () => {
  selected.value = null;
};

const discountLabel = (p: Promotion) => {
  if (p.discountType === "percentage") {
    return `${p.discountValue}% off`;
  }
  return `${p.discountValue} off`;
};

const isValid = (p: Promotion) => {
  const now = new Date();
  if (p.validFrom && now < new Date(p.validFrom)) return false;
  if (p.validUntil && now > new Date(p.validUntil)) return false;
  return true;
};

const formatDate = (v?: string) => {
  if (!v) return "Ongoing";
  const dt = new Date(v);
  if (isNaN(dt.getTime())) return v;
  return dt.toLocaleDateString();
};

onMounted(() => {
  loadPromotions();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Customer Portal</h1>
        <p>Current promotions and offers</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading…</div>

      <div v-else-if="!promotions.length" class="state">
        No active promotions at the moment. Check back soon!
      </div>

      <template v-else>
        <div class="promo-grid">
          <div
            v-for="promo in promotions"
            :key="promo.id"
            class="promo-card"
            :class="{ 'promo-card--expired': !isValid(promo) }"
            @click="viewPromotion(promo.id)"
          >
            <div class="promo-badge">{{ discountLabel(promo) }}</div>
            <div class="promo-code">{{ promo.code }}</div>
            <div class="promo-desc">
              {{ promo.description || "Special offer" }}
            </div>
            <div class="promo-meta">
              <span v-if="promo.minOrderAmount"
                >Min order: {{ promo.minOrderAmount }}</span
              >
              <span>Valid until {{ formatDate(promo.validUntil) }}</span>
            </div>
          </div>
        </div>
      </template>

      <div v-if="message" class="message" role="status">{{ message }}</div>

      <div v-if="selected" class="modal-overlay" @click.self="closeDetail">
        <div class="modal">
          <div class="modal-header">
            <h3>Promotion Details</h3>
            <button class="modal-close" @click="closeDetail">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-row">
              <span class="detail-label">Code</span>
              <span class="detail-value">{{ selected.code }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Discount</span>
              <span class="detail-value">{{ discountLabel(selected) }}</span>
            </div>
            <div class="detail-row" v-if="selected.description">
              <span class="detail-label">Description</span>
              <span class="detail-value">{{ selected.description }}</span>
            </div>
            <div class="detail-row" v-if="selected.minOrderAmount">
              <span class="detail-label">Minimum Order</span>
              <span class="detail-value">{{ selected.minOrderAmount }}</span>
            </div>
            <div class="detail-row" v-if="selected.maxDiscountAmount">
              <span class="detail-label">Max Discount</span>
              <span class="detail-value">{{ selected.maxDiscountAmount }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Valid From</span>
              <span class="detail-value">{{
                formatDate(selected.validFrom)
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Valid Until</span>
              <span class="detail-value">{{
                formatDate(selected.validUntil)
              }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" @click="closeDetail">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}

.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.state {
  padding: 18px;
  border-radius: var(--radius-xl);
  border: 1px dashed var(--neutral-300);
  color: var(--neutral-600);
  text-align: center;
}

.promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}

.promo-card {
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.promo-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.promo-card--expired {
  background: var(--neutral-200);
  color: var(--neutral-600);
}

.promo-badge {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-weight: 700;
  font-size: 13px;
}

.promo-code {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.promo-desc {
  font-size: 14px;
  opacity: 0.9;
}

.promo-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  opacity: 0.85;
}

.message {
  margin-top: var(--space-4);
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: #eef2ff;
  color: #3730a3;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 50;
}

.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--neutral-200);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--neutral-900);
}

.modal-close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--neutral-600);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-body {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.detail-label {
  color: var(--neutral-600);
  font-size: 14px;
}

.detail-value {
  color: var(--neutral-900);
  font-weight: 600;
  font-size: 14px;
  text-align: right;
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--neutral-200);
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  padding: 10px 18px;
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
</style>
