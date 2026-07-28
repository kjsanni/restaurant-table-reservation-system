<template>
  <div class="forgot-password-view">
    <div class="auth-card">
      <h1>Forgot Password</h1>
      <p class="subtitle">Enter your email and we'll send you a reset link.</p>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? "Sending..." : "Send Reset Link" }}
        </button>
        <p v-if="message" class="message" :class="messageType">{{ message }}</p>
      </form>
      <p class="footer-link">
        <router-link to="/login">Back to login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authAPI from "@/services/authAPI";

const router = useRouter();
const email = ref("");
const loading = ref(false);
const message = ref("");
const messageType = ref("success");

const submit = async () => {
  loading.value = true;
  message.value = "";
  try {
    const res = await authAPI.forgotPassword(email.value);
    message.value = res.data?.message || "If an account exists, a reset link has been sent.";
    messageType.value = "success";
  } catch (err) {
    message.value = err.response?.data?.message || "Something went wrong. Please try again.";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-password-view {
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
.form-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
}
input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}
input:focus {
  outline: none;
  border-color: var(--brand-500, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.btn-primary {
  width: 100%;
  padding: 0.65rem;
  background: var(--brand-500, #2563eb);
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.message {
  margin-top: 1rem;
  font-size: 0.9rem;
}
.message.success {
  color: #047857;
}
.message.error {
  color: #b91c1c;
}
.footer-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
