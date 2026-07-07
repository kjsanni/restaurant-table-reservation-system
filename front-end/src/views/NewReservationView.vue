<script setup>
import { ref, onMounted } from "vue";
import { paymentOptions } from "@/constants";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";
import reservationAPI from "@/services/reservationAPI";
import customerAPI from "@/services/customerAPI";
import SuccessMessage from "@/components/SuccessMessage.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import SaveIcon from "~icons/fluent/save-16-regular";
import logger from "@/utils/logger";
import getValues from "@/utils/getValues";

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
});

const customerId = ref(null);
const visitCount = ref(0);
const customerTags = ref([]);
const loyaltyLoaded = ref(false);

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

const registerReservation = async () => {
  isSuccessful.value = false;
  validationErrors.value = null;
  generalError.value = null;
  try {
    const payload = {
      ...reservation.value,
      firstName: capitalize(reservation.value.firstName),
      lastName: capitalize(reservation.value.lastName),
      phone: cleanPhone(reservation.value.phone),
    };
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
    };
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
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>New Reservation</h1>
    </div>
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
          <button type="submit" class="btn btn-primary btn-submit">
            <SaveIcon class="btn-icon" />
            Submit Reservation
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: 200px;
  background: var(--lighter-gray)
    url("@/assets/images/new-reservation-header.jpg");
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
  margin-top: 50px;
  margin-bottom: 50px;
  margin-left: var(--x-spacing-mobile);
  margin-right: var(--x-spacing-mobile);
  padding: 0;
}

.reservation-form {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.section-title {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black);
  margin: 0 0 16px 0;
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--secondary-gray);
}

.field-input {
  padding: 10px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

textarea.field-input {
  resize: vertical;
  min-height: 80px;
}

.loyalty-section {
  background: linear-gradient(180deg, #fefeff 0%, #f8fafc 100%);
}

.loyalty-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.loyalty-badge {
  font-family: "Inter-Medium";
  font-size: 13px;
  background: var(--primary-blue);
  color: white;
  padding: 6px 14px;
  border-radius: 10px;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-btn {
  padding: 8px 14px;
  border: 2px solid #f0f0f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  transition: all 0.15s;
}

.tag-btn:hover {
  border-color: var(--primary-blue);
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
  gap: 16px;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 32px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 15px;
  transition: all 0.15s;
  background-color: var(--primary-blue);
  color: white;
  width: 100%;
  max-width: 300px;
}

.btn-submit:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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
  .btn-submit {
    width: auto;
    min-width: 260px;
  }
}
</style>
