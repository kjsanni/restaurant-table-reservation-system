<script setup lang="ts">
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { onMounted, watch } from "vue";

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  document.title = "Platform Administration";
  if (authStore.isAuthenticated && authStore.isSuperAdmin) {
    router.replace("/super-admin/overview");
  }
});

watch(
  () => authStore.isAuthenticated && authStore.isSuperAdmin,
  (isSuperAdminAuth) => {
    if (isSuperAdminAuth) {
      router.replace("/super-admin/overview");
    }
  }
);

const goToLogin = () => router.push("/super-admin/login");
const goToDashboard = () => router.push("/super-admin/overview");
</script>

<template>
  <div class="super-landing">
    <nav class="landing-nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <Icon icon="mdi:shield-crown" width="28" height="28" />
          <span>Platform Admin</span>
        </div>
        <div class="nav-actions">
          <button
            v-if="!authStore.isAuthenticated"
            class="nav-link"
            @click="goToLogin"
          >
            Sign in
          </button>
          <button
            v-if="!authStore.isAuthenticated"
            class="nav-btn"
            @click="goToLogin"
          >
            Access Platform
          </button>
          <button
            v-else-if="authStore.isSuperAdmin"
            class="nav-btn"
            @click="goToDashboard"
          >
            Open Dashboard
          </button>
        </div>
      </div>
    </nav>

    <section class="hero">
      <img
        src="@/assets/images/hero-platform-admin.svg"
        alt=""
        class="hero-illustration"
        aria-hidden="true"
      />
      <div class="hero-content">
        <div class="hero-badge">
          <Icon icon="mdi:shield-lock" width="16" height="16" />
          Super admin access only
        </div>
        <h1 class="hero-title">
          Platform <span class="hero-accent">administration</span>
        </h1>
        <p class="hero-subtitle">
          Manage tenants, billing, and platform health. One control plane for
          every restaurant and salon workspace.
        </p>
        <div class="hero-actions">
          <button
            v-if="!authStore.isAuthenticated"
            class="btn-primary-lg"
            v-tap-scale
            @click="goToLogin"
          >
            <Icon icon="mdi:login" width="20" height="20" />
            Platform sign in
          </button>
          <button
            v-else-if="authStore.isSuperAdmin"
            class="btn-primary-lg"
            v-tap-scale
            @click="goToDashboard"
          >
            <Icon icon="mdi:view-dashboard" width="20" height="20" />
            Open Dashboard
          </button>
        </div>
      </div>
    </section>

    <section class="features-strip">
      <div class="bento">
        <div class="bento-item b1">
          <div class="feature-icon">
            <Icon icon="mdi:office-building-multiple" width="28" height="28" />
          </div>
          <h3>Venue Management</h3>
          <p>
            Onboard, configure, and support every restaurant and salon tenant
            from one admin workspace.
          </p>
        </div>
        <div class="bento-item b2">
          <div class="feature-icon">
            <Icon icon="mdi:chart-line" width="28" height="28" />
          </div>
          <h3>Revenue &amp; Billing</h3>
          <p>
            Platform-wide MRR, invoicing, payment health, and Paystack
            reconciliation in one place.
          </p>
        </div>
        <div class="bento-item b3">
          <div class="feature-icon">
            <Icon icon="mdi:heart-pulse" width="28" height="28" />
          </div>
          <h3>Platform Health</h3>
          <p>
            System status, API latency, cache stats, and incident response for
            the entire multi-tenant estate.
          </p>
        </div>
        <div class="bento-item b4">
          <div class="feature-icon">
            <Icon icon="mdi:account-group" width="28" height="28" />
          </div>
          <h3>Access Control</h3>
          <p>
            Role-based admin access, impersonation, audit logs, and security
            tooling across all tenants.
          </p>
        </div>
        <div class="bento-item b5">
          <div class="feature-icon">
            <Icon icon="mdi:file-document-check" width="28" height="28" />
          </div>
          <h3>Compliance</h3>
          <p>
            Ghana DPA 2012, data retention, encryption keys, and compliance
            evidence for auditors.
          </p>
        </div>
        <div class="bento-item b6">
          <div class="feature-icon">
            <Icon icon="mdi:cellphone-link" width="28" height="28" />
          </div>
          <h3>Integrations</h3>
          <p>
            Paystack, WhatsApp Business, ShaQ Express delivery, and marketplace
            integrations managed centrally.
          </p>
        </div>
      </div>
    </section>

    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <Icon icon="mdi:shield-crown" width="24" height="24" />
          <span>Platform Admin</span>
        </div>
        <p class="footer-text">Vibespot Technologies Ltd.</p>
        <p class="footer-copy">&copy; 2026 All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.super-landing {
  min-height: 100vh;
  background: var(--background-warm);
  color: var(--ink);
  font-family: var(--font-sans);
  overflow-x: hidden;
}

