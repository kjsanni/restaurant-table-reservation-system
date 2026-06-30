<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  VaInput,
  VaButton,
  VaAlert,
  VaCard,
  VaCardTitle,
  VaCardContent,
  VaSelect,
  VaTextarea,
} from 'vuestic-ui'

import { paymentOptions } from '@/constants'
import { getApiErrorMessage, getApiErrors } from '@/utils/apiError'
import reservationAPI from '@/services/reservationAPI'
import customerAPI from '@/services/customerAPI'
import logger from '@/utils/logger'

const reservation = ref({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  resDate: '',
  resTime: '',
  people: '',
  expectedTotal: '',
  paymentStatus: 'unpaid',
  notes: '',
})

const customerId = ref<number | null>(null)
const visitCount = ref(0)
const customerTags = ref<string[]>([])
const loyaltyLoaded = ref(false)

const availableTags = [
  { key: 'vip', label: '⭐ VIP', color: '#f59e0b' },
  { key: 'allergy_dairy', label: '🥛 Dairy allergy', color: '#ef4444' },
  { key: 'allergy_nuts', label: '🥜 Nut allergy', color: '#ef4444' },
  { key: 'allergy_gluten', label: '🌾 Gluten-free', color: '#ef4444' },
  { key: 'allergy_shellfish', label: '🦐 Shellfish allergy', color: '#ef4444' },
  { key: 'birthday', label: '🎂 Birthday', color: '#3b82f6' },
  { key: 'anniversary', label: '💍 Anniversary', color: '#ec4899' },
  { key: 'regular', label: '🔄 Regular', color: '#22c55e' },
]

const validationErrors = ref<Record<string, string[]> | null>(null)
const isSuccessful = ref(false)
const generalError = ref<string | null>(null)

const loadCustomerLoyalty = async (email: string) => {
  if (!email || !email.includes('@')) {
    loyaltyLoaded.value = false
    return
  }
  try {
    const res = await customerAPI.findOrCreate({
      email,
      firstName: reservation.value.firstName,
      lastName: reservation.value.lastName,
      phone: reservation.value.phone,
    })
    const customer = res.data.customer
    customerId.value = customer.id
    visitCount.value = customer.visitCount || 0
    customerTags.value = customer.tags || []
    loyaltyLoaded.value = true
  } catch (err) {
    logger.error('Failed to load customer loyalty', { error: (err as Error).message })
  }
}

const toggleTag = async (tagKey: string) => {
  if (!customerId.value) return
  const idx = customerTags.value.indexOf(tagKey)
  if (idx >= 0) {
    customerTags.value.splice(idx, 1)
  } else {
    customerTags.value.push(tagKey)
  }
  try {
    await customerAPI.updateTags(customerId.value, customerTags.value)
  } catch (err) {
    logger.error('Failed to update tags', { error: (err as Error).message })
  }
}

