<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

const router = useRouter();
const activeSection = ref("overview");

const sections = [
  { id: "overview", label: "Overview" },
  { id: "events", label: "Events" },
  { id: "security", label: "Security" },
  { id: "retry", label: "Retry Policy" },
];

const webhookEvents = [
  {
    name: "reservation.created",
    description: "Triggered when a new reservation is created.",
    payload: {
      reservationId: 123,
      tenantId: 1,
      customerId: 45,
      status: "confirmed",
      reservedAt: "2026-08-18T22:00:00Z",
    },
  },
  {
    name: "reservation.cancelled",
    description:
      "Triggered when a reservation is cancelled by customer or staff.",
    payload: {
      reservationId: 123,
      tenantId: 1,
      customerId: 45,
      status: "cancelled",
      cancelledAt: "2026-08-18T22:30:00Z",
    },
  },
  {
    name: "payment.success",
    description: "Triggered when a payment is successfully processed.",
    payload: {
      paymentId: 456,
      reservationId: 123,
      tenantId: 1,
      amount: 150.0,
      currency: "GHS",
      method: "mobile_money",
      paidAt: "2026-08-18T22:05:00Z",
    },
  },
  {
    name: "payment.failed",
    description: "Triggered when a payment fails or is declined.",
    payload: {
      paymentId: 457,
      reservationId: 124,
      tenantId: 1,
      amount: 200.0,
      currency: "GHS",
      method: "card",
      failedAt: "2026-08-18T22:10:00Z",
    },
  },
  {
    name: "order.created",
    description: "Triggered when a new order is placed.",
    payload: {
      orderId: 789,
      tenantId: 1,
      customerId: 45,
      total: 85.5,
      currency: "GHS",
      items: 3,
      createdAt: "2026-08-18T22:15:00Z",
    },
  },
];
</script>

<template>
  <div class="docs-root">
    <nav class="docs-nav">
      <div class="nav-inner">
        <div class="nav-brand" @click="router.push('/')">
          <Icon icon="mdi:api" width="28" height="28" />
          <span>Vibespot Webhook Docs</span>
        </div>
        <div class="nav-actions">
          <button class="nav-link" @click="router.push('/')">Home</button>
          <button class="nav-link" @click="router.push('/help')">
            Help Center
          </button>
          <button class="nav-link" @click="router.push('/api-docs')">
            API Docs
          </button>
        </div>
      </div>
    </nav>

    <main class="docs-main">
      <div class="docs-container">
        <h1>Webhook Documentation</h1>
        <p class="docs-subtitle">
          Configure webhooks to receive real-time event notifications from your
          tenant.
        </p>

        <div class="section-nav">
          <button
            v-for="sec in sections"
            :key="sec.id"
            :class="['section-btn', { active: activeSection === sec.id }]"
            @click="activeSection = sec.id"
          >
            {{ sec.label }}
          </button>
        </div>

        <div v-if="activeSection === 'overview'" class="section-block">
          <h2>Overview</h2>
          <p>
            Webhooks allow Vibespot to push event data to your endpoint when
            specific actions occur. This enables real-time integrations with
            your ERP, CRM, or notification systems.
          </p>
          <ul>
            <li>Webhook endpoints are tenant-specific.</li>
            <li>
              Each event is delivered as a JSON <code>POST</code> request.
            </li>
            <li>You can configure multiple endpoints per tenant.</li>
            <li>
              Endpoints must respond with <code>200 OK</code> within 5 seconds.
            </li>
          </ul>
        </div>

        <div v-if="activeSection === 'events'" class="section-block">
          <h2>Supported Events</h2>
          <p>
            The following events are currently supported. Each event includes a
            consistent envelope with <code>tenantId</code>,
            <code>timestamp</code>, and <code>eventId</code>.
          </p>
          <div v-for="evt in webhookEvents" :key="evt.name" class="event-card">
            <h3>{{ evt.name }}</h3>
            <p>{{ evt.description }}</p>
            <pre>{{ JSON.stringify(evt.payload, null, 2) }}</pre>
          </div>
        </div>

        <div v-if="activeSection === 'security'" class="section-block">
          <h2>Security</h2>
          <p>
            Every webhook request includes a signature header computed using
            HMAC-SHA256 with your tenant webhook secret. Verify signatures
            before processing events.
          </p>
          <ul>
            <li>Header: <code>X-Vibespot-Signature</code></li>
            <li>Header: <code>X-Vibespot-Timestamp</code></li>
            <li>Reject requests with timestamps older than 5 minutes.</li>
            <li>Rotate secrets from the tenant admin portal.</li>
          </ul>
        </div>

        <div v-if="activeSection === 'retry'" class="section-block">
          <h2>Retry Policy</h2>
          <p>
            Failed deliveries are retried with exponential backoff. After 5
            failed attempts, the event is moved to the dead-letter queue and
            visible in the integration analytics dashboard.
          </p>
          <ul>
            <li>Attempt 1: immediate</li>
            <li>Attempt 2: +30s</li>
            <li>Attempt 3: +2m</li>
            <li>Attempt 4: +10m</li>
            <li>Attempt 5: +1h</li>
          </ul>
        </div>
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
.section-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.section-btn {
  background: #fff;
  border: 1px solid #e7e4de;
  color: #645d54;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.section-btn:hover {
  color: #1a1410;
  border-color: #d97706;
}
.section-btn.active {
  background: #d97706;
  color: #fff;
  border-color: #d97706;
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
.section-block code {
  background: #f5f3ef;
  border: 1px solid #e7e4de;
  border-radius: 0.25rem;
  padding: 0.15rem 0.35rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}
.section-block pre {
  background: #1a1410;
  color: #f5f3ef;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}
.event-card {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}
.event-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #1a1410;
}
.event-card p {
  margin: 0 0 0.75rem;
  color: #475569;
}
</style>