.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  backdrop-filter: blur(16px) saturate(180%);
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid var(--border);
  transition: all 0.3s ease;
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--neutral-900);
  letter-spacing: -0.02em;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  background: transparent;
  border: none;
  color: var(--ink-secondary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--ink);
  background: var(--neutral-100);
}

.nav-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
  transition: all 0.2s ease;
}

.nav-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.35);
}

.nav-btn:active {
  transform: translateY(0) scale(0.98);
}

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 80px;
  overflow: hidden;
  background: linear-gradient(
    160deg,
    var(--brand-900) 0%,
    var(--brand-700) 55%,
    var(--brand-600) 100%
  );
}

.hero-illustration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.2);
  width: 640px;
  height: 400px;
  pointer-events: none;
  z-index: 1;
}

.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      420px 220px at 0% 0%,
      rgba(251, 191, 36, 0.18),
      transparent 60%
    ),
    radial-gradient(
      360px 180px at 100% 100%,
      rgba(217, 119, 6, 0.18),
      transparent 60%
    );
  pointer-events: none;
}

.hero-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.3s ease 0.05s forwards;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(40px, 7vw, 72px);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin: 0 0 20px;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.35s ease 0.1s forwards;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.35);
}

.hero-accent {
  background: linear-gradient(135deg, var(--accent-400), var(--earth-400));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: clamp(16px, 2.2vw, 20px);
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
  margin: 0 auto 32px;
  line-height: 1.6;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.35s ease 0.15s forwards;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.3);
}

.hero-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.35s ease 0.2s forwards;
}

.btn-primary-lg {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.3);
  transition: all 0.25s ease;
}

.btn-primary-lg:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(217, 119, 6, 0.4);
}

.btn-primary-lg:active {
  transform: translateY(-1px) scale(0.98);
}

.features-strip {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;
}

.bento-item {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: 22px;
  box-shadow: var(--card-shadow);
  text-align: center;
  transition: all 0.3s ease;
}

.bento-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.06);
}

.bento-item .feature-icon {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  margin-bottom: 14px;
}

.bento-item h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}

.bento-item p {
  margin: 0;
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.55;
}

.b1 {
  grid-column: span 4;
}
.b2 {
  grid-column: span 2;
}
.b3 {
  grid-column: span 2;
}
.b4 {
  grid-column: span 3;
}
.b5 {
  grid-column: span 3;
}
.b6 {
  grid-column: span 6;
}

@media (max-width: 1024px) {
  .bento {
    grid-template-columns: repeat(4, 1fr);
  }
  .b1,
  .b2,
  .b3 {
    grid-column: span 4;
  }
  .b4,
  .b5 {
    grid-column: span 2;
  }
  .b6 {
    grid-column: span 4;
  }
}

@media (max-width: 640px) {
  .bento {
    grid-template-columns: 1fr;
  }
  .b1,
  .b2,
  .b3,
  .b4,
  .b5,
  .b6 {
    grid-column: span 1;
  }
}

.landing-footer {
  border-top: 1px solid var(--border);
  padding: 48px 24px;
  text-align: center;
  background: white;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--ink);
}

.footer-text {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--ink-muted);
}

.footer-copy {
  margin: 0;
  font-size: 12px;
  color: var(--ink-subtle);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