const capitalize = (s: string) => {
  const str = String(s || '').trim()
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const cleanPhone = (phone: string) =>
  String(phone || '')
    .trim()
    .replace(/\D/g, '')
    .slice(0, 15)

const registerReservation = async () => {
  isSuccessful.value = false
  validationErrors.value = null
  generalError.value = null
  try {
    const payload = {
      ...reservation.value,
      firstName: capitalize(reservation.value.firstName),
      lastName: capitalize(reservation.value.lastName),
      phone: cleanPhone(reservation.value.phone),
    }
    const res = await reservationAPI.registerReservation(payload)
    logger.debug('Reservation created', { id: res?.data?.id })
    isSuccessful.value = true
    reservation.value = {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      resDate: '',
      resTime: '',
      people: '',
      expectedTotal: '',
      paymentStatus: 'unpaid',
      notes: '',
    }
    customerId.value = null
    visitCount.value = 0
    customerTags.value = []
    loyaltyLoaded.value = false
    setTimeout(() => (isSuccessful.value = false), 3000)
  } catch (err) {
    logger.error('Reservation creation failed', {
      error: (err as Error).message,
      details: getApiErrors(err),
    })
    generalError.value = getApiErrorMessage(err)
    validationErrors.value = getApiErrors(err)
  }
}
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>New Reservation</h1>
    </div>
    <div class="content-wrapper">
      <form @submit.prevent="registerReservation" class="reservation-form">
        <VaCard class="form-section">
          <VaCardTitle class="section-title">Guest Details</VaCardTitle>
          <VaCardContent>
            <div class="fields-grid">
              <VaInput
                v-model="reservation.firstName"
                label="First Name"
                :error-messages="validationErrors?.firstName"
                class="mb-4"
              />
              <VaInput
                v-model="reservation.lastName"
                label="Last Name"
                :error-messages="validationErrors?.lastName"
                class="mb-4"
              />
            </div>
            <VaInput
              v-model="reservation.phone"
              label="Phone Number"
              :error-messages="validationErrors?.phone"
              class="mb-4"
            />
            <VaInput
              v-model="reservation.email"
              label="Email Address"
              type="email"
              :error-messages="validationErrors?.email"
              class="mb-4"
            />
          </VaCardContent>
        </VaCard>

        <VaCard class="form-section">
          <VaCardTitle class="section-title">Reservation Details</VaCardTitle>
          <VaCardContent>
            <div class="fields-grid">
              <VaInput
                v-model="reservation.resDate"
                label="Date"
                type="date"
                :error-messages="validationErrors?.resDate"
                class="mb-4"
              />
              <VaInput
                v-model="reservation.resTime"
                label="Time"
                type="time"
                :error-messages="validationErrors?.resTime"
                class="mb-4"
              />
            </div>
            <VaInput
              v-model="reservation.people"
              label="Number of People"
              type="number"
              min="1"
              :error-messages="validationErrors?.people"
              class="mb-4"
            />
            <VaInput
              v-model="reservation.expectedTotal"
              label="Expected Total (GHS)"
              type="number"
              min="0"
              step="0.01"
              :error-messages="validationErrors?.expectedTotal"
              class="mb-4"
            />
            <VaSelect
              v-model="reservation.paymentStatus"
              label="Payment Status"
              :options="paymentOptions"
              option-value="value"
              option-text="label"
              class="mb-4"
            />
            <VaTextarea
              v-model="reservation.notes"
              label="Notes / Special Requests"
              :rows="3"
              class="mb-4"
            />
          </VaCardContent>
        </VaCard>

        <VaCard v-if="loyaltyLoaded" class="form-section loyalty-section">
          <VaCardTitle class="section-title">
            <span class="loyalty-badge">
              {{ visitCount }} visit{{ visitCount !== 1 ? 's' : '' }}
            </span>
            Customer Tags
          </VaCardTitle>
          <VaCardContent>
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

        <div class="form-actions">
          <VaAlert
            v-if="isSuccessful"
            color="success"
            class="mb-4"
          >
            Successfully registered your reservation!
          </VaAlert>
          <VaAlert
            v-if="generalError"
            color="danger"
            class="mb-4"
          >
            {{ generalError }}
          </VaAlert>
          <VaButton type="submit" preset="primary" size="large" class="submit-btn">
            Submit Reservation
          </VaButton>
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
  box-shadow: var(--card-shadow);
}

.section-title {
  font-family: 'Inter-Bold';
  font-size: 16px;
  color: var(--primary-black);
  margin: 0;
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.loyalty-section {
  background: linear-gradient(180deg, #fefeff 0%, #f8fafc 100%);
}

.loyalty-badge {
  font-family: 'Inter-Medium';
  font-size: 13px;
  background: var(--primary-blue);
  color: white;
  padding: 6px 14px;
  border-radius: 10px;
  margin-right: 12px;
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
  font-family: 'Inter-Medium';
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

.submit-btn {
  width: 100%;
  max-width: 300px;
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
  .submit-btn {
    width: auto;
    min-width: 260px;
  }
}
</style>
