<template>
  <div class="verify-email-view">
    <div class="auth-card">
      <h1>Verify your email</h1>
      <p class="subtitle">{{ message }}</p>
      <div v-if="success" class="success-actions">
        <RouterLink to="/login" class="btn-primary">Go to login</RouterLink>
      </div>
      <div v-else class="error-actions">
        <button @click="resend" class="btn-secondary" :disabled="loading">
          {{ loading ? "Sending..." : "Resend verification email" }}
        </button>
        <RouterLink to="/login" class="link">Back to login</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { RouterLink } from "vue-router";
import authAPI from "@/services/authAPI";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const success = ref(false);
const message = ref("Verifying your email...");

onMounted(async () => {
  const token = route.params.token;
  if (!token) {
    message.value = "Invalid verification link.";
    return;
  }

  try {
    const res = await authAPI.verifyEmail(token);
    if (res.data?.success) {
      success.value = true;
      message.value = res.data?.message || "Email verified successfully!";
    }
  } catch (err) {
    message.value =
      err.response?.data?.message ||
      "Verification failed. The link may be invalid or expired.";
  }
});

const resend = async () => {
  const email = route.query.email;
  if (!email) {
    message.value =
      "Email address is missing. Please request a new verification email from the login page.";
    return;
  }

  loading.value = true;
  try {
    const res = await authAPI.requestEmailVerification(email);
    message.value =
      res.data?.message ||
      "If an account exists, a verification email has been sent.";
    success.value = true;
  } catch (err) {
    message.value =
      err.response?.data?.message || "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.verify-email-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--auth-bg, #f3f4f6);
  padding: 1rem;
}
.auth-card {
  background: #fff;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 420px;
  text-align: center;
}
h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}
.subtitle {
  color: #6b7280;
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
}
.success-actions,
.error-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.25rem;
  background: var(--brand-500, #2563eb);
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
}
.btn-secondary {
  padding: 0.65rem 1.25rem;
  background: transparent;
  color: var(--brand-500, #2563eb);
  border: 1px solid var(--brand-500, #2563eb);
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.link {
  color: #6b7280;
  text-decoration: none;
  font-size: 0.9rem;
}
.link:hover {
  text-decoration: underline;
}
</style>
