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
import { useRouter } from 'vue-router'
import { onMounted, ref, computed } from 'vue'
import { getApiErrorMessage, getApiErrors } from '@/utils/apiError'

const router = useRouter()
const authStore = useAuthStore()

const user = ref({
  username: '',
  email: '',
  password: '',
})

const validationErrors = ref<Record<string, string[]> | null>(null)
const isSuccessful = ref(false)
const generalError = ref<string | null>(null)
const registrationEnabled = ref(true)

const passwordRequirements = computed(() => [
  { label: 'At least 12 characters', met: user.value.password.length >= 12 },
  { label: 'One lowercase letter', met: /[a-z]/.test(user.value.password) },
  { label: 'One uppercase letter', met: /[A-Z]/.test(user.value.password) },
  { label: 'One number', met: /[0-9]/.test(user.value.password) },
  {
    label: 'One special character',
    met: /[^a-zA-Z0-9]/.test(user.value.password),
  },
])

const allRequirementsMet = computed(() =>
  passwordRequirements.value.every((r) => r.met),
)

onMounted(async () => {
  registrationEnabled.value = await authStore.fetchRegistrationStatus()
})

const handleRegister = async () => {
  isSuccessful.value = false
  validationErrors.value = null
  generalError.value = null

  if (!registrationEnabled.value) {
    generalError.value = 'Registration is currently disabled!'
    return
  }

  try {
    await authStore.register(
      user.value.username,
      user.value.email,
      user.value.password,
    )
    isSuccessful.value = true
    setTimeout(() => router.push('/login'), 2000)
  } catch (err) {
    generalError.value = getApiErrorMessage(err)
    validationErrors.value = getApiErrors(err)
  }
}
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Register</h1>
    </div>
    <div class="form-wrapper">
      <VaCard>
        <VaCardTitle class="card-title">Register</VaCardTitle>
        <VaCardContent>
          <form @submit.prevent="handleRegister">
            <VaInput
              v-model="user.username"
              label="Username"
              :error-messages="validationErrors?.username"
              class="mb-4"
            />
            <VaInput
              v-model="user.email"
              label="Email Address"
              type="email"
              :error-messages="validationErrors?.email"
              class="mb-4"
            />
            <VaInput
              v-model="user.password"
              label="Password"
              type="password"
              :error-messages="validationErrors?.password"
              class="mb-4"
            />
            <div class="password-requirements">
              <p class="requirements-title">Password requirements:</p>
              <ul class="requirements-list">
                <li
                  v-for="req in passwordRequirements"
                  :key="req.label"
                  :class="{ 'requirement-met': req.met }"
                >
                  {{ req.label }}
                </li>
              </ul>
            </div>
            <VaAlert
              v-if="isSuccessful"
              color="success"
              class="mb-4"
            >
              Successfully registered! Redirecting to login...
            </VaAlert>
            <VaAlert
              v-if="generalError"
              color="danger"
              class="mb-4"
            >
              {{ generalError }}
            </VaAlert>
            <VaButton
              block
              type="submit"
              :disabled="!registrationEnabled || !allRequirementsMet"
              class="register-btn"
            >
              Register
            </VaButton>
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
  background: var(--lighter-gray)
    url("@/assets/images/add-table-header.jpg");
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
.register-btn {
  margin-top: 16px;
}
.password-requirements {
  margin: 16px 0;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  width: 100%;
}
.requirements-title {
  font-family: 'Inter-Medium';
  font-size: 12px;
  color: var(--secondary-gray);
  margin: 0 0 8px 0;
  text-transform: uppercase;
}
.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.requirements-list li {
  font-family: 'Inter-Light';
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
  transition: color 0.2s;
}
.requirements-list li.requirement-met {
  color: #059669;
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
