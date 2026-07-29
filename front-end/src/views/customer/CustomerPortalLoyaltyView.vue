<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCapabilities } from "@/composables/useCapabilities";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";

interface LoyaltyData {
  points: number;
  visitCount: number;
  lastVisitDate: string | null;
  tier: string;
}

const authStore = useAuthStore();
const { businessVertical } = useCapabilities();
const isSalon = computed(() => businessVertical.value === "salon");
const loyalty = ref<LoyaltyData | null>(null);
const loading = ref(true);
const redeemPoints = ref(50);
const message = ref("");
const error = ref("");

const loadLoyalty = async () => {
  loading.value = true;
  message.value = "";
  error.value = "";
  try {
    const res = await customerPortalAPI.getLoyalty();
    loyalty.value = (res.data?.loyalty || null) as LoyaltyData | null;
  } catch (err) {
    error.value = "Failed to load loyalty data.";
    logger.error("Load loyalty failed", { error: err });
  } finally {
    loading.value = false;
  }
};

const submitRedeem = async () => {
  if (!redeemPoints.value || redeemPoints.value <= 0) {
    error.value = "Enter a valid points amount.";
    return;
  }
  if (loyalty.value && redeemPoints.value > loyalty.value.points) {
    error.value = "You don't have enough points.";
    return;
  }
  message.value = "";
  error.value = "";
  try {
    const res = await customerPortalAPI.redeemLoyaltyPoints(redeemPoints.value);
    loyalty.value = (res.data?.loyalty || loyalty.value) as LoyaltyData | null;
    message.value = `Redeemed ${redeemPoints.value} points successfully.`;
    redeemPoints.value = 50;
  } catch (err) {
    error.value = "Failed to redeem points. Please try again.";
    logger.error("Redeem points failed", { error: err });
  }
};

const tierColor = (tier: string) => {
  if (tier === "Gold") return "#b45309";
  if (tier === "Silver") return "#475569";
  return "#92400e";
};

const formatDate = (v?: string | null) => {
  if (!v) return "No visits yet";
  const dt = new Date(v);
  if (isNaN(dt.getTime())) return v;
  return dt.toLocaleDateString();
};

onMounted(() => {
  loadLoyalty();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Customer Portal</h1>
        <p>View and manage your loyalty rewards</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading…</div>

      <template v-else-if="loyalty">
        <div class="loyalty-hero">
          <div
            class="tier-badge"
            :style="{ background: tierColor(loyalty.tier) }"
          >
            {{ loyalty.tier }}
          </div>
          <div class="loyalty-stats">
            <div class="stat">
              <span class="stat-value">{{ loyalty.points }}</span>
              <span class="stat-label">Points</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ loyalty.visitCount }}</span>
              <span class="stat-label">Visits</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{
                formatDate(loyalty.lastVisitDate)
              }}</span>
              <span class="stat-label">Last Visit</span>
            </div>
          </div>
        </div>

        <div class="redeem-card">
          <h3>Redeem Points</h3>
          <p class="redeem-note">
            Redeem points for discounts or rewards at checkout.
          </p>
          <div class="redeem-row">
            <label>
              Points to redeem
              <input
                v-model.number="redeemPoints"
                type="number"
                min="1"
                :max="loyalty.points"
              />
            </label>
            <button
              class="btn-primary"
              :disabled="!loyalty.points || redeemPoints > loyalty.points"
              @click="submitRedeem"
            >
              Redeem
            </button>
          </div>
        </div>
      </template>

      <div v-else class="state">No loyalty data available.</div>

      <div v-if="message" class="message" role="status">{{ message }}</div>
      <div v-if="error" class="error" role="alert">{{ error }}</div>
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

.loyalty-hero {
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border-radius: var(--radius-xl);
  padding: 28px;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  flex-wrap: wrap;
}

.tier-badge {
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: #b45309;
  color: var(--white);
}

.loyalty-stats {
  display: flex;
  gap: var(--space-8);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
}

.stat-label {
  font-size: 12px;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.redeem-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}

.redeem-card h3 {
  margin: 0 0 var(--space-2);
  font-size: 18px;
  color: var(--neutral-900);
}

.redeem-note {
  margin: 0 0 var(--space-4);
  color: var(--neutral-600);
  font-size: 14px;
}

.redeem-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.redeem-row label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--neutral-700);
  font-weight: 500;
}

.redeem-row input {
  padding: 10px 12px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
  width: 160px;
}

.redeem-row input:focus {
  outline: none;
  border-color: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.message {
  margin-top: var(--space-4);
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: #eef2ff;
  color: #3730a3;
  font-size: 14px;
}

.error {
  margin-top: var(--space-4);
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: #fef2f2;
  color: #991b1b;
  font-size: 14px;
}
</style>
