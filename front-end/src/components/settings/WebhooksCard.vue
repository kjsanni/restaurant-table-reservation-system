<script setup lang="ts">
import { ref, onMounted } from "vue";
import { VaSwitch, VaButton, VaCard } from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import webhookAPI from "@/services/webhookAPI";
import logger from "@/utils/logger";

const props = defineProps<{
  data: { key: string; value: any }[];
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();

const webhooks = ref({ enabled: false, subscriptions: [] as any[] });
const saving = ref(false);
const saved = ref(false);
const testing = ref(false);
const newUrl = ref("");
const newEvents = ref<string[]>([]);
const testUrl = ref("");
const testStatus = ref<"" | "sending" | "sent" | "error">("");

const load = () => {
  const raw = props.data.find((d) => d.key === "webhooks");
  if (raw) {
    webhooks.value =
      typeof raw.value === "string" ? JSON.parse(raw.value) : raw.value;
  }
  if (!Array.isArray(webhooks.value.subscriptions)) {
    webhooks.value.subscriptions = [];
  }
};

const save = async () => {
  saving.value = true;
  saved.value = false;
  try {
    const res = await webhookAPI.update(webhooks.value.subscriptions);
    webhooks.value = res.data.webhooks;
    saved.value = true;
    setTimeout(() => (saved.value = false), 2000);
  } catch (e: any) {
    toastStore.add(e?.response?.data?.message || "Failed to save webhooks", "error");
    logger.error("Failed to save webhooks", { error: e?.message });
  } finally {
    saving.value = false;
  }
};

const toggleEnabled = async (val: boolean) => {
  webhooks.value.enabled = val;
  await save();
};

const addSubscription = () => {
  if (!newUrl.value) return;
  webhooks.value.subscriptions.push({
    url: newUrl.value,
    events: newEvents.value,
    active: true,
  });
  newUrl.value = "";
  newEvents.value = [];
  save();
};

const removeSubscription = (idx: number) => {
  webhooks.value.subscriptions.splice(idx, 1);
  save();
};

const sendTest = async () => {
  if (!testUrl.value) return;
  testing.value = true;
  testStatus.value = "sending";
  try {
    await webhookAPI.test({ url: testUrl.value, event: "test" });
    testStatus.value = "sent";
  } catch (e: any) {
    testStatus.value = "error";
  } finally {
    testing.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="settings-card platform-card">
    <h2 class="category-title">Webhooks</h2>
    <p class="setting-description" style="margin-bottom: 12px">
      Send reservation and payment events to external URLs.
    </p>
    <div class="setting-row">
      <div class="setting-info">
        <label class="setting-label">Enable Webhooks</label>
        <p class="setting-description">Dispatch outbound events when enabled</p>
      </div>
      <VaSwitch :model-value="webhooks.enabled" @update:model-value="toggleEnabled" />
    </div>

    <div v-if="webhooks.enabled" style="margin-top: 16px;">
      <h3 class="integration-title">Subscriptions</h3>
      <div v-if="!webhooks.subscriptions.length" class="suggestions-empty">
        No webhook subscriptions configured.
      </div>
      <div v-for="(sub, idx) in webhooks.subscriptions" :key="idx" class="setting-row">
        <div class="setting-info">
          <label class="setting-label">{{ sub.url }}</label>
          <p class="setting-description">
            Events: {{ sub.events?.join(", ") || "all" }}
          </p>
        </div>
        <button class="btn btn-secondary" @click="removeSubscription(idx)">Remove</button>
      </div>

      <div class="setting-row" style="margin-top: 12px; gap: 8px; align-items: flex-end;">
        <input v-model="newUrl" placeholder="https://example.com/webhook" class="field-input" style="flex:1" />
        <input v-model="newEvents" placeholder="reservation.created,payment.completed" class="field-input" style="flex:1" />
        <button class="btn btn-primary" :disabled="!newUrl" @click="addSubscription">Add</button>
      </div>

      <div class="setting-row" style="margin-top: 12px; gap: 8px; align-items: flex-end;">
        <input v-model="testUrl" placeholder="https://example.com/webhook" class="field-input" style="flex:1" />
        <button class="btn btn-secondary" :disabled="testing" @click="sendTest">
          {{ testing ? "Testing..." : "Test" }}
        </button>
        <span v-if="testStatus === 'sent'" class="success-msg">Sent</span>
        <span v-else-if="testStatus === 'error'" class="error-msg">Failed</span>
      </div>

      <div style="margin-top: 12px; text-align: right;">
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? "Saving..." : saved ? "Saved" : "Save Webhooks" }}
        </button>
      </div>
    </div>
  </div>
</template>
