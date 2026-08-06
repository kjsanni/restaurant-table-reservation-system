<script setup lang="ts">
defineProps<{
  isSalon: boolean;
}>();
</script>

<template>
  <section v-if="!isSalon" class="marquee reveal-section">
    <div class="marquee-track">
      <span class="marquee-item">Instant Booking</span>
      <span class="marquee-item">Paystack Payments</span>
      <span class="marquee-item">WhatsApp Confirmations</span>
      <span class="marquee-item">Mobile Money</span>
      <span class="marquee-item">Salon &amp; Restaurant</span>
      <span class="marquee-item">24/7 Support</span>
      <span class="marquee-item">GHS Pricing</span>
      <span class="marquee-item">Secure Checkout</span>
    </div>
  </section>

  <section v-else class="marquee reveal-section">
    <div class="marquee-track">
      <span class="marquee-item">MTN Mobile Money</span>
      <span class="marquee-item">Vodafone Cash</span>
      <span class="marquee-item">AirtelTigo Money</span>
      <span class="marquee-item">Paystack</span>
      <span class="marquee-item">Bank of Ghana</span>
      <span class="marquee-item">WhatsApp Business</span>
      <span class="marquee-item">Instant Booking</span>
      <span class="marquee-item">GHS Pricing</span>
    </div>
  </section>
</template>

<style scoped>
.marquee {
  overflow: hidden;
  background: linear-gradient(90deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  padding: 14px 0;
}
.marquee-track {
  display: inline-flex;
  gap: 48px;
  animation: marquee 18s linear infinite;
  white-space: nowrap;
}
.marquee-item {
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 13px;
}
@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
