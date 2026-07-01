<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue"
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { VaSwitch, VaCard, VaCardTitle, VaCardContent, VaButton, VaAlert } from 'vuestic-ui'

const authStore = useAuthStore()
const loading = ref(true)
const savingKeys = ref(new Set<string>())
const savedKeys = ref(new Set<string>())
const settingsMap = ref<Record<string, { key: string; label: string; category: string; type: string; description: string; value: boolean | number | string }>>({})

const settingsConfig: Record<string, {
  label: string
  category: string
  type: string
  description: string
  unit?: string
  min?: number
  max?: number
  step?: number
}> = {
  customer_registration_enabled: {
    label: 'Customer Registration',
    category: 'Registration',
    type: 'boolean',
    description: 'Allow customers to create accounts and self-register',
  },
  reservation_slot_duration: {
    label: 'Slot Duration',
    category: 'Reservations',
    type: 'number',
    unit: 'minutes',
    description: 'Default time increment for reservation bookings',
    min: 15,
    max: 180,
    step: 15,
  },
  max_party_size: {
    label: 'Maximum Party Size',
    category: 'Reservations',
    type: 'number',
    unit: 'guests',
    description: 'Maximum number of people per reservation',
    min: 1,
    max: 100,
    step: 1,
  },
  allow_past_reservations: {
    label: 'Past Reservations',
    category: 'Reservations',
    type: 'boolean',
    description: 'Allow creating reservations for dates in the past',
  },
  require_table_assignment: {
    label: 'Require Table Assignment',
    category: 'Reservations',
    type: 'boolean',
    description: 'Require a table assigned during reservation creation',
  },
}

const categories = computed(() => {
  const cats: string[] = []
  const seen = new Set<string>()
  Object.values(settingsConfig).forEach((s) => {
    if (!seen.has(s.category)) {
      seen.add(s.category)
      cats.push(s.category)
    }
  })
  return cats
})

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  loading.value = true
  try {
    const data = await authStore.fetchSettings()
    const map: Record<string, { key: string; label: string; category: string; type: string; description: string; value: boolean | number | string }> = {}
    data.forEach((s: { key: string; value: string | boolean | number }) => {
      let value = s.value
      if (typeof value === 'string') {
        if (value === 'true') value = true
        else if (value === 'false') value = false
        else {
          const num = Number(value)
          if (!isNaN(num)) value = num
        }
      }
      map[s.key] = {
        ...settingsConfig[s.key],
        key: s.key,
        value,
      }
    })
    settingsMap.value = map
  } catch (e) {
    console.error('Failed to load settings', e)
  } finally {
    loading.value = false
  }
}

const getByCategory = (category: string) => {
  return Object.values(settingsMap.value).filter((s) => s.category === category)
}

const markSaving = (key: string) => {
  savingKeys.value.add(key)
  savedKeys.value.delete(key)
}

const markSaved = (key: string) => {
  savingKeys.value.delete(key)
  savedKeys.value.add(key)
  setTimeout(() => savedKeys.value.delete(key), 2000)
}

const updateValue = async (setting: { key: string; value: boolean | number | string }) => {
  markSaving(setting.key)
  try {
    await authStore.updateSettings(setting.key, setting.value)
    markSaved(setting.key)
  } catch (e) {
    console.error('Failed to update setting', e)
  } finally {
    savingKeys.value.delete(setting.key)
  }
}

const handleToggle = (setting: { key: string; value: boolean | number | string }) => {
  updateValue(setting)
}

const handleNumberBlur = (setting: { key: string; value: number | string }) => {
  if (
    setting.value !== null &&
    setting.value !== undefined &&
    setting.value !== ''
  ) {
    updateValue(setting)
  }
}

const adjustNumber = (setting: { key: string; value: number }, delta: number) => {
  const config = settingsConfig[setting.key]
  const current = Number(setting.value) || 0
  let newVal = current + delta
  if (config.min !== undefined) newVal = Math.max(config.min, newVal)
  if (config.max !== undefined) newVal = Math.min(config.max, newVal)
  if (config.step) newVal = Math.round(newVal / config.step) * config.step
  setting.value = newVal
  updateValue(setting)
}
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
        <div
          v-for="category in categories"
          :key="category"
          class="settings-card"
        >
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
                  @update:model-value="(val) => updateValue({ ...setting, value: val })"
                />

                <div
                  v-else-if="setting.type === 'number'"
                  class="number-control"
                >
                  <button
                    type="button"
                    class="num-btn"
                    @click="adjustNumber(setting as { key: string; value: number }, -(settingsConfig[setting.key].step || 1))"
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
                    @click="adjustNumber(setting as { key: string; value: number }, settingsConfig[setting.key].step || 1)"
                    :disabled="savingKeys.has(setting.key)"
                  >
                    +
                  </button>
                  <span class="unit">{{ settingsConfig[setting.key].unit }}</span>
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
            <RouterLink to="/staff/manage" class="action-card">
              <span class="action-icon">👥</span>
              <span>Manage Staff</span>
            </RouterLink>
            <RouterLink to="/roles/manage" class="action-card">
              <span class="action-icon">🔑</span>
              <span>Manage Roles</span>
            </RouterLink>
            <RouterLink to="/groups/manage" class="action-card">
              <span class="action-icon">🏷️</span>
              <span>Manage Groups</span>
            </RouterLink>
            <RouterLink to="/tables/manage" class="action-card">
              <span class="action-icon">🍽️</span>
              <span>Manage Tables</span>
            </RouterLink>
            <RouterLink to="/audit-logs" class="action-card">
              <span class="action-icon">📋</span>
              <span>Audit Logs</span>
            </RouterLink>
            <RouterLink to="/schedule" class="action-card">
              <span class="action-icon">📅</span>
              <span>Schedule</span>
            </RouterLink>
            <RouterLink to="/heatmap" class="action-card">
              <span class="action-icon">🗺️</span>
              <span>Heatmap</span>
            </RouterLink>
            <RouterLink to="/admin/payments" class="action-card">
              <span class="action-icon">💳</span>
              <span>Payments</span>
            </RouterLink>
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
  background: var(--lighter-gray)
    url("@/assets/images/reservations-header.jpg");
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
  margin-top: 12px;
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
  font-family: 'Inter-Light';
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
  font-family: 'Inter-Bold';
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
  font-family: 'Inter-Medium';
  font-size: 15px;
  color: var(--primary-black);
  cursor: default;
}

.setting-description {
  font-family: 'Inter-Light';
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
  font-family: 'Inter-Medium';
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
  font-family: 'Inter-Light';
  font-size: 13px;
  color: var(--secondary-gray);
  min-width: 50px;
}

.status-text {
  font-size: 12px;
  font-family: 'Inter-Medium';
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
  font-family: 'Inter-Medium';
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
