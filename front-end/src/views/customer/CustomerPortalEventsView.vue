<template>
  <div class="customer-portal-events-view">
    <h1>Events</h1>
    <p class="coming-soon">Event listings coming soon.</p>
  </div>
</template>

<script setup lang="ts">
import eventPortalAPI from "@/services/eventPortalAPI";
import { ref, onMounted } from "vue";

interface Event {
  id: number;
  name: string;
  eventDate: string;
  venue?: string;
  status: string;
}

const events = ref<Event[]>([]);
const loading = ref(true);

const loadEvents = async () => {
  loading.value = true;
  try {
    const res = await eventPortalAPI.getEvents();
    events.value = res.data?.data || res.data || [];
  } catch {
    events.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadEvents);
</script>

<style scoped>
.customer-portal-events-view {
  padding: var(--space-6);
}
.coming-soon {
  color: var(--neutral-500);
  font-size: 14px;
  margin-top: var(--space-2);
}
.event-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.event-card {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--white);
}
.event-card h3 {
  margin: 0 0 var(--space-2);
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900);
}
.event-meta {
  color: var(--neutral-500);
  font-size: 13px;
}
</style>
