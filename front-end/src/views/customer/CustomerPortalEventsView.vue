<template>
  <div class="customer-portal-events-view">
    <div class="events-header">
      <h1>Discover Events</h1>
      <p class="events-subtitle">Find upcoming events near you</p>
    </div>

    <div class="events-filters" v-if="events.length > 0">
      <input
        v-model="search"
        type="text"
        placeholder="Search events..."
        class="events-search"
        @input="debouncedSearch"
      />
      <select v-model="selectedEventType" class="events-type-filter" @change="loadEvents">
        <option value="">All Types</option>
        <option v-for="type in eventTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="events-loading">Loading events...</div>

    <div v-else-if="events.length === 0" class="events-empty">
      <p>No upcoming events found.</p>
    </div>

    <div v-else class="events-grid">
      <article v-for="event in events" :key="event.id" class="event-card">
        <div class="event-card-header">
          <span class="event-date">
            {{ formatDate(event.eventDate) }}
            <span v-if="event.startTime" class="event-time">
              {{ event.startTime }}
            </span>
          </span>
          <span v-if="event.eventType" class="event-type">
            {{ event.eventType }}
          </span>
        </div>
        <h2 class="event-name">{{ event.name }}</h2>
        <p v-if="event.venue" class="event-venue">{{ event.venue }}</p>
        <p v-if="event.address" class="event-address">{{ event.address }}</p>
        <div class="event-card-footer">
          <span v-if="event.tenant" class="event-organizer">
            {{ event.tenant.name }}
          </span>
          <RouterLink
            :to="{ name: 'customer-event-detail', params: { eventId: event.id } }"
            class="event-detail-link"
          >
            View Details
          </RouterLink>
        </div>
      </article>
    </div>

    <div v-if="pagination.pages > 1" class="events-pagination">
      <button
        :disabled="pagination.page <= 1"
        @click="changePage(pagination.page - 1)"
      >
        Previous
      </button>
      <span>Page {{ pagination.page }} of {{ pagination.pages }}</span>
      <button
        :disabled="pagination.page >= pagination.pages"
        @click="changePage(pagination.page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import eventPortalAPI from "@/services/eventPortalAPI";

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
  isTicketed: boolean;
  tenant?: { id: number; name: string; slug: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const events = ref<Event[]>([]);
const loading = ref(true);
const search = ref("");
const selectedEventType = ref("");
const eventTypes = ref<string[]>([]);
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });

let searchTimeout: number | undefined;

const loadEvents = async () => {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
    };
    if (search.value) params.search = search.value;
    if (selectedEventType.value) params.eventType = selectedEventType.value;

    const res = await eventPortalAPI.listPublicEvents(params);
    events.value = res.data?.events || res.data || [];
    if (res.data?.pagination) {
      pagination.value = res.data.pagination;
    }
    const types = new Set<string>();
    (res.data?.events || []).forEach((e: Event) => {
      if (e.eventType) types.add(e.eventType);
    });
    eventTypes.value = Array.from(types);
  } catch {
    events.value = [];
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    pagination.value.page = 1;
    loadEvents();
  }, 300);
};

const changePage = (page: number) => {
  pagination.value.page = page;
  loadEvents();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

onMounted(() => {
  loadEvents();
});
</script>

<style scoped>
.customer-portal-events-view {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}
.events-header {
  margin-bottom: var(--space-6);
}
.events-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: var(--neutral-900);
}
.events-subtitle {
  color: var(--neutral-500);
  margin-top: var(--space-2);
}
.events-filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.events-search {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-size: 14px;
}
.events-type-filter {
  padding: 10px 14px;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--white);
}
.events-loading,
.events-empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-500);
}
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}
.event-card {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: var(--white);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: box-shadow 0.2s ease;
}
.event-card:hover {
  box-shadow: var(--shadow-md);
}
.event-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--neutral-500);
}
.event-date {
  font-weight: 600;
  color: var(--neutral-700);
}
.event-time {
  margin-left: var(--space-2);
  font-weight: 500;
}
.event-type {
  background: var(--primary-light);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.event-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--neutral-900);
}
.event-venue {
  color: var(--neutral-600);
  font-size: 14px;
  margin: 0;
}
.event-address {
  color: var(--neutral-500);
  font-size: 13px;
  margin: 0;
}
.event-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--neutral-100);
}
.event-organizer {
  font-size: 12px;
  color: var(--neutral-500);
}
.event-detail-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
}
.event-detail-link:hover {
  text-decoration: underline;
}
.events-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}
.events-pagination button {
  padding: 8px 16px;
  border: 1px solid var(--neutral-200);
  background: var(--white);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
}
.events-pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
