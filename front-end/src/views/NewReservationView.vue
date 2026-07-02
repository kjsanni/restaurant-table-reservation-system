<script setup lang="ts">
import {
  VaAlert,
  VaButton,
  VaCard,
  VaCardContent,
  VaInput,
  VaTextarea,
} from "vuestic-ui";
import PageHeader from "@/components/PageHeader.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";
import reservationAPI from "@/services/reservationAPI";
import customerAPI from "@/services/customerAPI";
import logger from "@/utils/logger";

const router = useRouter();

const reservation = ref({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  resDate: "",
  resTime: "",
  people: "",
  expectedTotal: "",
  notes: "",
});

const validationErrors = ref<Record<string, string[]> | null>(null);
const isSuccessful = ref(false);
const generalError = ref<string | null>(null);

const capitalize = (s: string) => {
  const str = String(s || "").trim();
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const customerId = ref<number | null>(null);
const visitCount = ref(0);
const customerTags = ref<string[]>([]);
const loyaltyLoaded = ref(false);

const availableTags = [
  { key: "vip", label: "VIP", color: "#f59e0b" },
  { key: "allergy_dairy", label: "Dairy allergy", color: "#ef4444" },
  { key: "allergy_nuts", label: "Nut allergy", color: "#ef4444" },
  { key: "allergy_gluten", label: "Gluten-free", color: "#ef4444" },
  { key: "allergy_shellfish", label: "Shellfish allergy", color: "#ef4444" },
  { key: "birthday", label: "Birthday", color: "#3b82f6" },
  { key: "anniversary", label: "Anniversary", color: "#ec4899" },
  { key: "regular", label: "Regular", color: "#10b981" },
];

const loadCustomerLoyalty = async (email: string) => {
  if (!email || !email.includes("@")) {
    loyaltyLoaded.value = false;
    return;
  }
  try {
    const res = await customerAPI.findOrCreate({
      email,
      firstName: reservation.value.firstName,
      lastName: reservation.value.lastName,
      phone: reservation.value.phone,
    });
    const customer = res.data.customer;
    customerId.value = customer.id;
    visitCount.value = customer.visitCount || 0;
    customerTags.value = customer.tags || [];
    loyaltyLoaded.value = true;
  } catch (err) {
    logger.error("Failed to load customer loyalty", {
      error: (err as Error).message,
    });
  }
};

const toggleTag = async (tagKey: string) => {
  if (!customerId.value) return;
  const idx = customerTags.value.indexOf(tagKey);
  if (idx >= 0) {
    customerTags.value.splice(idx, 1);
  } else {
    customerTags.value.push(tagKey);
  }
  try {
    await customerAPI.updateTags(customerId.value, customerTags.value);
  } catch (err) {
    logger.error("Failed to update tags", { error: (err as Error).message });
  }
};

const registerReservation = async () => {
  isSuccessful.value = false;
  validationErrors.value = null;
  generalError.value = null;
  try {
    const payload = {
      ...reservation.value,
      firstName: capitalize(reservation.value.firstName),
      lastName: capitalize(reservation.value.lastName),
      phone: reservation.value.phone?.replace(/\D/g, "")?.slice(0, 15),
    };
    await reservationAPI.registerReservation(payload);
    isSuccessful.value = true;
    setTimeout(() => router.push({ name: "reservations" }), 1200);
  } catch (err) {
    generalError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
  }
};
</script>

<template>
  <div class="page-wrapper">
    <PageHeader
      title="New Reservation"
      subtitle="Create a new table reservation"
    />
    <div class="content-wrapper">
      <VaCard class="form-card">
        <VaCardContent>
          <form @submit.prevent="registerReservation" class="reservation-form">
            <div class="form-grid">
              <VaInput
                v-model="reservation.firstName"
                label="First Name"
                :error-messages="validationErrors?.firstName"
                class="form-field"
              />
              <VaInput
                v-model="reservation.lastName"
                label="Last Name"
                :error-messages="validationErrors?.lastName"
                class="form-field"
              />
            </div>
            <div class="form-grid">
              <VaInput
                v-model="reservation.phone"
                label="Phone"
                :error-messages="validationErrors?.phone"
                class="form-field"
              />
              <VaInput
                v-model="reservation.email"
                label="Email"
                type="email"
                :error-messages="validationErrors?.email"
                class="form-field"
                @blur="loadCustomerLoyalty(reservation.email)"
              />
            </div>
            <div class="form-grid">
              <VaInput
                v-model="reservation.resDate"
                label="Date"
                type="date"
                :error-messages="validationErrors?.resDate"
                class="form-field"
              />
              <VaInput
                v-model="reservation.resTime"
                label="Time"
                type="time"
                :error-messages="validationErrors?.resTime"
                class="form-field"
              />
            </div>
            <div class="form-grid">
              <VaInput
                v-model="reservation.people"
                label="Party Size"
                type="number"
                min="1"
                :error-messages="validationErrors?.people"
                class="form-field"
              />
              <VaInput
                v-model="reservation.expectedTotal"
                label="Expected Total"
                type="number"
                min="0"
                step="0.01"
                :error-messages="validationErrors?.expectedTotal"
                class="form-field"
              />
            </div>
            <VaTextarea
              v-model="reservation.notes"
              label="Special Requests"
              :rows="3"
              class="form-field"
            />
            <div class="form-footer">
              <VaAlert
                v-if="isSuccessful"
                color="success"
                class="success-alert"
              >
                Reservation confirmed! Redirecting...
              </VaAlert>
              <VaAlert v-if="generalError" color="danger" class="error-alert">
                {{ generalError }}
              </VaAlert>
              <div class="form-actions">
                <VaButton type="submit" preset="primary" size="large">
                  Create Reservation
                </VaButton>
                <VaButton
                  preset="secondary"
                  size="large"
                  @click="router.push({ name: 'reservations' })"
                >
                  Cancel
                </VaButton>
              </div>
            </div>

            <VaCard v-if="loyaltyLoaded" class="loyalty-section">
              <VaCardContent>
                <div class="section-header">
                  <span class="section-icon">⭐</span>
                  Loyalty ({{ visitCount }} visit{{
                    visitCount !== 1 ? "s" : ""
                  }})
                </div>
                <div class="tags-grid">
                  <button
                    v-for="tag in availableTags"
                    :key="tag.key"
                    type="button"
                    class="tag-btn"
                    :class="{ active: customerTags.includes(tag.key) }"
                    :style="
                      customerTags.includes(tag.key)
                        ? {
                            backgroundColor: tag.color,
                            color: 'white',
                            borderColor: tag.color,
                          }
                        : {}
                    "
                    @click="toggleTag(tag.key)"
                  >
                    {{ tag.label }}
                  </button>
                </div>
              </VaCardContent>
            </VaCard>
          </form>
        </VaCardContent>
      </VaCard>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: calc(100vh - var(--header-height));
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.content-wrapper {
  margin-top: 12px;
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
}

.form-card {
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--restaurant-border);
  background: white;
  overflow: hidden;
}

.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-field {
  width: 100%;
}

.form-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.success-alert {
  border-radius: 8px;
}

.error-alert {
  border-radius: 8px;
}

.loyalty-section {
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--restaurant-primary);
}

.section-icon {
  font-size: 18px;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-btn {
  padding: 8px 14px;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  transition: all 0.2s;
}

.tag-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.tag-btn.active {
  color: white;
  border-color: transparent;
}

@media screen and (min-width: 640px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (min-width: 1024px) {
  .content-wrapper {
    margin-left: var(--x-spacing-desktop);
    margin-right: var(--x-spacing-desktop);
  }

  .form-card {
    max-width: 800px;
    margin: 0 auto;
  }
}
</style>
