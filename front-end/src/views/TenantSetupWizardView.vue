<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { getXsrfToken } from "@/composables/useXsrfToken";

const router = useRouter();
const authStore = useAuthStore();

type RestaurantType =
  | "full_service"
  | "quick_service"
  | "cloud_kitchen"
  | "dine_in_only"
  | "cafe"
  | "bar";

const RESTAURANT_TYPES: {
  value: RestaurantType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "full_service",
    label: "Full Service Restaurant",
    description: "Full dine-in experience with table service",
    icon: "mdi:silverware-fork-knife",
  },
  {
    value: "quick_service",
    label: "Quick Service",
    description: "Fast casual, counter service, minimal seating",
    icon: "mdi:food",
  },
  {
    value: "cloud_kitchen",
    label: "Cloud Kitchen",
    description: "Delivery-only, no dine-in space",
    icon: "mdi:package-variant-closed",
  },
  {
    value: "dine_in_only",
    label: "Dine-In Only",
    description: "Table service only, no takeaway or delivery",
    icon: "mdi:silverware",
  },
  {
    value: "cafe",
    label: "Cafe",
    description: "Coffee, light meals, casual seating",
    icon: "mdi:coffee",
  },
  {
    value: "bar",
    label: "Bar / Lounge",
    description: "Drinks, bar seating, light bites",
    icon: "mdi:glass-cocktail",
  },
];

const SERVICE_MODES = [
  {
    value: "dine_in",
    label: "Dine-In",
    description: "Table reservations and floor plan",
  },
  {
    value: "takeaway",
    label: "Takeaway",
    description: "Order ahead, pick up in store",
  },
  { value: "delivery", label: "Delivery", description: "Home/office delivery" },
];

const step = ref(1);
const selectedType = ref<RestaurantType | null>(null);
const selectedModes = ref<string[]>(["dine_in", "takeaway", "delivery"]);
const submitting = ref(false);
const errorMsg = ref("");
const businessVertical = ref<"restaurant" | "salon">("restaurant");
const erpnextCompanyName = ref("");
const erpnextFiscalYearStart = ref("");
const erpnextWarehouseName = ref("");

const typeDefaults: Record<RestaurantType, string[]> = {
  full_service: ["dine_in", "takeaway", "delivery"],
  quick_service: ["takeaway", "delivery"],
  cloud_kitchen: ["delivery"],
  dine_in_only: ["dine_in"],
  cafe: ["dine_in", "takeaway"],
  bar: ["dine_in", "takeaway"],
};

const isTypeComplete = computed(() => !!selectedType.value);

const selectType = (type: RestaurantType) => {
  selectedType.value = type;
  selectedModes.value = [...typeDefaults[type]];
};

const toggleMode = (mode: string) => {
  const idx = selectedModes.value.indexOf(mode);
  if (idx >= 0) {
    selectedModes.value.splice(idx, 1);
  } else {
    selectedModes.value.push(mode);
  }
};

const isModeComplete = computed(() => selectedModes.value.length > 0);
const isErpnextEnabled = computed(() => {
  const flags = authStore.capabilities?.featureFlags || {};
  return Object.keys(flags).some((k) => k.startsWith("erpnext_") && flags[k]);
});
const erpnextModules = computed(() => {
  const flags = authStore.capabilities?.featureFlags || {};
  return Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k);
});
const isErpnextStepComplete = computed(() => {
  if (
    erpnextModules.value.includes("erpnext_accounting") ||
    erpnextModules.value.includes("erpnext_stock")
  ) {
    return erpnextCompanyName.value.trim().length > 0;
  }
  return true;
});

const submitSetup = async () => {
  if (!selectedType.value || !isModeComplete.value) return;
  submitting.value = true;
  errorMsg.value = "";
  try {
    const response = await fetch("/api/v1/auth/tenant/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-xsrf-token": getXsrfToken(),
      },
      credentials: "include",
      body: JSON.stringify({
        businessVertical: businessVertical.value,
        restaurantType: selectedType.value,
        serviceModes: selectedModes.value,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to save setup");
    }
    await authStore.fetchCapabilities();
    router.push("/dashboard");
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : "Something went wrong";
  } finally {
    submitting.value = false;
  }
};

const submitErpnextOnboarding = async () => {
  submitting.value = true;
  errorMsg.value = "";
  try {
    const companyPayload: any = {
      companyName: erpnextCompanyName.value || undefined,
      fiscalYearStart: erpnextFiscalYearStart.value || undefined,
    };
    const companyRes = await fetch("/api/v1/erpnext/onboarding/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(companyPayload),
    });
    if (!companyRes.ok) {
      const data = await companyRes.json().catch(() => ({}));
      throw new Error(data.message || "Failed to create ERPNext company");
    }

    if (
      erpnextModules.value.includes("erpnext_stock") &&
      erpnextWarehouseName.value.trim()
    ) {
      const whRes = await fetch("/api/v1/erpnext/onboarding/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          warehouseName: erpnextWarehouseName.value,
        }),
      });
      if (!whRes.ok) {
        const data = await whRes.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create ERPNext warehouse");
      }
    }

    await authStore.fetchCapabilities();
    router.push("/dashboard");
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : "Something went wrong";
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  if (
    authStore.capabilities?.businessVertical === "salon" ||
    authStore.capabilities?.restaurantType === "salon"
  ) {
    businessVertical.value = "salon";
    step.value = 2;
  } else if (
    authStore.capabilities?.restaurantType &&
    authStore.capabilities.restaurantType !== "full_service"
  ) {
    selectedType.value = authStore.capabilities
      .restaurantType as RestaurantType;
    selectedModes.value = authStore.capabilities.serviceModes || [];
    step.value = 2;
  }
});
</script>

