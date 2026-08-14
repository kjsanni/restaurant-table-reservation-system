<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCapabilities } from "@/composables/useCapabilities";
import eventPortalAPI from "@/services/eventPortalAPI";
import logger from "@/utils/logger";

interface Event {
  id: number;
  name: string;
  description?: string;
  eventType?: string;
  venue?: string;
  address?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status: string;
  isTicketed: boolean;
}

const authStore = useAuthStore();
const router = useRouter();
const { businessVertical } = useCapabilities();
const isEvent = computed(() => businessVertical.value === "event");
const events = ref<Event[]>([]);
const loading = ref(true);
const searchQuery = ref("");

const loadEvents = async () => {
  loading.value = true;
  try {
    const res = await eventPortalAPI.getEvents();
    events.value = (res.data?.rows || res.data || []) as Event[];
  } catch (err) {
    logger.error("Failed to load events", { error: err });
  } finally {
    loading.value = false;
  }
};

const filteredEvents = computed(() => {
  if (!searchQuery.value) return events.value;
  const q = searchQuery.value.toLowerCase();
  return events.value.filter((e: Event) => {
    return (
      (e.name || "").toLowerCase().includes(q) ||
      (e.venue || "").toLowerCase().includes(q) ||
      (e.eventType || "").toLowerCase().includes(q)
    );
  });
});

const eventStatusClass = (status: string) => {
  const map: Record<string, string> = {
    draft: "t-past",
    published: "t-upcoming",
    cancelled: "t-cancelled",
    completed: "t-completed",
  };
  return map[status] || "t-past";
};

const goToEvent = (eventId: number) => {
  router.push(`/portal/events/${eventId}`);
};

onMounted(async () => {
  await loadEvents();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Events</h1>
        <p>Browse upcoming events</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="portal-hero">
        <h2>Upcoming Events</h2>
        <p>
          Discover events at
          {{ authStore.currentTenant?.name || "our venue" }}
        </p>
        <div class="portal-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search events by name, venue, or type"
            aria-label="Search events"
          />
        </div>
      </div>

      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="!filteredEvents.length" class="state">
        No events found.
      </div>
      <template v-else>
        <div class="events-grid">
          <div
            v-for="event in filteredEvents"
            :key="event.id"
            class="event-card"
            @click="goToEvent(event.id)"
          >
            <div class="event-card-header">
              <h3>{{ event.name }}</h3>
              <span :class="['status-pill', eventStatusClass(event.status)]">
                {{ event.status }}
              </span>
            </div>
            <div class="event-card-body">
              <p v-if="event.description" class="event-description">
                {{ event.description }}
              </p>
              <div class="event-meta">
                <span v-if="event.eventType" class="event-type">
                  <span class="mdi mdi:tag"></span>
                  {{ event.eventType }}
                </span>
                <span v-if="event.venue" class="event-venue">
                  <span class="mdi mdi:map-marker"></span>
                  {{ event.venue }}
                </span>
                <span class="event-date">
                  <span class="mdi mdi:calendar"></span>
                  {{ event.eventDate }}
                  <span v-if="event.startTime">
                    {{ event.startTime }}
                    <span v-if="event.endTime"> - {{ event.endTime }}</span>
                  </span>
                </span>
                <span v-if="event.capacity" class="event-capacity">
                  <span class="mdi mdi:account-group"></span>
                  Capacity: {{ event.capacity }}
                </span>
              </div>
            </div>
            <div class="event-card-footer">
              <span v-if="event.isTicketed" class="ticket-badge">
                Ticketed
              </span>
              <span class="view-details">View Details →</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
}
.event-card {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  background: var(--white);
  padding: var(--space-6);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.event-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.event-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.event-card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--neutral-900);
}
.event-card-body {
  margin-bottom: var(--space-4);
}
.event-description {
  color: var(--neutral-600);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.event-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--neutral-600);
}
.event-meta span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.event-meta .mdi {
  color: var(--neutral-400);
  font-size: 16px;
}
.event-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  border-top: 1px solid var(--neutral-100);
}
.ticket-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px var(--space-3);
  border-radius: 999px;
  background: var(--brand-50);
  color: var(--brand-700);
}
.view-details {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-600);
}
</style>
