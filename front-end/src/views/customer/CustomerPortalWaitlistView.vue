<script setup lang="ts">
import { ref, onMounted } from "vue";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";

interface WaitlistEntry {
  id: number;
  name: string;
  partySize: number;
  phone?: string;
  email?: string;
  desiredTime?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

const entries = ref<WaitlistEntry[]>([]);
const loading = ref(true);
const showJoinForm = ref(false);
const partySize = ref(2);
const desiredTime = ref("");
const notes = ref("");
const submitting = ref(false);
const formError = ref("");
const message = ref("");

const loadEntries = async () => {
  loading.value = true;
  try {
    const res = await customerPortalAPI.getWaitlist();
    entries.value = (res.data?.entries || []) as WaitlistEntry[];
  } catch (err) {
    logger.error("Failed to load waitlist", { error: err });
  } finally {
    loading.value = false;
  }
};

const joinWaitlist = async () => {
  formError.value = "";
  if (partySize.value < 1) {
    formError.value = "Party size must be at least 1.";
    return;
  }
  if (!desiredTime.value) {
    formError.value = "Please select a desired time.";
    return;
  }
  submitting.value = true;
  message.value = "";
  try {
    await customerPortalAPI.joinWaitlist({
      partySize: partySize.value,
      desiredTime: desiredTime.value || undefined,
      notes: notes.value || undefined,
    });
    message.value = "You have been added to the waitlist.";
    partySize.value = 2;
    desiredTime.value = "";
    notes.value = "";
    showJoinForm.value = false;
    await loadEntries();
  } catch (err) {
    message.value = "Failed to join waitlist. Please try again.";
    logger.error("Join waitlist failed", { error: err });
  } finally {
    submitting.value = false;
  }
};

const cancelEntry = async (id: number) => {
  try {
    await customerPortalAPI.cancelWaitlistEntry(id);
    await loadEntries();
  } catch (err) {
    message.value = "Failed to cancel waitlist entry.";
    logger.error("Cancel waitlist entry failed", { error: err });
  }
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    waiting: "Waiting",
    seated: "Seated",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return map[s] || s;
};

const statusClass = (s: string) => {
  if (s === "waiting") return "t-upcoming";
  if (s === "seated") return "t-confirmed";
  return "t-past";
};

const formatDateTime = (v?: string) => {
  if (!v) return "ASAP";
  const dt = new Date(v);
  if (isNaN(dt.getTime())) return v;
  return dt.toLocaleString();
};

onMounted(() => {
  loadEntries();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Customer Portal</h1>
        <p>Join or manage your waitlist entries</p>
      </div>
      <button class="btn-primary" @click="showJoinForm = !showJoinForm">
        {{ showJoinForm ? "Close" : "Join Waitlist" }}
      </button>
    </div>

    <div class="content-wrapper">
      <form
        v-if="showJoinForm"
        class="join-card"
        @submit.prevent="joinWaitlist"
      >
        <h3>Join Waitlist</h3>
        <div class="form-row">
          <label>
            Party size
            <input v-model.number="partySize" type="number" min="1" max="20" />
          </label>
          <label>
            Desired time
            <input v-model="desiredTime" type="datetime-local" />
          </label>
        </div>
        <label>
          Notes
          <textarea
            v-model="notes"
            rows="3"
            placeholder="Any special requests..."
          ></textarea>
        </label>
        <p v-if="formError" class="error">{{ formError }}</p>
        <button class="btn-primary" type="submit" :disabled="submitting">
          {{ submitting ? "Submitting..." : "Join Waitlist" }}
        </button>
      </form>

      <div v-if="message" class="message" role="status">{{ message }}</div>

      <div class="bookings">
        <h3>Your Waitlist Entries</h3>
        <div v-if="loading" class="state">Loading…</div>
        <div v-else-if="!entries.length" class="state">
          You have no waitlist entries.
        </div>
        <template v-else>
          <div v-for="entry in entries" :key="entry.id" class="booking">
            <div class="booking-meta">
              <b>Party of {{ entry.partySize }}</b>
              <span>
                {{ formatDateTime(entry.desiredTime) }} · Status:
                {{ statusLabel(entry.status) }}
              </span>
              <span v-if="entry.notes" class="entry-notes">{{
                entry.notes
              }}</span>
            </div>
            <span :class="['pill', statusClass(entry.status)]">
              {{ statusLabel(entry.status) }}
            </span>
            <button
              v-if="entry.status === 'waiting'"
              class="btn-link"
              @click="cancelEntry(entry.id)"
            >
              Cancel
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}

.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.join-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.join-card h3 {
  margin: 0 0 var(--space-4);
  font-size: 18px;
  color: var(--neutral-900);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--neutral-700);
  font-weight: 500;
}

input,
textarea {
  padding: 10px 12px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.message {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: #eef2ff;
  color: #3730a3;
  margin-bottom: var(--space-4);
  font-size: 14px;
}

.bookings h3 {
  margin: 0 0 var(--space-4);
  font-size: 18px;
  color: var(--neutral-900);
}

.state {
  padding: 18px;
  border-radius: var(--radius-xl);
  border: 1px dashed var(--neutral-300);
  color: var(--neutral-600);
  text-align: center;
}

.booking {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-3);
}

.booking-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entry-notes {
  font-size: 13px;
  color: var(--neutral-600);
}

.pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.t-upcoming {
  background: #eef2ff;
  color: #3730a3;
}

.t-confirmed {
  background: #dcfce7;
  color: #166534;
}

.t-past {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
</style>