<template>
  <main class="setup-wizard-main">
    <div class="setup-wizard">
      <div class="wizard-card">
        <div class="wizard-header">
          <h1>Welcome! Let's set up your restaurant</h1>
          <p class="wizard-subtitle">
            Tell us about your business so we can tailor the experience.
          </p>
        </div>

        <div class="stepper">
          <div :class="['step', step >= 1 && 'active']">
            <span class="step-num">1</span>
            <span class="step-label">Type</span>
          </div>
          <div :class="['step', step >= 2 && 'active']">
            <span class="step-num">2</span>
            <span class="step-label">Services</span>
          </div>
          <div :class="['step', step >= 3 && 'active']">
            <span class="step-num">3</span>
            <span class="step-label">Confirm</span>
          </div>
          <template v-if="isErpnextEnabled">
            <div :class="['step', step >= 4 && 'active']">
              <span class="step-num">4</span>
              <span class="step-label">ERPNext</span>
            </div>
          </template>
        </div>

        <div v-if="step === 1" class="step-content">
          <div class="vertical-toggle">
            <button
              :class="[
                'vertical-option',
                businessVertical === 'restaurant' && 'selected',
              ]"
              @click="businessVertical = 'restaurant'"
            >
              <Icon icon="mdi:silverware-fork-knife" width="28" height="28" />
              <span class="vertical-label">Restaurant</span>
            </button>
            <button
              :class="[
                'vertical-option',
                businessVertical === 'salon' && 'selected',
              ]"
              @click="businessVertical = 'salon'"
            >
              <Icon icon="mdi:content-cut" width="28" height="28" />
              <span class="vertical-label">Salon</span>
            </button>
          </div>

          <div v-if="businessVertical === 'restaurant'" class="type-grid">
            <button
              v-for="t in RESTAURANT_TYPES"
              :key="t.value"
              :class="['type-card', selectedType === t.value && 'selected']"
              @click="selectType(t.value)"
            >
              <Icon :icon="t.icon" width="28" height="28" />
              <span class="type-label">{{ t.label }}</span>
              <span class="type-desc">{{ t.description }}</span>
            </button>
          </div>
          <div v-else class="salon-step-1">
            <p class="salon-hint">
              You're setting up a <strong>salon</strong> business. Continue to
              configure services and staff availability.
            </p>
          </div>
          <div class="wizard-actions">
            <button
              class="btn-primary"
              :disabled="businessVertical === 'restaurant' && !isTypeComplete"
              @click="step = 2"
            >
              Continue
            </button>
          </div>
        </div>

        <div v-if="step === 2" class="step-content">
          <div class="modes-list">
            <button
              v-for="m in SERVICE_MODES"
              :key="m.value"
              :class="[
                'mode-card',
                selectedModes.includes(m.value) && 'selected',
              ]"
              @click="toggleMode(m.value)"
            >
              <div class="mode-text">
                <span class="mode-label">{{ m.label }}</span>
                <span class="mode-desc">{{ m.description }}</span>
              </div>
              <div class="mode-check">
                <Icon
                  v-if="selectedModes.includes(m.value)"
                  icon="mdi:check-circle"
                  width="22"
                  height="22"
                />
              </div>
            </button>
          </div>
          <div class="wizard-actions">
            <button class="btn-secondary" @click="step = 1">Back</button>
            <button
              class="btn-primary"
              :disabled="!isModeComplete"
              @click="step = 3"
            >
              Continue
            </button>
          </div>
        </div>

        <div v-if="step === 3" class="step-content">
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Business type</span>
              <span class="summary-value">{{
                businessVertical === "salon" ? "Salon" : "Restaurant"
              }}</span>
            </div>
            <div v-if="businessVertical === 'restaurant'" class="summary-row">
              <span class="summary-label">Restaurant type</span>
              <span class="summary-value">{{
                RESTAURANT_TYPES.find((t) => t.value === selectedType)?.label
              }}</span>
            </div>
            <div v-if="businessVertical === 'restaurant'" class="summary-row">
              <span class="summary-label">Service modes</span>
              <span class="summary-value">{{
                selectedModes
                  .map((m) => SERVICE_MODES.find((s) => s.value === m)?.label)
                  .join(", ")
              }}</span>
            </div>
            <div v-else class="summary-row">
              <span class="summary-label">Salon setup</span>
              <span class="summary-value"
                >Configure services and stations after setup</span
              >
            </div>
          </div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          <div class="wizard-actions">
            <button
              class="btn-secondary"
              @click="step = 2"
              :disabled="submitting"
            >
              Back
            </button>
            <button
              class="btn-primary"
              :disabled="submitting"
              @click="submitSetup"
            >
              <span v-if="!submitting">Finish Setup</span>
              <span v-else>Saving…</span>
            </button>
          </div>
        </div>

        <div v-if="step === 4 && isErpnextEnabled" class="step-content">
          <h2 style="text-align: center; margin-bottom: 16px">ERPNext Setup</h2>
          <p style="text-align: center; color: #666; margin-bottom: 20px">
            Complete the ERPNext onboarding steps to enable accounting,
            inventory, and other back-office features.
          </p>

          <div
            v-if="
              erpnextModules.includes('erpnext_accounting') ||
              erpnextModules.includes('erpnext_stock')
            "
            class="erpnext-onboarding-step"
          >
            <h3>Step 1 — Set up your ERP company</h3>
            <div class="form-group">
              <label>Company Name</label>
              <input
                v-model="erpnextCompanyName"
                type="text"
                :placeholder="
                  businessVertical === 'salon' ? 'My Salon' : 'My Restaurant'
                "
              />
            </div>
            <div class="form-group">
              <label>Fiscal Year Start</label>
              <input v-model="erpnextFiscalYearStart" type="date" />
            </div>
          </div>

          <div
            v-if="erpnextModules.includes('erpnext_stock')"
            class="erpnext-onboarding-step"
          >
            <h3>Step 2 — Set up your warehouse</h3>
            <div class="form-group">
              <label>Warehouse Name</label>
              <input
                v-model="erpnextWarehouseName"
                type="text"
                :placeholder="'Main Warehouse'"
              />
            </div>
          </div>

          <div
            v-if="erpnextModules.includes('erpnext_hr')"
            class="erpnext-onboarding-step"
          >
            <h3>Step 3 — Import staff records</h3>
            <p style="color: #666">
              Your existing staff will be imported into ERPNext as employees.
            </p>
          </div>

          <div
            v-if="erpnextModules.includes('erpnext_manufacturing')"
            class="erpnext-onboarding-step"
          >
            <h3>Step 4 — Set up recipes / BOM</h3>
            <p style="color: #666">
              Item groups and bill of materials will be created for your
              products.
            </p>
          </div>

          <div class="wizard-actions">
            <button class="btn-secondary" @click="step = 3">Back</button>
            <button
              class="btn-primary"
              :disabled="!isErpnextStepComplete"
              @click="submitErpnextOnboarding"
            >
              <span v-if="!submitting">Complete ERPNext Setup</span>
              <span v-else>Saving…</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.setup-wizard-main {
  min-height: 100vh;
}
.setup-wizard {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f5f5f5;
}
.wizard-card {
  width: 100%;
  max-width: 720px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 32px;
}
.wizard-header {
  text-align: center;
  margin-bottom: 24px;
}
.wizard-header h1 {
  margin: 0 0 8px;
  font-size: 24px;
}
.wizard-subtitle {
  margin: 0;
  color: #666;
}
.stepper {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 28px;
}
.step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-weight: 500;
}
.step.active {
  color: #111;
}
.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e5e5e5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
.step.active .step-num {
  background: #111;
  color: #fff;
}
.step-content {
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 12px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}
.type-card.selected {
  border-color: #111;
  background: #fafafa;
}
.type-label {
  font-weight: 600;
  font-size: 14px;
}
.type-desc {
  font-size: 12px;
  color: #666;
}
.vertical-toggle {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.vertical-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}
.vertical-option.selected {
  border-color: #111;
  background: #fafafa;
}
.vertical-label {
  font-weight: 600;
  font-size: 14px;
}
.salon-step-1 {
  text-align: center;
  padding: 24px;
  color: #666;
}
.salon-hint {
  font-size: 14px;
  line-height: 1.6;
}
.modes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.mode-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mode-card.selected {
  border-color: #111;
  background: #fafafa;
}
.mode-label {
  font-weight: 600;
  font-size: 14px;
}
.mode-desc {
  font-size: 12px;
  color: #666;
  display: block;
}
.mode-check {
  color: #111;
}
.summary {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e5e5e5;
}
.summary-row:last-child {
  border-bottom: none;
}
.summary-label {
  color: #666;
  font-size: 14px;
}
.summary-value {
  font-weight: 600;
  font-size: 14px;
}
.error-msg {
  color: #c00;
  margin-bottom: 12px;
  font-size: 14px;
}
.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-primary {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  background: #111;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  padding: 10px 18px;
  border-radius: 10px;
  border: 2px solid #e5e5e5;
  background: #fff;
  color: #111;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.erpnext-onboarding-step {
  background: #f9f9f9;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.erpnext-onboarding-step h3 {
  margin: 0 0 12px;
  font-size: 16px;
}
.form-group {
  margin-bottom: 12px;
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
}
.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
</style>
