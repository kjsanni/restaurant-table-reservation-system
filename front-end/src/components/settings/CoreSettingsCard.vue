<script setup lang="ts">
import { VaSwitch } from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import logger from "@/utils/logger";

const props = defineProps<{
  settingsMap: Record<
    string,
    {
      key: string;
      label: string;
      category: string;
      type: string;
      description: string;
      value: boolean | number | string;
    }
  >;
  settingsConfig: Record<
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
  >;
  categories: string[];
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();
const savingKeys = new Set<string>();
const savedKeys = new Set<string>();

const getByCategory = (category: string) =>
  Object.values(props.settingsMap).filter((s) => s.category === category);

const markSaving = (key: string) => {
  savingKeys.add(key);
  savedKeys.delete(key);
};

const markSaved = (key: string) => {
  savingKeys.delete(key);
  savedKeys.add(key);
  setTimeout(() => savedKeys.delete(key), 2000);
};

const updateValue = async (setting: {
  key: string;
  value: boolean | number | string;
}) => {
  markSaving(setting.key);
  try {
    await authStore.updateSettings(setting.key, setting.value);
    markSaved(setting.key);
  } catch (e: any) {
    logger.error("Failed to update setting", { error: e?.message });
  } finally {
    savingKeys.delete(setting.key);
  }
};

const handleNumberBlur = (setting: {
  key: string;
  value: number | string | boolean;
}) => {
  if (
    setting.value !== null &&
    setting.value !== undefined &&
    setting.value !== ""
  ) {
    updateValue(setting);
  }
};

const adjustNumber = (setting: any, delta: number) => {
  const current = Number(setting.value) || 0;
  const step = Number(delta) || 0;
  const config = props.settingsConfig[setting.key];
  let newVal = current + step;
  if (config?.min !== undefined) newVal = Math.max(config.min, newVal);
  if (config?.max !== undefined) newVal = Math.min(config.max, newVal);
  if (config?.step) newVal = Math.round(newVal / config.step) * config.step;
  setting.value = newVal;
  updateValue(setting);
};
</script>

<template>
  <div v-for="category in categories" :key="category" class="settings-card">
    <h2 class="category-title">{{ category }}</h2>
    <div class="settings-list">
      <div
        v-for="setting in getByCategory(category)"
        :key="setting.key"
        class="setting-item"
      >
        <div class="setting-info">
          <label class="setting-label">{{ setting.label }}</label>
          <p class="setting-description">{{ setting.description }}</p>
        </div>

        <div class="setting-action">
          <VaSwitch
            v-if="setting.type === 'boolean'"
            :model-value="setting.value as boolean"
            @update:model-value="
              (val) => updateValue({ ...setting, value: val })
            "
          />

          <div v-else-if="setting.type === 'number'" class="number-control">
            <button
              type="button"
              class="num-btn"
              @click="
                adjustNumber(setting, -(settingsConfig[setting.key].step || 1))
              "
              :disabled="savingKeys.has(setting.key)"
            >
              −
            </button>
            <input
              type="number"
              class="num-input"
              :value="setting.value"
              @blur="handleNumberBlur(setting)"
              @keyup.enter="($event.target as HTMLInputElement).blur()"
              :min="settingsConfig[setting.key].min"
              :max="settingsConfig[setting.key].max"
              :step="settingsConfig[setting.key].step || 1"
            />
            <button
              type="button"
              class="num-btn"
              @click="
                adjustNumber(setting, settingsConfig[setting.key].step || 1)
              "
              :disabled="savingKeys.has(setting.key)"
            >
              +
            </button>
            <span class="unit">{{ settingsConfig[setting.key].unit }}</span>
          </div>

          <span v-if="savingKeys.has(setting.key)" class="status-text saving"
            >Saving...</span
          >
          <span v-else-if="savedKeys.has(setting.key)" class="status-text saved"
            >Saved</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
