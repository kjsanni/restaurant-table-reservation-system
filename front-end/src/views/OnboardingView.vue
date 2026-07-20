<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
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
const preferences = ref({ dietaryRestrictions: [], allergies: [] });
const acceptLegal = ref(false);

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
  timerInterval = window.setInterval(() => {
    otpTimer.value -= 1;
    if (otpTimer.value <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }, 1000);
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
        authStore.isAuthenticated = true;
      }

      step.value = "done";
      successMsg.value = customerExists.value
        ? "Welcome back!"
        : "Account created!";
      setTimeout(() => {
        if (cartStore.count > 0) {
          router.push("/checkout");
        } else {
          router.push(resumePath.value);
        }
      }, 1200);
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
