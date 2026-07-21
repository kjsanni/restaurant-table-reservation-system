<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import customerAPI from "@/services/customerAPI";
import logger from "@/utils/logger";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const cartStore = useCartStore();

type Step = "phone" | "otp" | "details" | "done";
const step = ref<Step>("phone");
const phone = ref("");
const otp = ref("");
const otpSent = ref(false);
const otpTimer = ref(0);
const submitting = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

const name = ref("");
const email = ref("");
const preferences = ref<{ dietaryRestrictions: string[]; allergies: string[] }>(
  {
    dietaryRestrictions: [],
    allergies: [],
  }
);
const acceptLegal = ref(false);

const dietaryOptions = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Gluten-free",
  "Nut allergy",
  "Lactose intolerance",
];

const customerExists = ref(false);
const customerId = ref<number | null>(null);
const resumePath = computed(() => (route.query.redirect as string) || "/menu");

let timerInterval: number | null = null;

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const startOtpTimer = () => {
  otpTimer.value = 30;
  if (timerInterval) clearInterval(timerInterval);
  const id = window.setInterval(() => {
    otpTimer.value -= 1;
    if (otpTimer.value <= 0) {
      clearInterval(id);
      timerInterval = null;
    }
  }, 1000);
  timerInterval = id;
};

const checkPhone = async () => {
  errorMsg.value = "";
  const raw = phone.value.trim();
  if (!raw || raw.length < 10) {
    errorMsg.value = "Enter a valid phone number.";
    return;
  }

  submitting.value = true;
  try {
    const res = await customerAPI.checkWhatsApp(raw);
    customerExists.value = res.data?.exists || false;
    customerId.value = res.data?.customerId || null;
    await sendOtp(raw);
  } catch (err) {
    logger.error("WhatsApp check failed", { error: err });
    await sendOtp(raw);
  } finally {
    submitting.value = false;
  }
};

const sendOtp = async (targetPhone?: string) => {
  errorMsg.value = "";
  submitting.value = true;
  try {
    const payload: any = { phone: targetPhone || phone.value };
    if (!customerExists.value && name.value) {
      payload.firstName = name.value;
    }
    if (!customerExists.value && email.value) {
      payload.email = email.value;
    }

    await customerAPI.sendOtp(payload);
    otpSent.value = true;
    step.value = "otp";
    startOtpTimer();
  } catch (err) {
    errorMsg.value = "Failed to send OTP. Try again.";
    logger.error("Send OTP failed", { error: err });
  } finally {
    submitting.value = false;
  }
};

const verifyOtp = async () => {
  errorMsg.value = "";
  if (!otp.value || otp.value.length < 4) {
    errorMsg.value = "Enter the OTP sent to your WhatsApp.";
    return;
  }

  submitting.value = true;
  try {
    const res = await customerAPI.verifyOtp(phone.value, otp.value);
    if (res.data?.success) {
      if (res.data.token && res.data.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        authStore.user = res.data.user as any;
      }

      step.value = customerExists.value ? "done" : "details";
      successMsg.value = customerExists.value
        ? "Welcome back!"
        : "Account created!";
      if (customerExists.value) {
        setTimeout(() => {
          if (cartStore.count > 0) {
            router.push("/checkout");
          } else {
            router.push(resumePath.value);
          }
        }, 1200);
      }
    } else {
      errorMsg.value = res.data?.message || "Verification failed.";
    }
  } catch (err) {
    errorMsg.value = "Verification failed. Please try again.";
    logger.error("OTP verify failed", { error: err });
  } finally {
    submitting.value = false;
  }
};

const finishDetails = () => {
  if (!acceptLegal.value) {
    errorMsg.value = "Please accept the terms to continue.";
    return;
  }
  step.value = "done";
  setTimeout(() => {
    if (cartStore.count > 0) {
      router.push("/checkout");
    } else {
      router.push(resumePath.value);
    }
  }, 800);
};

