<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToastStore } from "@/stores/toast";
import eventPortalAPI from "@/services/eventPortalAPI";

interface Attendee {
  id: number;
  attendeeName: string;
  seat?: string;
  tier?: string;
  ticketType?: string;
  photoUrl?: string;
}

interface CheckinResult {
  valid: boolean;
  admitted?: boolean;
  error?: string;
  message?: string;
  item?: Attendee;
}

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const eventId = computed(() => Number(route.params.eventId));

const event = ref<{ id: number; name: string; venue?: string } | null>(null);
const lastResult = ref<CheckinResult | null>(null);
const scanning = ref(false);
const manualToken = ref("");
const showManual = ref(false);
const scannerActive = ref(true);
const videoActive = ref(false);

let scanTimeout: NodeJS.Timeout | null = null;

const scannerConfig = {
  apiKey: "",
  scannerId: `scanner_${Date.now()}`,
};

const loadEvent = async () => {
  try {
    const res = await eventPortalAPI.getEvent(eventId.value);
    event.value = (res.data?.item || res.data || {}) as {
      id: number;
      name: string;
      venue?: string;
    };
  } catch {
    toast.add("Failed to load event", "error", 4000);
  }
};

const submitScan = async (rawValue: string) => {
  const token = rawValue.trim();
  if (token.length !== 64) {
    rejectScan(
      "INVALID_TOKEN",
      "QR code is malformed. Expected 64-character token."
    );
    return;
  }

  scanning.value = true;
  scannerActive.value = false;

  try {
    const scannerParams = {
      scannerId: scannerConfig.scannerId,
      ...(navigator.geolocation
        ? await getCurrentPosition()
        : { latitude: undefined, longitude: undefined }),
    };

    const res = await eventPortalAPI.checkinToken(token, scannerParams);
    const result: CheckinResult = res.data || {
      valid: false,
      error: "UNKNOWN",
      message: "Unexpected response",
    };

    lastResult.value = result;

    if (result.valid && result.admitted) {
      toast.add(
        `Admitted: ${result.item?.attendeeName || "Guest"}`,
        "success",
        3000
      );
      playSound("success");
    } else {
      const msg = result.message || result.error || "Check-in failed";
      toast.add(msg, "error", 4000);
      playSound("error");
    }
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { message?: string; error?: string } } })
        .response?.data?.message ||
      (err as { message?: string }).message ||
      "Network error during check-in";
    const error =
      (err as { response?: { data?: { error?: string } } }).response?.data
        ?.error || "NETWORK_ERROR";
    rejectScan(error, message);
  } finally {
    scanning.value = false;
    scannerActive.value = true;
  }
};

const rejectScan = (error: string, message: string) => {
  lastResult.value = { valid: false, error, message };
  playSound("error");
  scannerActive.value = true;
};

const getCurrentPosition = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 0, longitude: 0 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve({ latitude: 0, longitude: 0 }),
      { timeout: 3000, enableHighAccuracy: true }
    );
  });
};

const playSound = (type: "success" | "error") => {
  const audio = new Audio(
    type === "success" ? "/sounds/success.mp3" : "/sounds/error.mp3"
  );
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

const startCamera = async () => {
  videoActive.value = true;
  try {
    await initializeScanner();
  } catch (err) {
    console.error("Scanner init failed:", err);
    showManual.value = true;
  }
};

const initializeScanner = async () => {
  if (!window.Html5Qrcode) {
    console.warn("Html5Qrcode not loaded");
    showManual.value = true;
    return;
  }

  const html5QrCode = new window.Html5Qrcode("qr-scanner");
  await html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    },
    (decoded: string) => {
      html5QrCode.pause().catch(() => {});
      submitScan(decoded);
    },
    (err) => {
      if (
        err?.includes?.("not specified") ||
        err?.includes?.("NotFoundError")
      ) {
        showManual.value = true;
      }
    }
  );
};

const stopScanner = () => {
  if (window.Html5Qrcode) {
    const html5QrCode = new window.Html5Qrcode("qr-scanner");
    html5QrCode.stop().catch(() => {});
    html5QrCode.clear().catch(() => {});
  }
};

