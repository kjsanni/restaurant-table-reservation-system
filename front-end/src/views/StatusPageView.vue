<script setup lang="ts">
import { ref, onMounted } from "vue";
import { brandColors } from "@/theme/colors";

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
  if (status === "healthy" || status === "operational") return brandColors.earth500;
  if (status === "degraded" || status === "warning") return brandColors.accent500;
  if (status === "unhealthy" || status === "critical") return brandColors.rose500;
  return brandColors.neutral500;
};

const incidentSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return brandColors.rose600;
    case "high":
      return brandColors.accent500;
    case "medium":
      return brandColors.sky500;
    default:
      return brandColors.neutral500;
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
  background: var(--background);
  color: var(--ink);
}
.status-hero {
  background: var(--brand-900);
  color: var(--white);
  padding: var(--space-16) var(--space-6);
  text-align: center;
}
.status-hero h1 {
  margin: 0 0 var(--space-2);
  font-size: var(--text-3xl);
}
.status-subtitle {
  color: var(--ink-muted);
  margin: 0 0 var(--space-6);
}
.status-badge {
  display: inline-block;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-full);
  font-weight: 600;
  color: var(--white);
  text-transform: capitalize;
}
.loading-state,
.error-state {
  text-align: center;
  padding: var(--space-16);
  color: var(--ink-muted);
}
.error-state {
  color: var(--danger);
}
section {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}
section h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--text-xl);
  color: var(--ink);
}
.checks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}
.check-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
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
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
  color: var(--white);
}
.uptime-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-8);
}
.uptime-percent {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--success);
}
.uptime-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.section-header h2 {
  margin: 0;
}
.incident-count {
  color: var(--ink-subtle);
  font-size: var(--text-sm);
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-muted);
}
.incidents-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.incident-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.incident-header {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.incident-severity,
.incident-status {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
  color: var(--white);
}
.incident-card h3 {
  margin: 0 0 var(--space-1);
  font-size: var(--text-base);
}
.incident-date {
  margin: 0;
  color: var(--ink-subtle);
  font-size: var(--text-sm);
}
.sla-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}
.sla-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.sla-card h3 {
  margin: 0 0 var(--space-2);
  font-size: var(--text-base);
  color: var(--ink);
}
.sla-card p {
  margin: 0 0 var(--space-1);
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.status-footer {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-muted);
  font-size: var(--text-sm);
  border-top: 1px solid var(--border);
}
</style>
