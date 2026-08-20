<template>
  <div class="customer-portal-event-detail-view">
    <h1>Event Detail</h1>
    <p class="coming-soon">Event details coming soon.</p>
  </div>
</template>

<script setup lang="ts">
import eventPortalAPI from "@/services/eventPortalAPI";
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

interface Event {
  id: number;
  name: string;
  description?: string;
  venue?: string;
  eventDate: string;
  status: string;
}

const route = useRoute();
const event = ref<Event | null>(null);
const loading = ref(true);

const loadEvent = async () => {
  loading.value = true;
  try {
    const eventId = Number(route.params.eventId);
    if (!eventId) return;
    const res = await eventPortalAPI.getEvent(eventId);
    event.value = (res.data?.item || res.data) as Event;
  } catch {
    event.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(loadEvent);
</script>

<style scoped>
.customer-portal-event-detail-view {
  padding: var(--space-6);
}
.coming-soon {
  color: var(--neutral-500);
  font-size: 14px;
  margin-top: var(--space-2);
}
</style>
