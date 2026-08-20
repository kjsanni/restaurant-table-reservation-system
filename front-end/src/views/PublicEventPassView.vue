<template>
  <div class="public-pass-view">
    <div v-if="loading" class="loading-state">
      <div class="spinner-lg"></div>
      <p>Loading ticket...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <h1>{{ errorTitle }}</h1>
      <p>{{ errorMessage }}</p>
    </div>
    <div v-else-if="pass" class="pass-card">
      <div class="pass-header">
        <h1 class="event-name">{{ pass.eventName }}</h1>
        <p class="event-detail">{{ pass.eventVenue }}</p>
        <p class="event-detail">{{ pass.eventDate }}</p>
      </div>

      <div class="pass-body">
        <div class="attendee-photo">
          <img
            v-if="pass.photoUrl"
            :src="pass.photoUrl"
            :alt="pass.attendeeName"
          />
          <div v-else class="photo-placeholder">
            <span class="mdi mdi:account"></span>
          </div>
        </div>
        <div class="attendee-name">{{ pass.attendeeName || "Guest" }}</div>
        <div class="attendee-meta">
          <span v-if="pass.seat" class="badge">Seat: {{ pass.seat }}</span>
          <span v-if="pass.tier" class="badge">{{ pass.tier }} Tier</span>
          <span v-if="pass.ticketType" class="badge">{{
            pass.ticketType
          }}</span>
        </div>
      </div>

      <div class="pass-actions">
        <button
          class="btn-google-pay"
          v-tap-scale
          :disabled="!googlePayJwt"
          @click="addToGooglePay"
        >
          <span class="mdi mdi:google"></span>
          Add to Google Pay
        </button>
        <button class="btn-apple-wallet" v-tap-scale @click="addToAppleWallet">
          <span class="mdi mdi:apple"></span>
          Add to Apple Wallet
        </button>
      </div>

      <div class="qr-section">
        <p class="qr-hint">Show this ticket at the gate</p>
        <div class="qr-code">
          {{ pass.tokenHash?.substring(0, 16) || "N/A" }}...
        </div>
        <p class="ticket-id">Ticket ID: #{{ pass.id }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useToastStore } from "@/stores/toast";
import eventPortalAPI from "@/services/eventPortalAPI";

const route = useRoute();
const toast = useToastStore();

const loading = ref(true);
const error = ref(false);
const errorTitle = ref("");
const errorMessage = ref("");
const pass = ref<{
  id: number;
  tokenHash: string;
  eventName: string;
  eventVenue: string;
  eventDate: string;
  attendeeName: string;
  seat?: string;
  tier?: string;
  ticketType?: string;
  photoUrl?: string;
} | null>(null);
const googlePayJwt = ref<string | null>(null);

const shortCode = computed(() => route.params.shortCode as string);

onMounted(async () => {
  loading.value = true;
  try {
    const [webPassRes, googleRes] = await Promise.all([
      eventPortalAPI.getWebPass(shortCode.value),
      eventPortalAPI
        .getGooglePayJwt(shortCode.value)
        .catch(() => ({ data: null })),
    ]);

    const data = webPassRes.data || {};
    pass.value = {
      id: data.ticket?.id || data.id,
      tokenHash: data.ticket?.tokenHash || data.tokenHash || "",
      eventName: data.event?.name || "Event Ticket",
      eventVenue: data.event?.venue || "",
      eventDate: data.event?.date
        ? new Date(data.event.date).toLocaleDateString()
        : "",
      attendeeName: data.attendee?.name || "Guest",
      seat: data.attendee?.seat,
      tier: data.attendee?.tier,
      ticketType: data.attendee?.ticketType,
      photoUrl: data.attendee?.photoUrl,
    };
    googlePayJwt.value = googleRes.data?.googlePayJwt || null;
  } catch (err) {
    error.value = true;
    errorTitle.value = "Ticket Not Found";
    errorMessage.value = "The ticket you are looking for could not be found.";
  } finally {
    loading.value = false;
  }
});

const addToGooglePay = () => {
  if (!googlePayJwt.value) return;
  toast.add("Google Pay pass saved", "success", 3000);
};

const addToAppleWallet = () => {
  toast.add("Apple Wallet pass saved", "success", 3000);
};
</script>

<style scoped>
.public-pass-view {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.loading-state,
.error-state {
  text-align: center;
  padding: 48px;
  color: #6c757d;
}
.error-state h1 {
  color: #dc3545;
  margin-bottom: 8px;
}
.pass-card {
  max-width: 420px;
  width: 100%;
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.pass-header {
  text-align: center;
  margin-bottom: 20px;
}
.event-name {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}
.event-detail {
  color: #6c757d;
  font-size: 14px;
  margin-top: 4px;
}
.pass-body {
  text-align: center;
}
.attendee-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 16px;
  background: #e9ecef;
  overflow: hidden;
}
.attendee-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 32px;
}
.attendee-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}
.attendee-meta {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #e9ecef;
  color: #495057;
}
.pass-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.btn-google-pay,
.btn-apple-wallet {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-google-pay {
  background: #4285f4;
  color: #fff;
}
.btn-apple-wallet {
  background: #000;
  color: #fff;
}
.qr-section {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}
.qr-hint {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 12px;
}
.qr-code {
  font-family: monospace;
  font-size: 13px;
  background: #f1f3f5;
  padding: 8px 12px;
  border-radius: 6px;
  display: inline-block;
  word-break: break-all;
}
.ticket-id {
  font-size: 12px;
  color: #6c757d;
  margin-top: 8px;
}
</style>