const togglePref = (opt: string) => {
  const arr = preferences.value.dietaryRestrictions || [];
  const idx = arr.indexOf(opt);
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push(opt);
  }
  preferences.value.dietaryRestrictions = [...arr];
};

const skip = () => {
  if (cartStore.count > 0) {
    router.push("/checkout");
  } else {
    router.push(resumePath.value);
  }
};
</script>

<template>
  <div class="onboarding">
    <div class="onboarding-card">
      <div v-if="step === 'phone'" class="step">
        <h2>Sign in with WhatsApp</h2>
        <p class="hint">We'll send a one-time code to your WhatsApp number.</p>
        <input
          v-model="name"
          type="text"
          class="field"
          placeholder="Full name (new customers)"
        />
        <input
          v-model="email"
          type="email"
          class="field"
          placeholder="Email (optional)"
        />
        <input
          v-model="phone"
          type="tel"
          class="field"
          placeholder="WhatsApp number e.g. +233501234567"
        />
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <button class="btn-primary" :disabled="submitting" @click="checkPhone">
          {{ submitting ? "Checking..." : "Continue" }}
        </button>
        <button class="btn-link" @click="skip">Skip for now</button>
      </div>

      <div v-else-if="step === 'otp'" class="step">
        <h2>Enter verification code</h2>
        <p class="hint">Code sent to {{ phone }}.</p>
        <input
          v-model="otp"
          type="text"
          class="field"
          placeholder="4-digit code"
          maxlength="6"
        />
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <button class="btn-primary" :disabled="submitting" @click="verifyOtp">
          {{ submitting ? "Verifying..." : "Verify" }}
        </button>
        <button class="btn-link" :disabled="otpTimer > 0" @click="sendOtp()">
          {{ otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend code" }}
        </button>
        <button class="btn-link" @click="skip">Skip for now</button>
      </div>

      <div v-else-if="step === 'details'" class="step">
        <h2>Almost done</h2>
        <p class="hint">Tell us about your dietary preferences.</p>
        <div class="prefs">
          <button
            v-for="opt in dietaryOptions"
            :key="opt"
            :class="[
              'pref-chip',
              { active: preferences.dietaryRestrictions.includes(opt) },
            ]"
            @click="togglePref(opt)"
          >
            {{ opt }}
          </button>
        </div>
        <label class="legal">
          <input v-model="acceptLegal" type="checkbox" />
          <span>I accept the terms of service and privacy policy.</span>
        </label>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <button class="btn-primary" @click="finishDetails">Finish</button>
      </div>

      <div v-else class="step">
        <h2>{{ successMsg }}</h2>
        <p class="hint">Redirecting...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-warm, var(--neutral-50));
  padding: 24px;
}

.onboarding-card {
  width: 100%;
  max-width: 420px;
  background: var(--white);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--card-shadow, 0 4px 24px rgba(0, 0, 0, 0.08));
  padding: 32px;
}

.step h2 {
  font-family: var(--font-serif, serif);
  font-size: 24px;
  color: var(--neutral-900);
  margin-bottom: 8px;
}

.hint {
  color: var(--neutral-600);
  font-size: 14px;
  margin-bottom: 20px;
}

.field {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--neutral-300);
  border-radius: 10px;
  font-size: 15px;
  margin-bottom: 12px;
}

.field:focus {
  outline: none;
  border-color: var(--accent-500);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--accent-500);
  color: var(--white);
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-link {
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  color: var(--accent-600);
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
}

.btn-link:disabled {
  color: var(--neutral-500);
  cursor: not-allowed;
}

.error {
  color: var(--rose-500);
  font-size: 13px;
  margin: 4px 0;
}

.prefs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.pref-chip {
  padding: 8px 14px;
  border: 1px solid var(--neutral-300);
  border-radius: 999px;
  background: var(--white);
  font-size: 13px;
  cursor: pointer;
}

.pref-chip.active {
  background: var(--accent-100);
  border-color: var(--accent-500);
  color: var(--accent-600);
}

.legal {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 13px;
  color: var(--neutral-700);
  margin-bottom: 16px;
}
</style>
