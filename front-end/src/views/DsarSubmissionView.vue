<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import axios from "axios";
import logger from "@/utils/logger";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

interface FormState {
  tenantSlug: string;
  requestType: string;
  email: string;
  phone: string;
  details: string;
}

const form = ref<FormState>({
  tenantSlug: "",
  requestType: "access",
  email: "",
  phone: "",
  details: "",
});

const submitting = ref(false);
const submitted = ref(false);
const error = ref<string | null>(null);
const confirmationId = ref<number | null>(null);

const requestTypes = [
  { value: "access", label: "Access my data" },
  { value: "erasure", label: "Delete my data (Right to Erasure)" },
  { value: "rectification", label: "Correct inaccurate data" },
  { value: "portability", label: "Data portability" },
  { value: "restriction", label: "Restrict processing" },
  { value: "objection", label: "Object to processing" },
];

async function submit() {
  submitting.value = true;
  error.value = null;
  try {
    const res = await axios.post(`${API_BASE}/public/dsar-request`, {
      tenantSlug: form.value.tenantSlug,
      requestType: form.value.requestType,
      requestData: {
        email: form.value.email || undefined,
        phone: form.value.phone || undefined,
        details: form.value.details || undefined,
      },
    });
    confirmationId.value = res.data.item?.id || null;
    submitted.value = true;
  } catch (err: any) {
    logger.error("dsar-submit", { error: err });
    error.value =
      err.response?.data?.message || "Submission failed. Please try again.";
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  submitted.value = false;
  confirmationId.value = null;
  form.value = {
    tenantSlug: "",
    requestType: "access",
    email: "",
    phone: "",
    details: "",
  };
}
</script>

<template>
  <div class="dsar-page">
    <div class="dsar-shell">
      <header class="dsar-header">
        <p class="dsar-eyebrow">Data Protection</p>
        <h1 class="dsar-title">Data Subject Access Request</h1>
        <p class="dsar-desc">
          Under the Ghana Data Protection Act 2012 (Act 843) and GDPR, you have
          the right to access, correct, or request erasure of your personal
          data. Submit your request below and our team will respond within 30
          days.
        </p>
      </header>

      <div v-if="submitted" class="dsar-success">
        <div class="success-icon">✓</div>
        <h2>Request Submitted</h2>
        <p v-if="confirmationId">
          Your request has been received. Reference ID:
          <strong>#{{ confirmationId }}</strong>
        </p>
        <p>Our team will review and respond to your request within 30 days.</p>
        <button class="btn btn-primary" @click="resetForm">
          Submit another request
        </button>
      </div>

      <form v-else class="dsar-form" @submit.prevent="submit">
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label for="tenantSlug"
            >Restaurant identifier <span class="required">*</span></label
          >
          <input
            id="tenantSlug"
            v-model="form.tenantSlug"
            type="text"
            placeholder="e.g. vibespot-bistro"
            required
          />
          <p class="form-hint">
            The restaurant slug you interacted with (found in the URL).
          </p>
        </div>

        <div class="form-group">
          <label for="requestType"
            >Request type <span class="required">*</span></label
          >
          <select id="requestType" v-model="form.requestType">
            <option v-for="t in requestTypes" :key="t.value" :value="t.value">
              {{ t.label }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
            />
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              placeholder="024 xxx xxxx"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="details">Details</label>
          <textarea
            id="details"
            v-model="form.details"
            rows="4"
            placeholder="Describe your request, including any relevant dates or booking references."
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? "Submitting…" : "Submit Request" }}
          </button>
          <RouterLink
            :to="{ name: 'legal-document', params: { slug: 'privacy' } }"
            class="btn btn-ghost"
          >
            Privacy Policy
          </RouterLink>
        </div>
      </form>

      <footer class="dsar-footer">
        <p>
          Vibespot Technologies Ltd. — Data Protection Officer:
          privacy@vibespot.tech
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.dsar-page {
  min-height: 100vh;
  background: var(--background-warm, #faf8f5);
  padding: var(--space-8, 2rem) var(--space-4, 1rem);
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.dsar-shell {
  width: 100%;
  max-width: 640px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-xl, 1rem);
  padding: var(--space-8, 2rem);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}
.dsar-eyebrow {
  font-size: var(--text-sm, 0.875rem);
  font-weight: 600;
  color: var(--brand-600, #8b5e3c);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-2, 0.5rem);
}
.dsar-title {
  font-size: var(--text-3xl, 1.875rem);
  font-weight: 700;
  margin: 0 0 var(--space-3, 0.75rem);
  color: var(--text-primary, #111827);
}
.dsar-desc {
  color: var(--text-muted, #6b7280);
  line-height: 1.6;
  margin: 0 0 var(--space-6, 1.5rem);
}
.dsar-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 1rem);
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4, 1rem);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 0.25rem);
}
.form-group label {
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  color: var(--text-primary, #111827);
}
.required {
  color: var(--rose-500, #ef4444);
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: var(--space-3, 0.75rem);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 0.5rem);
  font-size: var(--text-base, 1rem);
  background: var(--surface, #ffffff);
  color: var(--text-primary, #111827);
  transition: border-color 0.15s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--brand-500, #8b5e3c);
  box-shadow: 0 0 0 3px rgba(139, 94, 60, 0.1);
}
.form-hint {
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-muted, #6b7280);
  margin: 0;
}
.form-actions {
  display: flex;
  gap: var(--space-3, 0.75rem);
  align-items: center;
  margin-top: var(--space-2, 0.5rem);
}
.btn {
  padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
  font-size: var(--text-sm, 0.875rem);
  transition: background 0.15s;
}
.btn-primary {
  background: var(--brand-600, #7c4a2a);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--brand-700, #5c3520);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-ghost {
  background: transparent;
  border-color: var(--border-subtle, #e5e7eb);
  color: var(--text-primary, #111827);
  text-decoration: none;
}
.btn-ghost:hover {
  background: var(--background-warm, #f9fafb);
}
.dsar-success {
  text-align: center;
  padding: var(--space-8, 2rem) 0;
}
.success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--earth-500, #22c55e);
  color: #fff;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-4, 1rem);
}
.dsar-success h2 {
  font-size: var(--text-2xl, 1.5rem);
  font-weight: 600;
  margin: 0 0 var(--space-2, 0.5rem);
}
.dsar-success p {
  color: var(--text-muted, #6b7280);
  margin: 0 0 var(--space-2, 0.5rem);
}
.alert {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-radius: var(--radius-md, 0.5rem);
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.dsar-footer {
  margin-top: var(--space-8, 2rem);
  padding-top: var(--space-4, 1rem);
  border-top: 1px solid var(--border-subtle, #e5e7eb);
}
.dsar-footer p {
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-muted, #6b7280);
  margin: 0;
}
@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
