<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCurrency } from "@/composables/useCurrency";
import eventPortalAPI from "@/services/eventPortalAPI";
import logger from "@/utils/logger";

interface Event {
  id: number;
  name: string;
  description?: string;
  venue?: string;
  address?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  status: string;
  isTicketed: boolean;
}

interface WalletPassRequest {
  id: number;
  eventId: number;
  status: string;
  amount: number;
  currency: string;
  paymentReference: string | null;
  platformStatuses: Record<string, string>;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  artifacts?: Array<{
    id: number;
    platform: string;
    status: string;
    artifactType: string;
    hasArtifact: boolean;
    error: string | null;
  }>;
}

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { format: fmt } = useCurrency();

const eventId = computed(() => Number(route.params.eventId));
const event = ref<Event | null>(null);
const walletPassRequest = ref<WalletPassRequest | null>(null);
const loading = ref(true);
const paymentLoading = ref(false);
const polling = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const ticketShortCode = ref("");

let pollTimer: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL = 15000;

const loadEvent = async () => {
  loading.value = true;
  try {
    const res = await eventPortalAPI.getEvent(eventId.value);
    event.value = (res.data?.item || res.data) as Event;
  } catch (err) {
    logger.error("Failed to load event", { error: err });
  } finally {
    loading.value = false;
  }
};

const loadWalletPassRequest = async () => {
  try {
    const res = await eventPortalAPI.listWalletPassRequests(eventId.value);
    const requests = (res.data?.requests || []) as WalletPassRequest[];
    if (requests.length > 0) {
      walletPassRequest.value = requests[0];
    } else {
      walletPassRequest.value = null;
    }
  } catch (err: any) {
    if (err?.response?.status === 503) {
      errorMessage.value =
        "Wallet pass signing is not yet configured for this platform. Please contact support.";
    } else {
      logger.error("Failed to load wallet pass request", { error: err });
    }
    walletPassRequest.value = null;
  }
};

const refreshWalletPassRequest = async () => {
  if (!walletPassRequest.value) return;
  try {
    const res = await eventPortalAPI.getWalletPassRequest(
      eventId.value,
      walletPassRequest.value.id
    );
    walletPassRequest.value = res.data?.request || null;
    if (res.data?.artifacts) {
      walletPassRequest.value!.artifacts = res.data.artifacts;
    }
  } catch (err) {
    logger.error("Failed to refresh wallet pass request", { error: err });
  }
};

const startPolling = () => {
  if (pollTimer) clearInterval(pollTimer);
  polling.value = true;
  pollTimer = setInterval(async () => {
    await refreshWalletPassRequest();
    const current = walletPassRequest.value;
    if (
      current &&
      (current.status === "approved" ||
        current.status === "completed" ||
        current.status === "failed" ||
        current.status === "rejected")
    ) {
      stopPolling();
    }
  }, POLL_INTERVAL);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  polling.value = false;
};

const initiateWalletPassPayment = async () => {
  if (!authStore.user?.email) {
    errorMessage.value = "Email is required for payment";
    return;
  }
  paymentLoading.value = true;
  errorMessage.value = "";
  try {
    const res = await eventPortalAPI.createWalletPassRequest(eventId.value);
    const data = res.data;
    if (data?.paymentUrl) {
      walletPassRequest.value = {
        id: data.requestId,
        eventId: eventId.value,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        paymentReference: null,
        platformStatuses: {},
        reviewNotes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };
      startPolling();
      window.location.href = data.paymentUrl;
    } else {
      throw new Error(data?.message || "Payment initialization failed");
    }
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ||
      "Failed to initialize wallet pass payment";
  } finally {
    paymentLoading.value = false;
  }
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    pending_payment: "Payment Pending",
    pending: "Awaiting Approval",
    approved: "Approved",
    signing: "Signing in Progress",
    completed: "Completed",
    failed: "Failed",
    rejected: "Rejected",
  };
  return map[s] || s;
};

const statusClass = (s: string) => {
  const map: Record<string, string> = {
    pending_payment: "t-upcoming",
    pending: "t-upcoming",
    approved: "t-upcoming",
    signing: "t-upcoming",
    completed: "t-completed",
    failed: "t-cancelled",
    rejected: "t-cancelled",
  };
  return map[s] || "";
};

