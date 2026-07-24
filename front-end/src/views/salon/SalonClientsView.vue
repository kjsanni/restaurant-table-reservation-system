<script setup lang="ts">
import { ref, onMounted } from "vue";
import clientSegmentationAPI from "@/services/clientSegmentationAPI";
import logger from "@/utils/logger";

const loading = ref(true);
const segmentation = ref<any[]>([]);

const loadSegmentation = async () => {
  loading.value = true;
  try {
    const res = await clientSegmentationAPI.getSegmentation();
    segmentation.value = res.data.segmentation || [];
  } catch (err) {
    logger.error("Failed to load client segmentation", { error: err });
  } finally {
    loading.value = false;
  }
};

onMounted(loadSegmentation);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Client Segmentation</h1>
        <p>VIP tiers, visit counts, and no-show analytics</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading client data...</p>
      </div>

      <div v-else class="stack">
        <div class="summary-grid">
          <div
            v-for="item in segmentation"
            :key="item.tier"
            class="summary-card"
          >
            <span class="summary-label">{{ item.tier.toUpperCase() }}</span>
            <span class="summary-value">{{ item.count }}</span>
            <span class="summary-hint"
              >Total spent: {{ item.totalSpent.toLocaleString() }}</span
            >
          </div>
          <div v-if="!segmentation.length" class="summary-card empty-card">
            <span class="summary-label">No data</span>
          </div>
        </div>

        <div class="settings-card">
          <h3>Tier Thresholds</h3>
          <p class="hint">
            Bronze → Silver: 5 visits or GHS 500 spent.<br />
            Silver → Gold: 10 visits or GHS 1,000 spent.<br />
            Gold → Platinum: 20 visits or GHS 2,000 spent.
          </p>
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
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.summary-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.summary-label {
  font-size: 12px;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--neutral-900);
}
.summary-hint {
  font-size: 12px;
  color: var(--neutral-600);
}
.empty-card {
  align-items: center;
  justify-content: center;
}
.settings-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.settings-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}
.hint {
  font-size: 14px;
  color: var(--neutral-600);
  line-height: 1.6;
}
</style>
