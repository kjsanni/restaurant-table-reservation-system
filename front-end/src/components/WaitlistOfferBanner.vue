<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import waitlistAPI from "@/services/waitlistAPI";
import logger from "@/utils/logger";

const emit = defineEmits(["seated"]);

const visible = ref(false);
const loading = ref(false);
const waitlistEntry = ref(null);
const tableId = ref(null);
const offerExpiresAt = ref(null);
const remainingSeconds = ref(0);

let timer = null;
let socketHandler = null;

const startTimer = () => {
  stopTimer();
  remainingSeconds.value = 300;
  timer = setInterval(() => {
    remainingSeconds.value -= 1;
    if (remainingSeconds.value <= 0) {
      dismiss();
    }
  }, 1000);
};

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const acceptOffer = async () => {
  if (!waitlistEntry.value?.id || !tableId.value) return;
  loading.value = true;
  try {
    await waitlistAPI.seatEntry(waitlistEntry.value.id, tableId.value);
    emit("seated");
    dismiss();
  } catch (err) {
    logger.error("Failed to accept waitlist offer", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const dismiss = () => {
  stopTimer();
  visible.value = false;
  waitlistEntry.value = null;
  tableId.value = null;
  offerExpiresAt.value = null;
};

const handleOffer = (payload) => {
  waitlistEntry.value = payload.waitlistEntry || null;
  tableId.value = payload.tableId || null;
  offerExpiresAt.value = payload.offerExpiresAt || null;
  visible.value = !!waitlistEntry.value;
  if (visible.value) {
    startTimer();
  }
};

onMounted(() => {
  socketHandler = (payload) => handleOffer(payload);
  if (window.__socket__) {
    window.__socket__.on("waitlist-offer", socketHandler);
  }
});

onUnmounted(() => {
  stopTimer();
  if (socketHandler && window.__socket__) {
    window.__socket__.off("waitlist-offer", socketHandler);
  }
});

defineExpose({ handleOffer });
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="offer-banner">
      <div class="offer-content">
        <div class="offer-icon">🔔</div>
        <div class="offer-body">
          <strong>Waitlist offer</strong>
          <p>
            {{ waitlistEntry?.name }} · {{ waitlistEntry?.partySize }} guests
            <span v-if="tableId">· Table {{ tableId }}</span>
          </p>
        </div>
        <div class="offer-timer">
          {{ formatTime(remainingSeconds) }}
        </div>
      </div>
      <div class="offer-actions">
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="acceptOffer"
        >
          {{ loading ? "Seating..." : "Accept" }}
        </button>
        <button class="btn btn-secondary" :disabled="loading" @click="dismiss">
          Dismiss
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.offer-banner {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px;
  max-width: calc(100% - 32px);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  padding: 16px;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.offer-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.offer-icon {
  font-size: 22px;
}

.offer-body {
  flex: 1;
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
}

.offer-body p {
  margin: 4px 0 0;
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
}

.offer-timer {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-red);
  min-width: 48px;
  text-align: right;
}

.offer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
}

.btn-primary {
  background: var(--primary-blue);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--neutral-100);
  color: var(--ink);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}
</style>
