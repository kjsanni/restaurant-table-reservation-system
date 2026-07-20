<template>
  <div class="timeline-page">
    <div class="page-header">
      <div>
        <button @click="$router.back()" class="back-btn">← Back</button>
        <h1>Status Timeline</h1>
        <p class="subtitle">{{ tenant.name }} — {{ tenant.status }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading timeline...</p>
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      <p>No timeline events found for this tenant.</p>
    </div>

    <div v-else class="timeline">
      <div v-for="(item, index) in items" :key="index" class="timeline-item">
        <div class="timeline-marker">
          <span class="marker-dot" :class="statusClass(item.action)"></span>
          <span v-if="index < items.length - 1" class="marker-line"></span>
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="action-badge" :class="statusClass(item.action)">
              {{ formatAction(item.action) }}
            </span>
            <span class="timeline-date">{{
              formatDate(item.createdAt || item.date)
            }}</span>
          </div>
          <p class="timeline-description">
            {{ item.description || item.action }}
          </p>
          <div v-if="item.meta" class="timeline-meta">
            <code>{{ JSON.stringify(item.meta) }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import statusTimelineAPI from "@/services/statusTimelineAPI";

const route = useRoute();
const tenant = ref({ name: "", status: "" });
const items = ref([]);
const loading = ref(true);

const loadData = async () => {
  loading.value = true;
  try {
    const [tenantRes, timelineRes] = await Promise.all([
      tenantAdminAPI.getById(route.params.id),
      statusTimelineAPI.getTimeline(route.params.id),
    ]);
    tenant.value = tenantRes.data.item || {};
    items.value = timelineRes.data.collection || timelineRes.data.items || [];
  } catch (err) {
    console.error("Failed to load timeline", err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

const formatAction = (action) => {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const statusClass = (action) => {
  const a = (action || "").toLowerCase();
  if (a.includes("success") || a.includes("converted") || a.includes("active"))
    return "success";
  if (a.includes("fail") || a.includes("cancel") || a.includes("suspend"))
    return "danger";
  if (a.includes("trial") || a.includes("extend")) return "info";
  if (a.includes("audit")) return "warning";
  return "muted";
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.timeline-page {
  padding: var(--space-6);
  max-width: 800px;
}
.page-header {
  margin-bottom: var(--space-6);
}
.back-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}
.back-btn:hover {
  color: var(--accent-600);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: var(--space-1) 0 0 0;
  font-size: var(--text-sm);
}
.loading-state,
.empty-state {
  padding: var(--space-8);
  text-align: center;
  color: var(--ink-muted);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.timeline {
  position: relative;
  padding-left: var(--space-6);
}
.timeline-item {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: var(--space-4);
}
.marker-dot {
  width: var(--space-3);
  height: var(--space-3);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.marker-dot.success {
  background: var(--earth-500);
}
.marker-dot.danger {
  background: var(--rose-500);
}
.marker-dot.info {
  background: var(--sky-500);
}
.marker-dot.warning {
  background: var(--accent-500);
}
.marker-dot.muted {
  background: var(--neutral-400);
}
.marker-line {
  width: 2px;
  flex: 1;
  background: var(--border);
  margin-top: var(--space-1);
}
.timeline-content {
  flex: 1;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}
.timeline-item:last-child .timeline-content {
  border-bottom: none;
}
.timeline-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-1);
}
.action-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.action-badge.success {
  background: var(--earth-100);
  color: var(--earth-600);
}
.action-badge.danger {
  background: var(--rose-100);
  color: var(--rose-600);
}
.action-badge.info {
  background: var(--sky-100);
  color: var(--sky-600);
}
.action-badge.warning {
  background: var(--accent-100);
  color: var(--accent-600);
}
.action-badge.muted {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.timeline-date {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.timeline-description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  line-height: var(--leading-relaxed);
}
.timeline-meta {
  margin-top: var(--space-2);
}
.timeline-meta code {
  background: var(--neutral-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
</style>
