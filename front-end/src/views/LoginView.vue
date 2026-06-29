<script setup lang="ts">
import {
  VaInput,
  VaButton,
  VaAlert,
  VaCard,
  VaCardTitle,
  VaCardContent,
} from 'vuestic-ui'

import { useAuthStore } from '@/stores/auth'
import { getApiErrorMessage, getApiErrors } from '@/utils/apiError'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
  <div class="main-wrapper">
    <div class="header">
      <h1>Login</h1>
    </div>
    <div class="form-wrapper">
      <VaCard>
        <VaCardTitle class="card-title">Login</VaCardTitle>
        <VaCardContent>
          <form @submit.prevent="handleLogin">
            <VaInput
              v-model="credentials.email"
              label="Email Address"
              type="email"
              :error-messages="validationErrors?.email"
              class="mb-4"
            />
            <VaInput
              v-model="credentials.password"
              label="Password"
              type="password"
              :error-messages="validationErrors?.password"
              class="mb-4"
            />
            <VaAlert
              v-if="lockoutRemaining > 0"
              color="warning"
              class="mb-4 lockout-alert"
            >
              Account locked. Try again in {{ formatLockoutTime(lockoutRemaining) }}
            </VaAlert>
            <VaAlert
              v-if="generalError"
              color="danger"
              class="mb-4"
            >
              {{ generalError }}
            </VaAlert>
            <VaButton block type="submit" class="login-btn">Login</VaButton>
          </form>
        </VaCardContent>
      </VaCard>
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
  background: var(--lighter-gray) url("@/assets/images/add-table-header.jpg");
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
.form-wrapper {
  display: flex;
  justify-content: center;
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  align-items: center;
}
.card-title {
  font-family: 'Inter-Bold';
  font-size: 24px;
  text-align: center;
}
.login-btn {
  margin-top: 16px;
}
.lockout-alert {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media screen and (min-width: 1024px) {
  .form-wrapper {
    margin: 50px var(--x-spacing-desktop) var(--x-spacing-desktop) 50px;
  }
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
}
</style>
