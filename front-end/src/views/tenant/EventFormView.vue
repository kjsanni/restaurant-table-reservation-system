<template>
  <div class="event-form-view">
    <div class="page-header">
      <button class="btn-ghost btn-sm" @click="goBack">← Back to Events</button>
      <h1>{{ isEdit ? "Edit Event" : "New Event" }}</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <form v-else @submit.prevent="submit" class="form-card">
      <div class="form-group">
        <label>Event Name *</label>
        <input v-model="form.name" required />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea v-model="form.description" rows="4"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Event Type</label>
          <input
            v-model="form.eventType"
            placeholder="e.g. VIP Lounge, Conference"
          />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select v-model="form.status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Event Date *</label>
          <input v-model="form.eventDate" type="date" required />
        </div>
        <div class="form-group">
          <label>Start Time</label>
          <input v-model="form.startTime" type="time" />
        </div>
        <div class="form-group">
          <label>End Time</label>
          <input v-model="form.endTime" type="time" />
        </div>
      </div>

      <div class="form-group">
        <label>Venue</label>
        <input v-model="form.venue" placeholder="Venue name" />
      </div>

      <div class="form-group">
        <label>Address</label>
        <textarea v-model="form.address" rows="2"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Capacity</label>
          <input v-model.number="form.capacity" type="number" min="1" />
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input v-model="form.isTicketed" type="checkbox" />
            Ticketed Event
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input v-model="form.requiresApproval" type="checkbox" />
            Requires Approval
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input v-model="form.checkinEnabled" type="checkbox" />
            Enable Check-in
          </label>
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="goBack">
          Cancel
        </button>
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{
            submitting ? "Saving..." : isEdit ? "Update Event" : "Create Event"
          }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import eventPortalAPI from "@/services/eventPortalAPI";
import { useToastStore } from "@/stores/toast";

const router = useRouter();
const route = useRoute();
const toastStore = useToastStore();

const loading = ref(false);
const submitting = ref(false);
const error = ref("");

const isEdit = Boolean(route.params.id);
const eventId = route.params.id;

const form = ref({
  name: "",
  description: "",
  eventType: "",
  venue: "",
  address: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  capacity: null,
  status: "draft",
  isTicketed: false,
  requiresApproval: false,
  checkinEnabled: false,
});

const loadEvent = async () => {
  if (!isEdit) return;
  loading.value = true;
  try {
    const res = await eventPortalAPI.getEvent(eventId);
    const item = res.data?.item || res.data;
    form.value = {
      name: item.name || "",
      description: item.description || "",
      eventType: item.eventType || "",
      venue: item.venue || "",
      address: item.address || "",
      eventDate: item.eventDate || "",
      startTime: item.startTime || "",
      endTime: item.endTime || "",
      capacity: item.capacity || null,
      status: item.status || "draft",
      isTicketed: item.isTicketed || false,
      requiresApproval: item.requiresApproval || false,
      checkinEnabled: item.checkinEnabled || false,
    };
  } catch (err) {
    error.value = "Failed to load event";
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  submitting.value = true;
  error.value = "";
  try {
    const payload = { ...form.value };
    if (isEdit) {
      await eventPortalAPI.updateEvent(eventId, payload);
      toastStore.add("Event updated", "success");
    } else {
      await eventPortalAPI.createEvent(payload);
      toastStore.add("Event created", "success");
    }
    router.push("/events/manage");
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to save event";
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.push("/events/manage");
};

onMounted(() => {
  loadEvent();
});
</script>

<style scoped>
.event-form-view {
  padding: var(--space-6);
  max-width: 800px;
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
.form-card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-6);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: normal;
  cursor: pointer;
}
.error-message {
  color: #c92a2a;
  background: #fce8e8;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
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
</style>
