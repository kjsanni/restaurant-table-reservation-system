<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VaAlert, VaButton, VaCard, VaCardContent, VaCardTitle, VaInput } from "vuestic-ui"

import { useAuthStore } from '@/stores/auth'
import { getApiErrorMessage, getApiErrors } from '@/utils/apiError'

const router = useRouter()
const authStore = useAuthStore()

const credentials = ref({
  email: '',
  password: '',
})

const validationErrors = ref<Record<string, string[]> | null>(null)
const generalError = ref<string | null>(null)
const lockoutRemaining = ref(0)
const lockoutTimer = ref<number | null>(null)

const formatLockoutTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const startLockoutTimer = (remainingSeconds: number) => {
  lockoutRemaining.value = remainingSeconds
  if (lockoutTimer.value) clearInterval(lockoutTimer.value)
  lockoutTimer.value = window.setInterval(() => {
    lockoutRemaining.value--
    if (lockoutRemaining.value <= 0) {
      clearInterval(lockoutTimer.value)
      lockoutTimer.value = null
    }
  }, 1000)
}

const handleLogin = async () => {
  validationErrors.value = null
  generalError.value = null
  try {
    await authStore.login(credentials.value.email, credentials.value.password)
    router.push('/reservations')
  } catch (err) {
    generalError.value = getApiErrorMessage(err)
    validationErrors.value = getApiErrors(err)
    if (err?.response?.data?.remainingSeconds) {
      startLockoutTimer(err.response.data.remainingSeconds)
    }
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-hero">
      <div class="auth-content">
        <VaCard class="auth-card">
          <VaCardTitle class="auth-card-title">
            <div class="branding">
              <span class="logo-icon">🍽️</span>
              <span class="brand-name">RTRS</span>
            </div>
            Welcome Back
          </VaCardTitle>
          <VaCardContent>
            <form @submit.prevent="handleLogin" class="auth-form">
              <VaInput
                v-model="credentials.email"
                label="Email Address"
                type="email"
                :error-messages="validationErrors?.email"
                class="mb-4 input-field"
              />
              <VaInput
                v-model="credentials.password"
                label="Password"
                type="password"
                :error-messages="validationErrors?.password"
                class="mb-4 input-field"
              />
              <VaAlert
                v-if="lockoutRemaining > 0"
                color="warning"
                class="mb-4 lockout-alert"
              >
                <span class="lockout-text">
                  Account locked. Try again in {{ formatLockoutTime(lockoutRemaining) }}
                </span>
              </VaAlert>
              <VaAlert
                v-if="generalError"
                color="danger"
                class="mb-4 error-alert"
              >
                {{ generalError }}
              </VaAlert>
              <VaButton type="submit" preset="primary" size="large" block class="login-btn">
                Sign In
              </VaButton>
            </form>
          </VaCardContent>
        </VaCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #fffef8 0%, #fef8f0 50%, #fff8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.auth-hero {
  width: 100%;
  max-width: 420px;
}

.auth-content {
  display: flex;
  justify-content: center;
}

.auth-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(4, 3, 15, 0.08);
  width: 100%;
}

.auth-card-title {
  font-family: 'Playfair-Bold';
  font-size: 24px;
  color: var(--luxury-charcoal);
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.1);
}

.branding {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.logo-icon {
  font-size: 28px;
}

.brand-name {
  font-family: 'Playfair-Bold';
  font-size: 20px;
  color: var(--luxury-amber);
  letter-spacing: 0.1em;
}

.auth-form {
  padding: 16px 24px 24px;
}

.input-field :deep(.va-input-wrapper) {
  border-radius: 12px;
  transition: all 0.2s;
}

.input-field :deep(.va-input-wrapper:focus-within) {
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.lockout-alert {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: none;
}

.lockout-text {
  font-family: 'Inter-Medium';
  font-size: 14px;
  color: #92400e;
}

.error-alert {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: none;
}

.login-btn {
  background: linear-gradient(135deg, var(--luxury-amber) 0%, var(--luxury-accent) 100%);
  font-family: 'Inter-Bold';
  font-size: 15px;
  letter-spacing: 0.05em;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(245, 158, 11, 0.25);
}

@media screen and (min-width: 1024px) {
  .auth-hero {
    max-width: 460px;
  }
}
</style>
