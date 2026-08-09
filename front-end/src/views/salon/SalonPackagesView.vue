<script setup lang="ts">
import { onMounted } from "vue";
import packageAPI from "@/services/packageAPI";
import { useI18n } from "@/composables/useI18n";
import { useSalonCrudView } from "@/composables/useSalonCrudView";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const { t } = useI18n();

interface ServicePackage {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  depositAmount: number;
  isAvailable: boolean;
  whatsappBookable: boolean;
  services?: {
    id: number;
    name?: string;
    price?: number;
    pivot?: { quantity?: number };
  }[];
}

const {
  list: packages,
  loading,
  editingId,
  form,
  load: loadPackages,
  resetForm,
  submitForm,
  edit: editPackage,
  deleteItem: deletePackage,
} = useSalonCrudView<ServicePackage>({
  api: packageAPI,
  entityName: "Package",
  defaultForm: {
    name: "",
    description: "",
    price: 0,
    durationMinutes: 60,
    depositAmount: 0,
    isAvailable: true,
    whatsappBookable: true,
  },
  editMapper: (pkg) => ({
    name: pkg.name,
    description: pkg.description || "",
    price: Number(pkg.price),
    durationMinutes: pkg.durationMinutes,
    depositAmount: Number(pkg.depositAmount),
    isAvailable: pkg.isAvailable,
    whatsappBookable: pkg.whatsappBookable,
  }),
});

const serviceSummary = (pkg: ServicePackage) => {
  if (!pkg.services || !pkg.services.length) return t("salon.noServices");
  const names = pkg.services.map((s) => s.name).filter(Boolean);
  return names.length > 3
    ? `${names.slice(0, 3).join(", ")}...`
    : names.join(", ");
};

onMounted(loadPackages);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.marketing", "Packages") }}</h1>
        <p>
          {{
            t(
              "salon.createScheduleSend",
              "Manage service packages and combo offers"
            )
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
        <p>{{ t("salon.loadingPackages") }}</p>
      </div>

      <div v-else class="stack">
        <div class="settings-card">
          <h3>
            {{
              editingId
                ? t("salon.updateCampaign", "Edit Package")
                : t("salon.createCampaign", "New Package")
            }}
          </h3>
          <div class="grid">
            <label class="full">
              {{ t("salon.name", "Name") }}
              <input v-model="form.name" class="field-input" />
            </label>
            <label class="full">
              {{ t("salon.content", "Description") }}
              <textarea
                v-model="form.description"
                class="field-input"
                rows="3"
              />
            </label>
            <label>
              {{ t("salon.amount", "Amount") }}
              <input
                v-model.number="form.price"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              {{ t("salon.durationMinutes", "Duration") }}
              <input
                v-model.number="form.durationMinutes"
                class="field-input"
                type="number"
                min="15"
                step="15"
              />
            </label>
            <label>
              {{ t("salon.deposit", "Deposit") }}
              <input
                v-model.number="form.depositAmount"
                class="field-input"
                type="number"
                min="0"
              />
            </label>
            <label>
              {{ t("salon.public", "Public") }}
              <select v-model="form.isAvailable" class="field-input">
                <option :value="true">
                  {{ t("salon.activeLabel", "Active") }}
                </option>
                <option :value="false">
                  {{ t("salon.inactiveLabel", "Hidden") }}
                </option>
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
                  : t("salon.createCampaign", "Create Package")
              }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.packageList", "Packages") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.name", "Name") }}</th>
                <th>{{ t("salon.amount", "Amount") }}</th>
                <th>{{ t("salon.durationMinutes", "Duration") }}</th>
                <th>{{ t("salon.deposit", "Deposit") }}</th>
                <th>{{ t("salon.status", "Status") }}</th>
                <th>{{ t("salon.actions", "Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pkg in packages" :key="pkg.id">
                <td>
                  <div>
                    <strong>{{ pkg.name }}</strong>
                    <div class="muted">{{ serviceSummary(pkg) }}</div>
                  </div>
                </td>
                <td>GHS {{ Number(pkg.price).toFixed(2) }}</td>
                <td>{{ pkg.durationMinutes }} min</td>
                <td>GHS {{ Number(pkg.depositAmount).toFixed(2) }}</td>
                <td>
                  <span
                    :class="['pill', pkg.isAvailable ? 't-true' : 't-false']"
                  >
                    {{
                      pkg.isAvailable
                        ? t("salon.activeLabel", "Active")
                        : t("salon.inactiveLabel", "Hidden")
                    }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-secondary-sm" @click="editPackage(pkg)">
                    {{ t("salon.edit", "Edit") }}
                  </button>
                  <button class="btn-danger-sm" @click="deletePackage(pkg.id)">
                    {{ t("salon.delete", "Delete") }}
                  </button>
                </td>
              </tr>
              <tr v-if="!packages.length">
                <td colspan="6" class="empty-state">
                  {{ t("salon.noCampaigns", "No packages yet") }}
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
