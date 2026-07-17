<script setup>
import { ref, onMounted, watch } from "vue";
import { paymentOptions } from "@/constants";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";
import reservationAPI from "@/services/reservationAPI";
import customerAPI from "@/services/customerAPI";
import tableAPI from "@/services/tableAPI";
import SuccessMessage from "@/components/SuccessMessage.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import SaveIcon from "~icons/fluent/save-16-regular";
import logger from "@/utils/logger";
import PageHeader from "@/components/PageHeader.vue";
import getValues from "@/utils/getValues";
import { validateReservation } from "@/utils/validation";

const reservation = ref({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  resDate: "",
  resTime: "",
  people: "",
  expectedTotal: "",
  paymentStatus: "unpaid",
  notes: "",
  recurrence: null,
});

const customerId = ref(null);
const visitCount = ref(0);
const customerTags = ref([]);
const loyaltyLoaded = ref(false);

const isRecurring = ref(false);
const recurrenceFrequency = ref("weekly");
const recurrenceInterval = ref(1);
const recurrenceUntil = ref("");
const recurrenceByDay = ref([]);

const availableTags = [
  { key: "vip", label: "⭐ VIP", color: "#f59e0b" },
  { key: "allergy_dairy", label: "🥛 Dairy allergy", color: "#ef4444" },
  { key: "allergy_nuts", label: "🥜 Nut allergy", color: "#ef4444" },
  { key: "allergy_gluten", label: "🌾 Gluten-free", color: "#ef4444" },
  { key: "allergy_shellfish", label: "🦐 Shellfish allergy", color: "#ef4444" },
  { key: "birthday", label: "🎂 Birthday", color: "#3b82f6" },
  { key: "anniversary", label: "💍 Anniversary", color: "#ec4899" },
  { key: "regular", label: "🔄 Regular", color: "#22c55e" },
];

const loadCustomerLoyalty = async (email) => {
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
    logger.error("Failed to load customer loyalty", { error: err.message });
  }
};

const toggleTag = async (tagKey) => {
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
    logger.error("Failed to update tags", { error: err.message });
  }
};

const validationErrors = ref(null);
const isSuccessful = ref(false);
const generalError = ref(null);
const submitting = ref(false);

