<template>
  <div class="event-guest-list">
    <div class="page-header">
      <button class="btn-ghost btn-sm" @click="goBack">← Back to Events</button>
      <h1>Guest List</h1>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>
      <div v-else-if="guests.length === 0" class="empty-state">
        No guests yet
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="guest in guests" :key="guest.id">
              <td>{{ guest.guestName }}</td>
              <td>{{ guest.guestEmail || "—" }}</td>
              <td>{{ guest.guestPhone || "—" }}</td>
              <td>
                <span class="badge">{{ guest.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import eventPortalAPI from "@/services/eventPortalAPI";

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const guests = ref([]);

const eventId = route.params.eventId;

const load = async () => {
  loading.value = true;
  try {
    const res = await eventPortalAPI.getGuestList(eventId);
    guests.value = res.data?.rows || res.data || [];
  } catch (err) {
    console.error("Failed to load guest list", err);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push("/events/manage");
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.event-guest-list {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0;
}
.card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}
.data-table th {
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--color-surface-alt);
  border: var(--border-default);
}
</style>