const handleManualSubmit = () => {
  if (!manualToken.value) return;
  submitScan(manualToken.value);
  manualToken.value = "";
};

const clearResult = () => {
  lastResult.value = null;
  if (!showManual.value) {
    startCamera();
  }
};

const goBack = () => {
  if (scanTimeout) clearTimeout(scanTimeout);
  stopScanner();
  router.push({ name: "event-management" });
};

onMounted(() => {
  loadEvent();

  const scannerApiKey = localStorage.getItem("scannerApiKey");
  if (scannerApiKey) {
    scannerConfig.apiKey = scannerApiKey;
  }

  if (!showManual.value) {
    startCamera();
  }

  scanTimeout = setInterval(() => {
    if (lastResult.value && !lastResult.value.valid) {
      lastResult.value = null;
    }
  }, 5000);
});

onUnmounted(() => {
  if (scanTimeout) clearTimeout(scanTimeout);
  stopScanner();
});
</script>

<template>
  <div
    class="scanner-view"
    :class="{
      'scanner--error': lastResult && !lastResult.valid,
      'scanner--success': lastResult?.valid && lastResult?.admitted,
    }"
  >
    <div class="scanner-header">
      <button class="back-btn" @click="goBack" aria-label="Back to events">
        <span class="mdi mdi:arrow-left"></span>
        Back
      </button>
      <h1 v-if="event" class="event-title">{{ event.name }}</h1>
      <p v-if="event?.venue" class="event-venue">{{ event.venue }}</p>
    </div>

    <div v-if="scanning" class="scanner-overlay">
      <div class="scanner-processing">
        <div class="spinner-lg"></div>
        <p>Verifying ticket...</p>
      </div>
    </div>

    <div
      v-if="lastResult?.valid && lastResult?.admitted && lastResult.item"
      class="scanner-success"
    >
      <div class="admit-card">
        <div class="admit-badge">
          <span class="mdi mdi:check-circle"></span>
          ADMITTED
        </div>
        <div class="attendee-photo">
          <img
            v-if="lastResult.item.photoUrl"
            :src="lastResult.item.photoUrl"
            :alt="lastResult.item.attendeeName"
          />
          <div v-else class="photo-placeholder">
            <span class="mdi mdi:account"></span>
          </div>
        </div>
        <div class="attendee-info">
          <h2 class="attendee-name">{{ lastResult.item.attendeeName }}</h2>
          <div v-if="lastResult.item.seat" class="attendee-seat">
            Seat: {{ lastResult.item.seat }}
          </div>
          <div v-if="lastResult.item.tier" class="attendee-tier">
            <span class="badge badge--{{ lastResult.item.tier?.toLowerCase() }}"
              >{{ lastResult.item.tier }} Tier</span
            >
          </div>
          <div v-if="lastResult.item.ticketType" class="attendee-ticket-type">
            {{ lastResult.item.ticketType }}
          </div>
          <div class="admit-time">
            Checked in at
            {{
              new Date(
                lastResult.item.checkedInAt || new Date()
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }}
          </div>
        </div>
      </div>
      <button class="btn-scan-again" @click="clearResult">
        Scan Next Guest
      </button>
    </div>

    <div v-else-if="lastResult && !lastResult.valid" class="scanner-error">
      <div class="error-card">
        <div class="error-badge">
          <span class="mdi mdi:close-circle"></span>
          DENIED
        </div>
        <p class="error-message">
          {{ lastResult.message || lastResult.error }}
        </p>
        <div v-if="lastResult.error === 'ALREADY_USED'" class="error-hint">
          This ticket has already been scanned.
        </div>
        <div
          v-else-if="lastResult.error === 'DEVICE_MISMATCH'"
          class="error-hint"
        >
          Ticket already scanned at a different gate.
        </div>
        <div
          v-else-if="lastResult.error === 'GEOFENCE_EXCEEDED'"
          class="error-hint"
        >
          Scanner location is too far from venue.
        </div>
        <div v-else class="error-hint">Please verify the ticket manually.</div>
      </div>
      <button class="btn-scan-again" @click="clearResult">
        Scan Next Guest
      </button>
    </div>

    <div v-if="showManual" class="manual-entry">
      <h3>Manual Entry</h3>
      <p>Enter the 64-character ticket token:</p>
      <input
        v-model="manualToken"
        type="text"
        inputmode="text"
        maxlength="64"
        class="token-input"
        placeholder="Paste or enter ticket token..."
      />
      <button
        class="btn-secondary"
        @click="handleManualSubmit"
        :disabled="manualToken.length !== 64"
      >
        Submit
      </button>
    </div>

    <div v-if="!showManual && !lastResult" class="scanner-camera">
      <div
        id="qr-scanner"
        class="camera-container"
        v-show="scannerActive"
      ></div>
    </div>

    <div class="scanner-hint">
      <p>Point camera at QR code. Camera auto-resumes after each scan.</p>
    </div>
  </div>
</template>

<style scoped>
.scanner-view {
  padding: 0;
  max-width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--neutral-50);
  overflow: hidden;
}

