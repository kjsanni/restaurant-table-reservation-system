<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";

const status = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const response = await fetch("/api/v1/public/status");
    const data = await response.json();
    if (data.success) {
      status.value = data;
    } else {
      error.value = "Unable to load status.";
    }
  } catch {
    error.value = "Unable to load status. Please try again later.";
  } finally {
    loading.value = false;
  }
});

const statusColor = (status: string) => {
  if (status === "healthy" || status === "operational") return "#4d7c0f";
  if (status === "degraded" || status === "warning") return "#d97706";
  if (status === "unhealthy" || status === "critical") return "#e11d48";
  return "#9a9389";
};

const incidentSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "#e11d48";
    case "high":
      return "#d97706";
    case "medium":
      return "#3b82f6";
    default:
      return "#9a9389";
  }
};

const formatDate = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};
</script>

<template>
  <div class="status-root">
    <div class="status-hero">
      <h1>System Status</h1>
      <p class="status-subtitle">
        Real-time health and incident updates for Vibespot
      </p>
      <div
        v-if="status"
        class="status-badge"
        :style="{ background: statusColor(status.status) }"
      >
        {{
          status.status === "operational"
            ? "All Systems Operational"
            : status.status === "degraded"
              ? "Degraded Performance"
              : "System Down"
        }}
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading status...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else-if="status">
      <section class="checks-section">
        <h2>Service Health</h2>
        <div class="checks-grid">
          <div
            v-for="(value, key) in status.checks"
            :key="key"
            class="check-card"
          >
            <div class="check-header">
              <span class="check-name">{{ key }}</span>
              <span
                class="check-status"
                :style="{ background: statusColor(value), color: '#fff' }"
              >
                {{ value }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="uptime-section">
        <h2>Uptime</h2>
        <div class="uptime-card">
          <div class="uptime-percent">{{ status.uptime.percentage }}%</div>
          <div class="uptime-details">
            <span>Period: {{ status.uptime.period }}</span>
            <span>Since: {{ formatDate(status.uptime.since) }}</span>
          </div>
        </div>
      </section>

      <section class="incidents-section">
        <div class="section-header">
          <h2>Incidents (30 days)</h2>
          <span class="incident-count"
            >{{ status.incidents.total }} total,
            {{ status.incidents.open }} open</span
          >
        </div>
        <div v-if="status.incidents.recent.length === 0" class="empty-state">
          No incidents in the last 30 days.
        </div>
        <div v-else class="incidents-list">
          <div
            v-for="incident in status.incidents.recent"
            :key="incident.id"
            class="incident-card"
          >
            <div class="incident-header">
              <span
                class="incident-severity"
                :style="{
                  background: incidentSeverityColor(incident.severity),
                }"
              >
                {{ incident.severity }}
              </span>
              <span class="incident-status">{{ incident.status }}</span>
            </div>
            <h3>{{ incident.title }}</h3>
            <p class="incident-date">{{ formatDate(incident.createdAt) }}</p>
          </div>
        </div>
      </section>

      <section class="sla-section">
        <h2>Service Level Agreement</h2>
        <div class="sla-grid">
          <div class="sla-card">
            <h3>Uptime Guarantee</h3>
            <p>99.9% uptime for all paid plans</p>
          </div>
          <div class="sla-card">
            <h3>Support Response</h3>
            <p>Critical incidents: 1 hour</p>
            <p>High priority: 4 hours</p>
            <p>Medium priority: 24 hours</p>
          </div>
          <div class="sla-card">
            <h3>Scheduled Maintenance</h3>
            <p>Planned maintenance windows communicated 72 hours in advance</p>
          </div>
        </div>
      </section>
    </template>

    <footer class="status-footer">
      <p>© 2026 Vibespot Technologies Ltd. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.status-root {
  min-height: 100vh;
  background: #faf9f7;
  color: #312e2a;
}
.status-hero {
  background: #1a1410;
  color: #fff;
  padding: 4rem 1.5rem;
  text-align: center;
}
.status-hero h1 {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
}
.status-subtitle {
  color: #94a3b8;
  margin: 0 0 1.5rem;
}
.status-badge {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  font-weight: 600;
  color: #fff;
  text-transform: capitalize;
}
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: #645d54;
}
.error-state {
  color: #e11d48;
}
section {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
section h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: #1a1410;
}
.checks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
.check-card {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1rem;
}
.check-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.check-name {
  text-transform: capitalize;
  font-weight: 500;
}
.check-status {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}
.uptime-card {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}
.uptime-percent {
  font-size: 3rem;
  font-weight: 700;
  color: #4d7c0f;
}
.uptime-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #645d54;
  font-size: 0.95rem;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.section-header h2 {
  margin: 0;
}
.incident-count {
  color: #7d766c;
  font-size: 0.9rem;
}
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #645d54;
}
.incidents-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.incident-card {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1rem;
}
.incident-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.incident-severity,
.incident-status {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  text-transform: capitalize;
}
.incident-card h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}
.incident-date {
  margin: 0;
  color: #7d766c;
  font-size: 0.85rem;
}
.sla-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
.sla-card {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1rem;
}
.sla-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #1a1410;
}
.sla-card p {
  margin: 0 0 0.25rem;
  color: #645d54;
  font-size: 0.9rem;
}
.status-footer {
  text-align: center;
  padding: 2rem;
  color: #9a9389;
  font-size: 0.9rem;
  border-top: 1px solid #e7e4de;
}
</style>