const showWalletPassButtons = computed(() => {
  const req = walletPassRequest.value;
  if (!req) return false;
  return req.status === "approved" || req.status === "completed";
});

const showPayButton = computed(() => {
  const req = walletPassRequest.value;
  if (req && req.status !== "pending_payment") return false;
  return true;
});

const showAwaitingApproval = computed(() => {
  const req = walletPassRequest.value;
  if (!req) return false;
  return (
    req.status === "pending" ||
    req.status === "pending_payment" ||
    req.status === "signing"
  );
});

const goBack = () => {
  router.push(`/portal/events/${eventId.value}`);
};

onMounted(async () => {
  await Promise.all([loadEvent(), loadWalletPassRequest()]);
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <button class="back-btn" @click="goBack" aria-label="Back to event">
          <span class="mdi mdi:arrow-left"></span>
          Back
        </button>
        <div>
          <h1 v-if="event">{{ event.name }}</h1>
          <p v-if="event">{{ event.venue || "Event Details" }}</p>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="!event" class="state">Event not found.</div>

      <template v-else>
        <div class="wallet-pass-card">
          <div class="card-header">
            <h2>Wallet Pass</h2>
            <span class="subtitle">Add this event to your mobile wallet</span>
          </div>

          <div
            v-if="errorMessage"
            class="error-banner"
            role="alert"
            aria-live="polite"
          >
            {{ errorMessage }}
          </div>

          <div v-if="walletPassRequest" class="request-status">
            <div class="status-row">
              <span
                :class="['status-pill', statusClass(walletPassRequest.status)]"
              >
                {{ statusLabel(walletPassRequest.status) }}
              </span>
              <span v-if="polling" class="polling-indicator">
                <span class="mdi mdi:loading mdi-spin"></span>
                Auto-refreshing…
              </span>
            </div>
          </div>

          <div v-if="showPayButton" class="payment-section">
            <div class="price-display">
              {{
                walletPassRequest?.amount ? fmt(walletPassRequest.amount) : "—"
              }}
            </div>
            <p class="payment-note">
              Pay a one-time fee to enable digital wallet passes for this event.
              After payment, the request is submitted for platform approval.
            </p>
            <button
              class="pay-btn"
              :disabled="paymentLoading"
              @click="initiateWalletPassPayment"
            >
              <span
                v-if="paymentLoading"
                class="mdi mdi:loading mdi-spin"
              ></span>
              <span v-else class="mdi mdi:wallet-gift-card"></span>
              {{ paymentLoading ? "Processing…" : "Pay for Wallet Pass" }}
            </button>
          </div>

          <div v-else-if="showAwaitingApproval" class="awaiting-section">
            <div class="awaiting-content">
              <span
                class="mdi mdi:clock-outline"
                style="font-size: 32px; color: var(--neutral-400)"
              ></span>
              <h3>
                {{
                  walletPassRequest?.status === "pending_payment"
                    ? "Payment Initiated"
                    : walletPassRequest?.status === "pending"
                      ? "Awaiting Approval"
                      : "Signing in Progress"
                }}
              </h3>
              <p class="awaiting-text">
                {{
                  walletPassRequest?.status === "pending_payment"
                    ? "Your payment is being processed. This status will update automatically."
                    : walletPassRequest?.status === "pending"
                      ? "Your request has been submitted for platform approval. You will be notified once approved."
                      : "Your wallet pass is being signed for all supported platforms."
                }}
              </p>
              <p v-if="walletPassRequest?.reviewNotes" class="review-notes">
                Note: {{ walletPassRequest?.reviewNotes }}
              </p>
            </div>
          </div>

          <div v-else-if="showWalletPassButtons" class="wallet-buttons-section">
            <h3>Add to Your Wallet</h3>
            <p class="wallet-intro">
              Your wallet pass is ready. Enter your ticket link code (from the
              WhatsApp or email you received) to add this event to your mobile
              wallet.
            </p>
            <div class="form-group">
              <label for="ticketShortCode">Ticket Link Code</label>
              <input
                id="ticketShortCode"
                v-model="ticketShortCode"
                placeholder="e.g. a1b2c3d4e5f6g7h8"
                maxlength="16"
                style="text-transform: lowercase"
              />
              <p class="help-text">
                Find this 16-character code in your ticket link URL
                (/e/xxxxxxxxxxxxxxxx)
              </p>
            </div>
            <div v-if="ticketShortCode" class="add-buttons">
              <a
                :href="`/e/${ticketShortCode}?format=pkpass`"
                class="btn btn-apple"
                target="_blank"
                rel="noopener"
              >
                <span class="mdi mdi:apple"></span>
                Add to Apple Wallet
              </a>
              <a
                :href="`/e/${ticketShortCode}?format=google`"
                class="btn btn-google"
                target="_blank"
                rel="noopener"
              >
                <span class="mdi mdi:google-play"></span>
                Add to Google Pay
              </a>
              <a
                :href="`/e/${ticketShortCode}?format=samsung`"
                class="btn btn-samsung"
                target="_blank"
                rel="noopener"
              >
                <span class="mdi mdi:samsung-death-star"></span>
                Add to Samsung Pay
              </a>
            </div>
            <p
              v-if="walletPassRequest?.platformStatuses"
              class="platform-statuses"
            >
              <span
                v-for="([platform, status], idx) in Object.entries(
                  walletPassRequest?.platformStatuses || {}
                )"
                :key="idx"
                :class="['platform-pill', `s-${status}`]"
              >
                {{ platform }}: {{ status }}
              </span>
            </p>
          </div>

          <div v-if="successMessage" class="success-banner" role="status">
            {{ successMessage }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--neutral-700);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: var(--space-3);
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}
.back-btn:hover {
  background: var(--neutral-50);
  border-color: var(--neutral-300);
}
.wallet-pass-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}
.card-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--neutral-900);
}
.card-header .subtitle {
  color: var(--neutral-500);
  font-size: 14px;
  margin-top: 4px;
}
.price-display {
  font-size: 32px;
  font-weight: 700;
  color: var(--brand-600);
  text-align: center;
  margin: var(--space-4) 0;
}
.payment-note {
  text-align: center;
  color: var(--neutral-600);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 var(--space-4);
}
.pay-btn {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--brand-600);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition: background 0.15s ease;
}
.pay-btn:hover:not(:disabled) {
  background: var(--brand-700);
}
.pay-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.request-status {
  margin-bottom: var(--space-4);
}
.status-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.status-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 4px var(--space-3);
  border-radius: 999px;
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.status-pill.t-completed {
  background: #dcfce7;
  color: #166534;
}
.status-pill.t-cancelled {
  background: #fee2e2;
  color: #991b1b;
}
.status-pill.t-upcoming {
  background: #fef9c3;
  color: #854d0e;
}
.polling-indicator {
  font-size: 13px;
  color: var(--neutral-500);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.awaiting-section {
  text-align: center;
  padding: var(--space-6) 0;
}
.awaiting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.awaiting-text {
  color: var(--neutral-600);
  font-size: 14px;
  line-height: 1.5;
  max-width: 400px;
  margin: 0;
}
.review-notes {
  color: var(--neutral-500);
  font-size: 13px;
  font-style: italic;
  text-align: center;
}
.wallet-buttons-section h3 {
  margin: 0 0 var(--space-2);
  font-size: 20px;
  font-weight: 700;
  color: var(--neutral-900);
}
.wallet-intro {
  color: var(--neutral-600);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 var(--space-4);
}
.add-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.btn:hover {
  opacity: 0.9;
}
.btn-apple {
  background: #000;
  color: #fff;
}
.btn-google {
  background: #4285f4;
  color: #fff;
}
.btn-samsung {
  background: #1f2937;
  color: #fff;
}
.help-text {
  color: var(--neutral-500);
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
}
.platform-statuses {
  margin-top: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}
.platform-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 2px var(--space-3);
  border-radius: 999px;
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.platform-pill.s-signed {
  background: #dcfce7;
  color: #166534;
}
.platform-pill.s-failed {
  background: #fee2e2;
  color: #991b1b;
}
.error-banner,
.success-banner {
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 14px;
  margin: var(--space-3) 0;
  text-align: center;
}
.error-banner {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.success-banner {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.state {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-600);
}
</style>