.scanner-header {
  padding: var(--space-4);
  background: var(--white);
  border-bottom: 1px solid var(--neutral-200);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

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
}

.event-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--neutral-900);
}

.event-venue {
  margin: var(--space-1) 0 0;
  color: var(--neutral-500);
  font-size: 14px;
}

.scanner-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.scanner-processing {
  text-align: center;
  color: var(--white);
}

.spinner-lg {
  width: 48px;
  height: 48px;
  border: 4px solid var(--neutral-600);
  border-top-color: var(--brand-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--space-4);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.scanner-success {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: #dcfce7;
}

.admit-card {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: popIn 0.3s ease-out;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.admit-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: #16a34a;
  color: var(--white);
  border-radius: 999px;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: var(--space-4);
}

.attendee-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto var(--space-4);
  overflow: hidden;
  background: var(--neutral-200);
  display: flex;
  align-items: center;
  justify-content: center;
}

.attendee-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  font-size: 48px;
  color: var(--neutral-400);
}

.attendee-name {
  margin: 0 0 var(--space-2);
  font-size: 24px;
  font-weight: 700;
}

.attendee-seat,
.attendee-tier,
.attendee-ticket-type {
  color: var(--neutral-600);
  font-size: 14px;
  margin: var(--space-1) 0;
}

.badge {
  display: inline-block;
  padding: 2px var(--space-3);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge--vip {
  background: #fbbf24;
  color: #92400e;
}
.badge--standard {
  background: #dbeafe;
  color: #1e40af;
}
.badge--general {
  background: #e5e7eb;
  color: #374151;
}

.admit-time {
  margin-top: var(--space-3);
  font-size: 28px;
  font-weight: 700;
  color: #16a34a;
}

.scanner-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: #fee2e2;
}

.error-card {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: #dc2626;
  color: var(--white);
  border-radius: 999px;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: var(--space-4);
}

.error-message {
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-3);
}

.error-hint {
  font-size: 14px;
  color: var(--neutral-600);
}

.scanner-camera {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #000;
}

.camera-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-container > video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-hint {
  padding: var(--space-3);
  background: var(--white);
  border-top: 1px solid var(--neutral-200);
  text-align: center;
}

.scanner-hint p {
  color: var(--neutral-500);
  font-size: 14px;
  margin: 0;
}

.btn-scan-again {
  margin-top: var(--space-4);
  padding: var(--space-2) var(--space-6);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--brand-600);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
}

.manual-entry {
  padding: var(--space-4);
  background: var(--white);
  border-top: 1px solid var(--neutral-200);
  text-align: center;
}

.manual-entry h3 {
  margin: 0 0 var(--space-2);
  font-size: 16px;
  font-weight: 600;
}

.manual-entry p {
  margin: 0 0 var(--space-3);
  font-size: 13px;
  color: var(--neutral-500);
}

.token-input {
  width: 100%;
  max-width: 400px;
  padding: var(--space-3);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: 13px;
  margin-bottom: var(--space-3);
  box-sizing: border-box;
}

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-sm);
  background: var(--neutral-100);
  color: var(--neutral-700);
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
