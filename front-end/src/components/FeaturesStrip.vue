<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  isSalon: boolean;
}>();
</script>

<template>
  <section class="features-strip reveal-section">
    <div class="bento" v-if="!isSalon">
      <div class="bento-item b1">
        <div class="feature-icon">
          <Icon icon="mdi:clock-fast" width="28" height="28" />
        </div>
        <h3>Quick Checkout</h3>
        <p>Save time with saved preferences and quick reorder.</p>
      </div>
      <div class="bento-item b2">
        <div class="feature-icon">
          <Icon icon="mdi:whatsapp" width="28" height="28" />
        </div>
        <h3>WhatsApp Confirmations</h3>
        <p>Get instant updates on your order and reservation.</p>
      </div>
      <div class="bento-item b3">
        <div class="feature-icon">
          <Icon icon="mdi:shield-check" width="28" height="28" />
        </div>
        <h3>Secure Payments</h3>
        <p>Pay with Mobile Money, card, or cash — GHS pricing.</p>
      </div>
      <div class="bento-item b4">
        <div class="feature-icon">
          <Icon icon="mdi:account-group" width="28" height="28" />
        </div>
        <h3>Salon Profiles</h3>
        <p>Client histories, preferences, and visit tracking.</p>
      </div>
      <div class="bento-item b5">
        <div class="feature-icon">
          <Icon icon="mdi:calendar-clock" width="28" height="28" />
        </div>
        <h3>Smart Scheduling</h3>
        <p>Double-booking guards, buffer times, and reminders.</p>
      </div>
      <div class="bento-item b6">
        <div class="feature-icon">
          <Icon icon="mdi:chart-bar" width="28" height="28" />
        </div>
        <h3>Reports &amp; Insights</h3>
        <p>Revenue by service, top stylists, and peak hours.</p>
      </div>
    </div>

    <div class="bento salon-bento" v-else>
      <div class="bento-item b1">
        <div class="feature-icon">
          <Icon icon="mdi:whatsapp" width="28" height="28" />
        </div>
        <h3>WhatsApp Booking Bot</h3>
        <p>
          Clients book by chatting your salon number. The bot checks
          availability live, confirms the slot, and asks for payment — no app,
          no logins, no friction.
        </p>
      </div>
      <div class="bento-item b2">
        <div class="feature-icon">
          <Icon icon="mdi:cellphone" width="28" height="28" />
        </div>
        <h3>Mobile Money Payments</h3>
        <p>
          Send Paystack payment links right inside WhatsApp. MTN, Vodafone,
          AirtelTigo — clients pay in taps, you get instant confirmation.
        </p>
      </div>
      <div class="bento-item b3">
        <div class="feature-icon">
          <Icon icon="mdi:calendar-check" width="28" height="28" />
        </div>
        <h3>Smart Appointments</h3>
        <p>
          Book by service, stylist, or station. Conflict detection, deposits,
          and automatic reminders keep your chairs full and calendar clean.
        </p>
      </div>
      <div class="bento-item b4">
        <div class="feature-icon">
          <Icon icon="mdi:content-cut" width="28" height="28" />
        </div>
        <h3>Service Catalog</h3>
        <p>
          Prices, durations, deposits, assigned stylists, and station
          requirements.
        </p>
      </div>
      <div class="bento-item b5">
        <div class="feature-icon">
          <Icon icon="mdi:account-star" width="28" height="28" />
        </div>
        <h3>Client Profiles</h3>
        <p>
          Every visit, preference, hair type, and payment method in one record.
        </p>
      </div>
      <div class="bento-item b6">
        <div class="feature-icon">
          <Icon icon="mdi:chart-bar" width="28" height="28" />
        </div>
        <h3>Reports &amp; Insights</h3>
        <p>
          Revenue by service, top stylists, peak hours, and client lifetime
          value.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-strip {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.feature-item {
  text-align: center;
  padding: 32px 24px;
  border-radius: var(--card-radius);
  border: 1px solid var(--border);
  background: white;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.06);
}

.feature-icon {
  display: inline-grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.feature-item:hover .feature-icon {
  transform: scale(1.1) rotate(-5deg);
}

.feature-item h3 {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}

.feature-item p {
  margin: 0;
  font-size: 14px;
  color: var(--ink-muted);
  line-height: 1.6;
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
.salon-bento {
  grid-template-columns: repeat(6, 1fr);
}
.salon-bento .b1 {
  grid-column: span 3;
}
.salon-bento .b2 {
  grid-column: span 3;
}
.salon-bento .b3 {
  grid-column: span 3;
}
.salon-bento .b4 {
  grid-column: span 2;
}
.salon-bento .b5 {
  grid-column: span 2;
}
.salon-bento .b6 {
  grid-column: span 2;
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

@media (max-width: 1024px) {
  .salon-bento {
    grid-template-columns: repeat(4, 1fr);
  }
  .salon-bento .b1,
  .salon-bento .b2,
  .salon-bento .b3 {
    grid-column: span 4;
  }
  .salon-bento .b4,
  .salon-bento .b5,
  .salon-bento .b6 {
    grid-column: span 2;
  }
}
@media (max-width: 640px) {
  .salon-bento {
    grid-template-columns: 1fr;
  }
  .salon-bento .b1,
  .salon-bento .b2,
  .salon-bento .b3,
  .salon-bento .b4,
  .salon-bento .b5,
  .salon-bento .b6 {
    grid-column: span 1;
  }
}
</style>
