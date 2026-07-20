<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import waitlistAPI from "@/services/waitlistAPI";
import logger from "@/utils/logger";

interface WaitlistEntry {
  id: number;
  name: string;
  partySize: number;
  desiredTime?: string;
  createdAt?: string;
}

const router = useRouter();
const entries = ref<WaitlistEntry[]>([]);
const loading = ref(true);

const loadEntries = async () => {
  loading.value = true;
  try {
    const res = await waitlistAPI.getEntries();
    entries.value = res.data.entries || [];
  } catch (err) {
    logger.error("Failed to load waitlist", { error: err });
  } finally {
    loading.value = false;
  }
};

const seatGuest = async (entryId: number) => {
  try {
    await waitlistAPI.seatEntry(entryId);
    await loadEntries();
  } catch (err) {
    logger.error("Failed to seat guest", { error: err });
  }
};

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatTime = (time: string) => {
  if (!time) return "ASAP";
  return time;
};

onMounted(loadEntries);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Waitlist</h1>
        <p>Walk-ins and queued guests</p>
      </div>
      <div class="topbar-right">
        <button class="btn-primary" @click="router.push('/waitlist/add')">
          + Add to Waitlist
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading waitlist...</p>
      </div>

      <div v-else class="waitlist-card">
        <div v-for="entry in entries" :key="entry.id" class="waitlist-item">
          <div class="waitlist-avatar">{{ getInitials(entry.name) }}</div>
          <div class="waitlist-meta">
            <b>{{ entry.name }}</b>
            <span
              >{{ entry.partySize }} guests · Added
              {{ formatTime(entry.desiredTime || entry.createdAt || "") }}</span
            >
          </div>
          <div class="waitlist-actions">
            <button class="btn-sm btn-accent" @click="seatGuest(entry.id)">
              Seat
            </button>
          </div>
        </div>
        <div v-if="!entries.length" class="empty-state">
          No one on the waitlist
        </div>
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

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
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

.waitlist-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  overflow: hidden;
}

.waitlist-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--neutral-100);
  transition: background 0.2s ease;
}

.waitlist-item:last-child {
  border-bottom: none;
}

.waitlist-item:hover {
  background: rgba(243, 221, 211, 0.25);
}

.waitlist-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--brand-100);
  color: var(--brand-800);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.waitlist-meta {
  flex: 1;
}

.waitlist-meta b {
  display: block;
  font-size: 14px;
  color: var(--neutral-900);
}

.waitlist-meta span {
  font-size: 12px;
  color: var(--neutral-600);
}

.waitlist-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 7px 12px;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-accent {
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
}

.btn-accent:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(74, 53, 43, 0.18);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-6);
  gap: var(--space-4);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--space-10);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.btn-primary {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}
</style>
