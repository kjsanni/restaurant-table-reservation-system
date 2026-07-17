<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAuthStore } from "@/stores/auth";
import logger from "@/utils/logger";
import CoreSettingsCard from "@/components/settings/CoreSettingsCard.vue";
import EmailSettingsCard from "@/components/settings/EmailSettingsCard.vue";
import IntegrationSettingsCard from "@/components/settings/IntegrationSettingsCard.vue";
import PlatformSettingsCard from "@/components/settings/PlatformSettingsCard.vue";
import FeatureFlagsCard from "@/components/settings/FeatureFlagsCard.vue";
import WebhooksCard from "@/components/settings/WebhooksCard.vue";
import QuickActionsCard from "@/components/settings/QuickActionsCard.vue";

const authStore = useAuthStore();
const loading = ref(true);
const rawSettings = ref<{ key: string; value: any }[]>([]);

const settingsMap = ref<
  Record<
    string,
    {
      key: string;
      label: string;
      category: string;
      type: string;
      description: string;
      value: boolean | number | string;
    }
  >
>({});

const settingsConfig: Record<
  string,
  {
    label: string;
    category: string;
    type: string;
    description: string;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
  }
> = {
  customer_registration_enabled: {
    label: "Customer Registration",
    category: "Registration",
    type: "boolean",
    description: "Allow customers to create accounts and self-register",
  },
  reservation_slot_duration: {
    label: "Slot Duration",
    category: "Reservations",
    type: "number",
    unit: "minutes",
    description: "Default time increment for reservation bookings",
    min: 15,
    max: 180,
    step: 15,
  },
  max_party_size: {
    label: "Maximum Party Size",
    category: "Reservations",
    type: "number",
    unit: "guests",
    description: "Maximum number of people per reservation",
    min: 1,
    max: 100,
    step: 1,
  },
  allow_past_reservations: {
    label: "Past Reservations",
    category: "Reservations",
    type: "boolean",
    description: "Allow creating reservations for dates in the past",
  },
  require_table_assignment: {
    label: "Require Table Assignment",
    category: "Reservations",
    type: "boolean",
    description: "Require a table assigned during reservation creation",
  },
  table_base_price: {
    label: "Table Base Price",
    category: "Pricing",
    type: "number",
    unit: "GHS",
    description: "Base price per table",
    min: 0,
    max: 1000,
    step: 1,
  },
  table_price_per_additional_seat: {
    label: "Price Per Additional Seat",
    category: "Pricing",
    type: "number",
    unit: "GHS",
    description: "Extra charge per seat beyond 6 guests",
    min: 0,
    max: 100,
    step: 1,
  },
};

const categories = computed(() => {
  const cats: string[] = [];
  const seen = new Set<string>();
  Object.values(settingsConfig).forEach((s) => {
    if (!seen.has(s.category)) {
      seen.add(s.category);
      cats.push(s.category);
    }
  });
  return cats;
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const data = await authStore.fetchSettings();
    rawSettings.value = data;
    const map: Record<
      string,
      {
        key: string;
        label: string;
        category: string;
        type: string;
        description: string;
        value: boolean | number | string;
      }
    > = {};
    data.forEach((s: { key: string; value: string | boolean | number }) => {
      let value = s.value;
      if (typeof value === "string") {
        if (value === "true") value = true;
        else if (value === "false") value = false;
        else {
          const num = Number(value);
          if (!isNaN(num)) value = num;
        }
      }
      map[s.key] = {
        ...settingsConfig[s.key],
        key: s.key,
        value,
      };
    });

    Object.entries(settingsConfig).forEach(([key, config]) => {
      if (!map[key]) {
        map[key] = {
          ...config,
          key,
          value: config.type === "number" ? config.min ?? 0 : false,
        };
      }
    });

    settingsMap.value = map;
  } catch (e: any) {
    logger.error("Failed to load settings", { error: e?.message });
  } finally {
    loading.value = false;
  }
};

onMounted(loadSettings);
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Admin Settings" />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading settings...</p>
      </div>

      <div v-else class="settings-container">
        <CoreSettingsCard
          :settings-map="settingsMap"
          :settings-config="settingsConfig"
          :categories="categories"
        />
        <EmailSettingsCard :data="rawSettings" />
        <IntegrationSettingsCard :data="rawSettings" />
        <PlatformSettingsCard :data="rawSettings" />
        <FeatureFlagsCard :data="rawSettings" />
        <WebhooksCard :data="rawSettings" />
        <QuickActionsCard />
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: var(--font-sans);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
</style>
