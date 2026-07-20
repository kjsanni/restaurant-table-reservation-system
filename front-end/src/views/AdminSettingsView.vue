<script setup lang="ts">
import { ref, onMounted } from "vue";
import authAPI from "@/services/authAPI";
import logger from "@/utils/logger";

const loading = ref(true);
const saving = ref(false);
const profileSettings = ref({
  restaurantName: "",
  email: "",
  phone: "",
  address: "",
});
const notificationSettings = ref({
  emailNotifications: "all",
  smsReminders: "enabled",
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const res = await authAPI.getSettings();
    const data = res.data.settings || res.data || [];
    const map = new Map<string, string>(
      data.map((s: any) => [s.key, String(s.value || "")])
    );

    profileSettings.value = {
      restaurantName:
        map.get("restaurant_name") || map.get("restaurantName") || "",
      email: map.get("email") || "",
      phone: map.get("phone") || "",
      address: map.get("address") || "",
    };

    notificationSettings.value = {
      emailNotifications: map.get("email_notifications") || "all",
      smsReminders: map.get("sms_reminders") || "enabled",
    };
  } catch (err) {
    logger.error("Failed to load settings", { error: err });
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    const entries = [
      { key: "restaurant_name", value: profileSettings.value.restaurantName },
      { key: "email", value: profileSettings.value.email },
      { key: "phone", value: profileSettings.value.phone },
      { key: "address", value: profileSettings.value.address },
    ];
    for (const entry of entries) {
      await authAPI.updateSettings(entry.key, entry.value);
    }
  } catch (err) {
    logger.error("Failed to save profile", { error: err });
  } finally {
    saving.value = false;
  }
};

const saveNotifications = async () => {
  saving.value = true;
  try {
    await authAPI.updateSettings(
      "email_notifications",
      notificationSettings.value.emailNotifications
    );
    await authAPI.updateSettings(
      "sms_reminders",
      notificationSettings.value.smsReminders
    );
  } catch (err) {
    logger.error("Failed to save notifications", { error: err });
  } finally {
    saving.value = false;
  }
};

onMounted(loadSettings);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Settings</h1>
        <p>Restaurant profile and preferences</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading settings...</p>
      </div>

      <div v-else class="settings-stack">
        <div class="settings-card">
          <h3>Restaurant Profile</h3>
          <div class="field">
            <label>Restaurant Name</label>
            <input
              v-model="profileSettings.restaurantName"
              class="field-input"
            />
          </div>
          <div class="field">
            <label>Email</label>
            <input
              v-model="profileSettings.email"
              class="field-input"
              type="email"
            />
          </div>
          <div class="field">
            <label>Phone</label>
            <input v-model="profileSettings.phone" class="field-input" />
          </div>
          <div class="field">
            <label>Address</label>
            <input v-model="profileSettings.address" class="field-input" />
          </div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="saving" @click="saveProfile">
              {{ saving ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>Notifications</h3>
          <div class="field">
            <label>Email notifications</label>
            <select
              v-model="notificationSettings.emailNotifications"
              class="field-input"
            >
              <option value="all">All notifications</option>
              <option value="important">Important only</option>
              <option value="none">None</option>
            </select>
          </div>
          <div class="field">
            <label>SMS reminders</label>
            <select
              v-model="notificationSettings.smsReminders"
              class="field-input"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div class="form-actions">
            <button
              class="btn-primary"
              :disabled="saving"
              @click="saveNotifications"
            >
              {{ saving ? "Saving..." : "Update Preferences" }}
            </button>
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

.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 760px;
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

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-800);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  font-family: var(--font-sans);
}

.field-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--neutral-900);
  background: var(--neutral-50);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field-input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.btn-primary {
  padding: 11px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-6);
  gap: var(--space-4);
}

.spinner {
  width: 36px;
  height: 36px;
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

.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}
</style>
