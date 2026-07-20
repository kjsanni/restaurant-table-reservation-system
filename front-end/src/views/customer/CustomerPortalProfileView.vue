<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import PageHeader from "@/components/PageHeader.vue";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";

const authStore = useAuthStore();
const toastStore = useToastStore();

const profile = ref({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
});
const saving = ref(false);
const saved = ref(false);

const loadProfile = async () => {
  try {
    const res = await customerPortalAPI.getProfile();
    if (res.data.success && res.data.customer) {
      profile.value = res.data.customer;
    } else {
      profile.value = {
        firstName: authStore.user?.username || "",
        lastName: "",
        phone: "",
        email: authStore.user?.email || "",
      };
    }
  } catch (err) {
    logger.error("Failed to load profile", { error: err });
    profile.value = {
      firstName: authStore.user?.username || "",
      lastName: "",
      phone: "",
      email: authStore.user?.email || "",
    };
  }
};

const saveProfile = async () => {
  saving.value = true;
  saved.value = false;
  try {
    const res = await customerPortalAPI.updateProfile(profile.value);
    if (res.data.success) {
      saved.value = true;
      toastStore.add("Profile updated successfully", "success");
      setTimeout(() => (saved.value = false), 2000);
    } else {
      toastStore.add(res.data.message || "Failed to update profile", "error");
    }
  } catch (err) {
    logger.error("Failed to save profile", { error: err });
    toastStore.add("Failed to update profile", "error");
  } finally {
    saving.value = false;
  }
};

onMounted(loadProfile);
</script>

<template>
  <div class="profile-page">
    <PageHeader
      title="My Profile"
      subtitle="Manage your details and preferences"
    />

    <div class="profile-layout">
      <section class="card profile-main">
        <form @submit.prevent="saveProfile" class="form">
          <div class="form-row">
            <div class="field">
              <label class="field-label">First Name</label>
              <input
                v-model="profile.firstName"
                class="field-input"
                placeholder="First name"
              />
            </div>
            <div class="field">
              <label class="field-label">Last Name</label>
              <input
                v-model="profile.lastName"
                class="field-input"
                placeholder="Last name"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="field-label">Email</label>
              <input
                v-model="profile.email"
                class="field-input"
                type="email"
                disabled
              />
            </div>
            <div class="field">
              <label class="field-label">Phone</label>
              <input
                v-model="profile.phone"
                class="field-input"
                placeholder="Phone number"
              />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? "Saving..." : saved ? "Saved" : "Save Profile" }}
            </button>
          </div>
        </form>
      </section>

      <aside class="card profile-side">
        <div class="avatar">
          {{
            (profile?.firstName || authStore.user?.username || "G")
              .charAt(0)
              .toUpperCase()
          }}
        </div>
        <h3 class="side-name">{{ profile?.firstName || "Guest" }}</h3>
        <p class="side-email">
          {{ profile?.email || authStore.user?.email || "" }}
        </p>

        <div class="side-list">
          <div class="side-row">
            <span>Member since</span>
            <b>{{ profile?.memberSince ?? "—" }}</b>
          </div>
          <div class="side-row">
            <span>Loyalty tier</span>
            <b>{{ profile?.loyaltyTier ?? "—" }}</b>
          </div>
          <div class="side-row">
            <span>Total visits</span>
            <b>{{ profile?.totalVisits ?? "—" }}</b>
          </div>
          <div class="side-row">
            <span>Dietary notes</span>
            <b>{{ profile?.dietaryNotes ?? "None" }}</b>
          </div>
        </div>
      </aside>
    </div>

    <section class="card legal-card">
      <h3 class="legal-title">Policies &amp; Payments</h3>
      <p class="legal-note">
        Your bookings are with the restaurant. Review how your data and payments
        are handled.
      </p>
      <nav class="legal-links" aria-label="Customer legal policies">
        <RouterLink
          :to="{ name: 'legal-document', params: { slug: 'customer' } }"
        >
          Customer Policy
        </RouterLink>
        <RouterLink
          :to="{ name: 'legal-document', params: { slug: 'payment-refund' } }"
        >
          Payment &amp; Refund Policy
        </RouterLink>
        <RouterLink
          :to="{ name: 'legal-document', params: { slug: 'privacy' } }"
        >
          Privacy Policy
        </RouterLink>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 980px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-6) var(--space-10);
}

.profile-layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--space-5);
  align-items: start;
  margin-top: var(--space-5);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-row {
  display: flex;
  gap: var(--space-4);
}

.field {
  flex: 1;
  min-width: 0;
}

.field-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--space-2);
}

.field-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  background: var(--surface);
  color: var(--ink);
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.field-input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.field-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-2);
}

.btn-primary {
  padding: var(--space-3) var(--space-6);
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 700;
  font-size: var(--text-sm);
  cursor: pointer;
  font-family: var(--font-sans);
  transition: transform var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.profile-side {
  position: sticky;
  top: var(--space-4);
  text-align: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand-600), var(--brand-500));
  color: var(--white);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: var(--text-3xl);
  margin: 0 auto var(--space-4);
  font-family: var(--font-serif);
}

.side-name {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
  margin: 0;
}

.side-email {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin-top: var(--space-1);
}

.side-list {
  margin-top: var(--space-5);
  text-align: left;
}

.side-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.side-row:last-child {
  border-bottom: none;
}

.side-row span {
  color: var(--ink-muted);
}

.side-row b {
  color: var(--brand-800);
}

.legal-card {
  margin-top: var(--space-5);
  background: var(--brand-50);
  border: 1px solid var(--border-subtle);
}

.legal-title {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-2);
}

.legal-note {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0 0 var(--space-3);
  line-height: 1.5;
}

.legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
}

.legal-links a {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-600);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.legal-links a:hover {
  color: var(--accent-500);
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 860px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}
</style>
