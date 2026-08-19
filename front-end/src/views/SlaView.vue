<script setup lang="ts">
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

const router = useRouter();
</script>

<template>
  <div class="docs-root">
    <nav class="docs-nav">
      <div class="nav-inner">
        <div class="nav-brand" @click="router.push('/')">
          <Icon icon="mdi:shield-check" width="28" height="28" />
          <span>Vibespot SLA</span>
        </div>
        <div class="nav-actions">
          <button class="nav-link" @click="router.push('/')">Home</button>
          <button class="nav-link" @click="router.push('/status')">
            Status
          </button>
          <button class="nav-link" @click="router.push('/help')">
            Help Center
          </button>
        </div>
      </div>
    </nav>

    <main class="docs-main">
      <div class="docs-container">
        <h1>Service Level Agreement</h1>
        <p class="docs-subtitle">
          This SLA describes the service commitments for Vibespot hosted SaaS
          plans.
        </p>

        <section class="section-block">
          <h2>1. Uptime Commitment</h2>
          <p>
            We target 99.9% monthly uptime for paid plans. Uptime is measured
            from our public status endpoint and excludes scheduled maintenance
            windows.
          </p>
        </section>

        <section class="section-block">
          <h2>2. Support Response Times</h2>
          <ul>
            <li>Critical incidents: 1 hour initial response</li>
            <li>High priority: 4 hours initial response</li>
            <li>Medium priority: 24 hours initial response</li>
            <li>Low priority: best effort within 3 business days</li>
          </ul>
        </section>

        <section class="section-block">
          <h2>3. Maintenance Windows</h2>
          <p>
            Planned maintenance is scheduled during low-traffic hours whenever
            possible. Customers are notified at least 72 hours in advance
            through the status page and email notifications.
          </p>
        </section>

        <section class="section-block">
          <h2>4. Data Protection</h2>
          <p>
            We maintain encrypted storage, daily encrypted backups, and
            compliance with the Ghana Data Protection Act 2012 (Act 843). Tenant
            data is logically isolated and access is audited.
          </p>
        </section>

        <section class="section-block">
          <h2>5. SLA Credits</h2>
          <p>
            If we fail to meet the uptime commitment, eligible tenants may
            request a service credit proportional to the downtime period.
            Credits are applied to future invoices and do not constitute a
            refund.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.docs-root {
  min-height: 100vh;
  background: #faf9f7;
  color: #312e2a;
  font-family:
    "Public Sans",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
.docs-nav {
  background: #1a1410;
  padding: 0.75rem 1.5rem;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
}
.nav-actions {
  display: flex;
  gap: 1rem;
}
.nav-link {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-link:hover {
  color: #fff;
  border-color: #475569;
}
.docs-main {
  padding: 3rem 1.5rem;
}
.docs-container {
  max-width: 900px;
  margin: 0 auto;
}
.docs-container h1 {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
  color: #1a1410;
}
.docs-subtitle {
  margin: 0 0 2rem;
  color: #645d54;
  font-size: 1rem;
}
.section-block {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.section-block h2 {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  color: #1a1410;
}
.section-block p {
  margin: 0 0 0.75rem;
  color: #475569;
  line-height: 1.6;
}
.section-block ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #475569;
  line-height: 1.7;
}
</style>
