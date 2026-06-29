<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import ToggleSwitch from "@/components/ToggleSwitch.vue";

const authStore = useAuthStore();
const loading = ref(true);
const savingKeys = ref(new Set());
const savedKeys = ref(new Set());
const settingsMap = ref({});

const settingsConfig = {
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
};

const categories = computed(() => {
  const cats = [];
  const seen = new Set();
  Object.values(settingsConfig).forEach((s) => {
    if (!seen.has(s.category)) {
      seen.add(s.category);
      cats.push(s.category);
    }
  });
  return cats;
});

onMounted(async () => {
  await loadSettings();
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const data = await authStore.fetchSettings();
    const map = {};
    data.forEach((s) => {
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
    settingsMap.value = map;
  } catch (e) {
    logger.error("Failed to load settings", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const getByCategory = (category) => {
  return Object.values(settingsMap.value).filter(
    (s) => s.category === category
  );
};

const markSaving = (key) => {
  savingKeys.value.add(key);
  savedKeys.value.delete(key);
};

const markSaved = (key) => {
  savingKeys.value.delete(key);
  savedKeys.value.add(key);
  setTimeout(() => savedKeys.value.delete(key), 2000);
};

const updateValue = async (setting) => {
  markSaving(setting.key);
  try {
    await authStore.updateSettings(setting.key, setting.value);
    markSaved(setting.key);
  } catch (e) {
    logger.error("Failed to update setting", { error: err.message });
  } finally {
    savingKeys.value.delete(setting.key);
  }
};

const handleToggle = (setting) => {
  updateValue(setting);
};

const handleNumberBlur = (setting) => {
  if (
    setting.value !== null &&
    setting.value !== undefined &&
    setting.value !== ""
  ) {
    updateValue(setting);
  }
};

const adjustNumber = (setting, delta) => {
  const config = settingsConfig[setting.key];
  const current = Number(setting.value) || 0;
  let newVal = current + delta;
  if (config.min !== undefined) newVal = Math.max(config.min, newVal);
  if (config.max !== undefined) newVal = Math.min(config.max, newVal);
  if (config.step) newVal = Math.round(newVal / config.step) * config.step;
  setting.value = newVal;
  updateValue(setting);
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Admin Settings</h1>
    </div>
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading settings...</p>
      </div>

      <div v-else class="settings-container">
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
                <ToggleSwitch
                  v-if="setting.type === 'boolean'"
                  :model-value="setting.value"
                  @change="handleToggle(setting)"
                />

                <div
                  v-else-if="setting.type === 'number'"
                  class="number-control"
                >
                  <button
                    class="num-btn"
                    type="button"
                    @click="adjustNumber(setting, -(setting.step || 1))"
                    :disabled="savingKeys.has(setting.key)"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    class="num-input"
                    :value="setting.value"
                    @blur="handleNumberBlur(setting)"
                    @keyup.enter="$event.target.blur()"
                    :min="setting.min"
                    :max="setting.max"
                    :step="setting.step || 1"
                  />
                  <button
                    class="num-btn"
                    type="button"
                    @click="adjustNumber(setting, setting.step || 1)"
                    :disabled="savingKeys.has(setting.key)"
                  >
                    +
                  </button>
                  <span class="unit">{{ setting.unit }}</span>
                </div>

                <span
                  v-if="savingKeys.has(setting.key)"
                  class="status-text saving"
                  >Saving...</span
                >
                <span
                  v-else-if="savedKeys.has(setting.key)"
                  class="status-text saved"
                  >Saved</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="settings-card quick-actions-card">
          <h2 class="category-title">Quick Actions</h2>
          <div class="actions-grid">
            <router-link to="/staff/manage" class="action-card">
              <span class="action-icon">👥</span>
              <span>Manage Staff</span>
            </router-link>
            <router-link to="/roles/manage" class="action-card">
              <span class="action-icon">🔑</span>
              <span>Manage Roles</span>
            </router-link>
            <router-link to="/groups/manage" class="action-card">
              <span class="action-icon">🏷️</span>
              <span>Manage Groups</span>
            </router-link>
            <router-link to="/tables/manage" class="action-card">
              <span class="action-icon">🍽️</span>
              <span>Manage Tables</span>
            </router-link>
            <router-link to="/audit-logs" class="action-card">
              <span class="action-icon">📋</span>
              <span>Audit Logs</span>
            </router-link>
            <router-link to="/schedule" class="action-card">
              <span class="action-icon">📅</span>
              <span>Schedule</span>
            </router-link>
            <router-link to="/heatmap" class="action-card">
              <span class="action-icon">🗺️</span>
              <span>Heatmap</span>
            </router-link>
            <router-link to="/admin/payments" class="action-card">
              <span class="action-icon">💳</span>
              <span>Payments</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}

.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--lighter-gray);
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.category-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0 0 16px 0;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
  cursor: default;
}

.setting-description {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
  margin-top: 4px;
}

.setting-action {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.number-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.num-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--lighter-gray);
  background: var(--primary-white);
  color: var(--primary-black);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.num-btn:hover:not(:disabled) {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.num-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.num-input {
  width: 76px;
  height: 34px;
  text-align: center;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
  background: var(--primary-white);
}

.num-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.unit {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
  min-width: 50px;
}

.status-text {
  font-size: 12px;
  font-family: "Inter-Medium";
  min-width: 60px;
  text-align: right;
}

.status-text.saving {
  color: var(--primary-blue);
}

.status-text.saved {
  color: var(--primary-green);
}

.quick-actions-card {
  margin-top: 4px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  color: var(--primary-black);
  font-family: "Inter-Medium";
  font-size: 14px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.action-card:hover {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.action-icon {
  font-size: 18px;
  flex-shrink: 0;
}

@media screen and (min-width: 640px) {
  .actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
  .setting-item {
    padding: 16px 20px;
  }
}
</style>
