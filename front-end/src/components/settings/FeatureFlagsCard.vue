<script setup lang="ts">
import { ref, onMounted } from "vue";
import { VaSwitch } from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import logger from "@/utils/logger";

const props = defineProps<{
  data: { key: string; value: any }[];
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();

const flags = ref({ waitlist: true, loyalty: false, deposits: false });
const flagsSaving = ref(false);
const flagsSaved = ref(false);

const loadFlags = () => {
  const raw = props.data.find((d) => d.key === "feature_flags");
  if (raw) {
    flags.value =
      typeof raw.value === "string" ? JSON.parse(raw.value) : raw.value;
  }
};

const saveFlags = async () => {
  flagsSaving.value = true;
  flagsSaved.value = false;
  try {
    await authStore.updateSettings("feature_flags", JSON.stringify(flags.value));
    flagsSaved.value = true;
    setTimeout(() => (flagsSaved.value = false), 2000);
  } catch (e: any) {
    toastStore.add(e?.response?.data?.message || "Failed to save feature flags", "error");
    logger.error("Failed to save feature flags", { error: e?.message });
  } finally {
    flagsSaving.value = false;
  }
};

onMounted(loadFlags);
</script>

<template>
  <div class="settings-card platform-card">
    <h2 class="category-title">Feature Flags</h2>
    <p class="setting-description" style="margin-bottom: 12px">
      Toggle optional modules without code changes.
    </p>
    <div class="setting-row">
      <div class="setting-info">
        <label class="setting-label">Waitlist</label>
        <p class="setting-description">Allow customers to join a waitlist when fully booked</p>
      </div>
      <VaSwitch v-model="flags.waitlist" />
    </div>
    <div class="setting-row">
      <div class="setting-info">
        <label class="setting-label">Loyalty Points</label>
        <p class="setting-description">Enable points earning and redemption</p>
      </div>
      <VaSwitch v-model="flags.loyalty" />
    </div>
    <div class="setting-row">
      <div class="setting-info">
        <label class="setting-label">Deposits</label>
        <p class="setting-description">Accept partial deposit payments</p>
      </div>
      <VaSwitch v-model="flags.deposits" />
    </div>
    <div style="margin-top: 12px; text-align: right;">
      <button
        class="btn btn-primary"
        :disabled="flagsSaving"
        @click="saveFlags"
      >
        {{ flagsSaving ? "Saving..." : flagsSaved ? "Saved" : "Save Feature Flags" }}
      </button>
    </div>
  </div>
</template>