const capitalize = (s) => {
  const str = String(s || "").trim();
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const cleanPhone = (phone) =>
  String(phone || "")
    .trim()
    .replace(/\D/g, "")
    .slice(0, 15);

watch(
  () => reservation.value.people,
  async (newVal) => {
    const count = parseInt(newVal, 10);
    if (!count || count < 1) {
      reservation.value.expectedTotal = "";
      return;
    }
    try {
      const res = await tableAPI.calculatePrice(count);
      reservation.value.expectedTotal = res.data.price || "";
    } catch {
      reservation.value.expectedTotal = "";
    }
  }
);

let loyaltyTimer = null;
watch(
  () => reservation.value.email,
  (email) => {
    if (loyaltyTimer) clearTimeout(loyaltyTimer);
    loyaltyTimer = setTimeout(() => loadCustomerLoyalty(email), 400);
  }
);

const registerReservation = async () => {
  if (submitting.value) return;
  submitting.value = true;
  isSuccessful.value = false;
  validationErrors.value = null;
  generalError.value = null;
  const clientErrors = validateReservation(reservation.value);
  if (clientErrors.length) {
    generalError.value = clientErrors[0];
    validationErrors.value = clientErrors;
    return;
  }
  try {
    const payload = {
      ...reservation.value,
      firstName: capitalize(reservation.value.firstName),
      lastName: capitalize(reservation.value.lastName),
      phone: cleanPhone(reservation.value.phone),
    };

    if (isRecurring.value) {
      payload.recurrence = {
        frequency: recurrenceFrequency.value,
        interval: Number(recurrenceInterval.value) || 1,
        until: recurrenceUntil.value || null,
        byDay: recurrenceByDay.value || [],
      };
    } else {
      payload.recurrence = null;
    }

    const res = await reservationAPI.registerReservation(payload);
    logger.debug("Reservation created", { id: res?.data?.id });
    isSuccessful.value = true;
    reservation.value = {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      resDate: "",
      resTime: "",
      people: "",
      expectedTotal: "",
      paymentStatus: "unpaid",
      notes: "",
      recurrence: null,
    };
    isRecurring.value = false;
    recurrenceFrequency.value = "weekly";
    recurrenceInterval.value = 1;
    recurrenceUntil.value = "";
    recurrenceByDay.value = [];
    customerId.value = null;
    visitCount.value = 0;
    customerTags.value = [];
    loyaltyLoaded.value = false;
    setTimeout(() => (isSuccessful.value = false), 3000);
  } catch (err) {
    logger.error("Reservation creation failed", {
      error: err.message,
      details: getApiErrors(err),
    });
    generalError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="New Reservation" subtitle="Create a new booking" />
    <div class="content-wrapper">
      <form @submit.prevent="registerReservation" class="reservation-form">
        <div class="form-section">
          <h2 class="section-title">Guest Details</h2>
          <div class="fields-grid">
            <div class="field">
              <label class="field-label">First Name</label>
              <input
                v-model="reservation.firstName"
                class="field-input"
                placeholder="Enter first name..."
              />
            </div>
            <div class="field">
              <label class="field-label">Last Name</label>
              <input
                v-model="reservation.lastName"
                class="field-input"
                placeholder="Enter last name..."
              />
            </div>
          </div>
          <div class="field">
            <label class="field-label">Phone Number</label>
            <input
              v-model="reservation.phone"
              class="field-input"
              placeholder="Enter phone number..."
            />
          </div>
          <div class="field">
            <label class="field-label">Email Address</label>
            <input
              v-model="reservation.email"
              type="email"
              class="field-input"
              placeholder="Enter email address..."
            />
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">Reservation Details</h2>
          <div class="fields-grid">
            <div class="field">
              <label class="field-label">Date</label>
              <input
                v-model="reservation.resDate"
                type="date"
                class="field-input"
              />
            </div>
            <div class="field">
              <label class="field-label">Time</label>
              <input
                v-model="reservation.resTime"
                type="time"
                class="field-input"
              />
            </div>
          </div>
          <div class="field">
            <label class="field-label">Number of People</label>
            <input
              v-model="reservation.people"
              type="number"
              min="1"
              class="field-input"
              placeholder="Number of guests..."
            />
          </div>
          <div class="field">
            <label class="field-label">Expected Total (GHS)</label>
            <input
              v-model="reservation.expectedTotal"
              type="number"
              min="0"
              step="0.01"
              class="field-input"
              placeholder="Expected total amount..."
            />
          </div>
          <div class="field">
            <label class="field-label">Payment Status</label>
            <select v-model="reservation.paymentStatus" class="field-input">
              <option
                v-for="opt in paymentOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Notes / Special Requests</label>
            <textarea
              v-model="reservation.notes"
              class="field-input"
              rows="3"
              placeholder="Anniversary, window seat, allergies..."
            ></textarea>
          </div>
        </div>

        <div class="form-section">
          <div class="recurrence-header">
            <label class="field-label">Recurring Reservation</label>
            <input type="checkbox" v-model="isRecurring" />
          </div>
          <div v-if="isRecurring" class="fields-grid">
            <div class="field">
              <label class="field-label">Frequency</label>
              <select v-model="recurrenceFrequency" class="field-input">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Interval</label>
              <input
                v-model="recurrenceInterval"
                type="number"
                min="1"
                class="field-input"
              />
            </div>
            <div class="field">
              <label class="field-label">Repeat Until</label>
              <input
                v-model="recurrenceUntil"
                type="date"
                class="field-input"
              />
            </div>
          </div>
        </div>

        <div v-if="loyaltyLoaded" class="form-section loyalty-section">
          <div class="loyalty-header">
            <span class="loyalty-badge">
              {{ visitCount }} visit{{ visitCount !== 1 ? "s" : "" }}
            </span>
            <h2 class="section-title">Customer Tags</h2>
          </div>
          <div class="tags-grid">
            <button
              v-for="tag in availableTags"
              :key="tag.key"
              :class="['tag-btn', { active: customerTags.includes(tag.key) }]"
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
              type="button"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>

        <div class="form-actions">
          <SuccessMessage
            :is-successful="isSuccessful"
            success-message="Successfully registered your reservation!"
          />
          <ErrorMessage
            :error-flag="generalError"
            :error-message="generalError"
          />
          <button type="submit" class="btn btn-submit" :disabled="submitting">
            <SaveIcon class="btn-icon" />
            {{ submitting ? "Submitting..." : "Submit Reservation" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
}

.reservation-form {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.form-section {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  transition: box-shadow var(--duration-200) var(--ease-out),
    transform var(--duration-200) var(--ease-out);
}

.form-section:hover {
  box-shadow: var(--shadow-md);
}

.section-title {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  color: var(--ink);
  margin: 0 0 var(--space-5) 0;
  letter-spacing: var(--tracking-tight);
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-secondary);
  letter-spacing: var(--tracking-wide);
}

.field-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--input-radius);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--ink);
  background: var(--surface);
  width: 100%;
  box-sizing: border-box;
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.field-input:hover {
  border-color: var(--neutral-300);
}

.field-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

textarea.field-input {
  resize: vertical;
  min-height: 80px;
}

.loyalty-section {
  background: linear-gradient(
    180deg,
    var(--brand-50) 0%,
    var(--accent-50) 100%
  );
  border: 1px solid var(--brand-200);
}

.loyalty-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.loyalty-badge {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.tag-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--duration-150) var(--ease-in-out);
}

.tag-btn:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.tag-btn.active {
  color: white;
  border-color: transparent;
}

.form-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-8);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
  background: linear-gradient(135deg, var(--sky-600) 0%, var(--sky-500) 100%);
  color: white;
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 300px;
}

.btn-submit:hover {
  background: linear-gradient(135deg, var(--sky-700) 0%, var(--sky-600) 100%);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-submit:active {
  transform: translateY(0);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

@media screen and (min-width: 640px) {
  .fields-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.recurrence-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.recurrence-header .field-label {
  margin: 0;
}

.recurrence-header input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-blue);
  cursor: pointer;
}

.loyalty-section {
  border: 1px dashed var(--primary-blue);
  background: #f8fafc;
}

@media screen and (min-width: 1024px) {
  .btn-submit {
    width: auto;
    min-width: 260px;
  }
}
</style>
