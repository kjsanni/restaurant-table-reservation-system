<script setup lang="ts">
import { onMounted } from "vue";
import locationAPI from "@/services/locationAPI";
import { useI18n } from "@/composables/useI18n";
import { useSalonCrudView } from "@/composables/useSalonCrudView";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const { t } = useI18n();

interface Location {
  id: number;
  name: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  isActive: boolean;
  timezone?: string;
  currency?: string;
}

const {
  list: locations,
  loading,
  showForm,
  editingId,
  form,
  load: loadLocations,
  resetForm,
  submitForm,
  edit: editLocation,
  deleteItem: deleteLocation,
} = useSalonCrudView<Location>({
  api: locationAPI,
  entityName: "Location",
  defaultForm: {
    name: "",
    address: "",
    city: "",
    region: "",
    phone: "",
    email: "",
    isPrimary: false,
    isActive: true,
    timezone: "Africa/Accra",
    currency: "GHS",
  },
  editMapper: (location) => ({
    name: location.name,
    address: location.address || "",
    city: location.city || "",
    region: location.region || "",
    phone: location.phone || "",
    email: location.email || "",
    isPrimary: location.isPrimary,
    isActive: location.isActive,
    timezone: location.timezone || "Africa/Accra",
    currency: location.currency || "GHS",
  }),
});

onMounted(loadLocations);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.marketing", "Locations") }}</h1>
        <p>
          {{
            t("salon.createScheduleSend", "Manage salon branches and locations")
          }}
        </p>
      </div>
      <div class="topbar-right">
        <LocaleSwitcher />
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t("salon.loadingLocations") }}</p>
      </div>

      <div v-else class="stack">
        <div class="settings-card">
          <h3>
            {{
              editingId
                ? t("salon.updateCampaign", "Edit Location")
                : t("salon.createCampaign", "New Location")
            }}
          </h3>
          <div class="grid">
            <label class="full">
              {{ t("salon.name", "Name") }}
              <input v-model="form.name" class="field-input" />
            </label>
            <label class="full">
              {{ t("salon.address", "Address") }}
              <textarea v-model="form.address" class="field-input" rows="2" />
            </label>
            <label>
              {{ t("salon.city", "City") }}
              <input v-model="form.city" class="field-input" />
            </label>
            <label>
              {{ t("salon.region", "Region") }}
              <input v-model="form.region" class="field-input" />
            </label>
            <label>
              {{ t("salon.phone", "Phone") }}
              <input v-model="form.phone" class="field-input" />
            </label>
            <label>
              {{ t("salon.email", "Email") }}
              <input v-model="form.email" class="field-input" type="email" />
            </label>
            <label>
              Timezone
              <input v-model="form.timezone" class="field-input" />
            </label>
            <label>
              Currency
              <select v-model="form.currency" class="field-input">
                <option value="GHS">GHS</option>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label>
              Active
              <select v-model="form.isActive" class="field-input">
                <option :value="true">
                  {{ t("salon.activeLabel", "Active") }}
                </option>
                <option :value="false">
                  {{ t("salon.inactiveLabel", "Inactive") }}
                </option>
              </select>
            </label>
            <label>
              {{ t("salon.primary", "Primary") }}
              <select v-model="form.isPrimary" class="field-input">
                <option :value="false">{{ t("salon.no", "No") }}</option>
                <option :value="true">{{ t("salon.yes", "Yes") }}</option>
              </select>
            </label>
          </div>
          <div class="form-actions">
            <button v-if="editingId" class="btn-secondary" @click="resetForm">
              {{ t("salon.cancelBtn", "Cancel") }}
            </button>
            <button class="btn-primary" @click="submitForm">
              {{
                editingId
                  ? t("salon.save", "Save")
                  : t("salon.createCampaign", "Create Location")
              }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.campaignsList", "Locations") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.name", "Name") }}</th>
                <th>{{ t("salon.city", "City") }}</th>
                <th>{{ t("salon.region", "Region") }}</th>
                <th>{{ t("salon.phone", "Phone") }}</th>
                <th>{{ t("salon.currency", "Currency") }}</th>
                <th>{{ t("salon.status", "Status") }}</th>
                <th>{{ t("salon.actions", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="location in locations" :key="location.id">
                <td>
                  <strong>{{ location.name }}</strong>
                  <div v-if="location.isPrimary" class="muted">
                    {{ t("salon.primary", "Primary") }}
                  </div>
                </td>
                <td>{{ location.city || "—" }}</td>
                <td>{{ location.region || "—" }}</td>
                <td>{{ location.phone || "—" }}</td>
                <td>{{ location.currency }}</td>
                <td>
                  <span
                    :class="['pill', location.isActive ? 't-true' : 't-false']"
                  >
                    {{
                      location.isActive
                        ? t("salon.activeLabel", "Active")
                        : t("salon.inactiveLabel", "Inactive")
                    }}
                  </span>
                </td>
                <td class="actions">
                  <button
                    class="btn-secondary-sm"
                    @click="editLocation(location)"
                  >
                    {{ t("salon.edit", "Edit") }}
                  </button>
                  <button
                    class="btn-danger-sm"
                    @click="deleteLocation(location.id)"
                  >
                    {{ t("salon.delete", "Delete") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!locations.length">
                <td colspan="7" class="empty-state">
                  {{ t("salon.noCampaigns", "No locations yet") }}
                </td>
              </tr>
            </tbody>
          </table>
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
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
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
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.grid label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.full {
  grid-column: 1 / -1;
}
.field-input {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  width: 100%;
}
textarea.field-input {
  resize: vertical;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.report-table th,
.report-table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--neutral-200);
}
.report-table th {
  font-size: 12px;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.empty-state {
  text-align: center;
  color: var(--neutral-500);
  padding: 18px;
}
.pill {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}
.t-true {
  background: #ecfdf5;
  color: #047857;
}
.t-false {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.muted {
  color: var(--neutral-500);
  font-size: 12px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn-primary {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--brand-600);
  color: var(--white);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: none;
  background: #fecaca;
  color: #7f1d1d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>
