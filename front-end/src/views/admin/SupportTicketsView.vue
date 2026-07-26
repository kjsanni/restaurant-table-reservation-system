<template>
  <div class="support-tickets-view">
    <div class="page-header">
      <div>
        <h1>Support Tickets</h1>
        <p class="subtitle">Manage and triage tenant support requests</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportCSV">Export CSV</button>
        <button class="btn-primary" @click="showCreate = true">
          New Ticket
        </button>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Open</div>
        <div class="card-value">{{ summary.open }}</div>
      </div>
      <div class="card">
        <div class="card-label">In Progress</div>
        <div class="card-value">{{ summary.inProgress }}</div>
      </div>
      <div class="card">
        <div class="card-label">Resolved</div>
        <div class="card-value success">{{ summary.resolved }}</div>
      </div>
      <div class="card">
        <div class="card-label">Overdue</div>
        <div class="card-value danger">{{ summary.overdue }}</div>
      </div>
    </div>

    <div class="analytics-bar">
      <div class="analytics-item">
        <span class="analytics-label">Avg resolution time</span>
        <span class="analytics-value">{{ analytics.avgResolutionTime }}</span>
      </div>
      <div class="analytics-item">
        <span class="analytics-label">First response avg</span>
        <span class="analytics-value">{{ analytics.avgFirstResponse }}</span>
      </div>
      <div class="analytics-item">
        <span class="analytics-label">SLA compliance</span>
        <span class="analytics-value" :class="analytics.slaComplianceClass">
          {{ analytics.slaCompliance }}
        </span>
      </div>
      <div class="analytics-item">
        <span class="analytics-label">Escalated</span>
        <span class="analytics-value">{{ analytics.escalated }}</span>
      </div>
    </div>

    <div class="filters">
      <select v-model="filterStatus" class="filter-select" @change="load">
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      <select v-model="filterPriority" class="filter-select" @change="load">
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <select v-model="filterSla" class="filter-select" @change="load">
        <option value="">All SLA</option>
        <option value="overdue">Overdue</option>
        <option value="ok">On Track</option>
      </select>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search subject..."
        class="filter-select"
        @input="load"
      />
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No support tickets found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th>SLA</th>
              <th>CSAT</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in items" :key="ticket.id">
              <td>#{{ ticket.id }}</td>
              <td>{{ ticket.subject }}</td>
              <td>
                <select
                  :value="ticket.status"
                  class="filter-select"
                  @change="updateStatus(ticket.id, $event.target.value)"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td>
                <select
                  :value="ticket.priority"
                  class="filter-select"
                  @change="updatePriority(ticket.id, $event.target.value)"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </td>
              <td>
                <span class="sla-badge" :class="slaClass(ticket)">
                  {{ slaLabel(ticket) }}
                </span>
              </td>
              <td>
                <div v-if="ticket.csatRating" class="csat-display">
                  <span class="csat-stars">{{ stars(ticket.csatRating) }}</span>
                  <span class="csat-feedback" v-if="ticket.csatFeedback"
                    >"{{ ticket.csatFeedback }}"</span
                  >
                </div>
                <button v-else class="btn-sm" @click="openCsat(ticket)">
                  Rate
                </button>
              </td>
              <td>
                <input
                  :value="ticket.assignedTo || ''"
                  type="number"
                  placeholder="User ID"
                  class="filter-select"
                  @change="assignTicket(ticket.id, $event.target.value)"
                />
              </td>
              <td>{{ formatDate(ticket.createdAt) }}</td>
              <td class="actions-cell">
                <button class="btn-sm" @click="viewTicket(ticket.id)">
                  View
                </button>
                <button
                  class="btn-sm btn-warn"
                  @click="escalateTicket(ticket.id)"
                  :disabled="ticket.priority === 'critical'"
                >
                  Escalate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="selectedTicket"
      class="modal-overlay"
      @click.self="selectedTicket = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>Ticket #{{ selectedTicket.id }}</h3>
          <button class="btn-close" @click="selectedTicket = null">×</button>
        </div>
        <div class="modal-body">
          <p><b>Subject:</b> {{ selectedTicket.subject }}</p>
          <p><b>Status:</b> {{ selectedTicket.status }}</p>
          <p><b>Priority:</b> {{ selectedTicket.priority }}</p>
          <p>
            <b>Assigned To:</b> {{ selectedTicket.assignedTo || "Unassigned" }}
          </p>
          <p><b>Created:</b> {{ formatDateTime(selectedTicket.createdAt) }}</p>
          <p v-if="selectedTicket.resolvedAt">
            <b>Resolved:</b> {{ formatDateTime(selectedTicket.resolvedAt) }}
          </p>
          <p><b>Message:</b></p>
          <p class="ticket-message">{{ selectedTicket.message }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="csatTicket"
      class="modal-overlay"
      @click.self="csatTicket = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>Rate Support #{{ csatTicket.id }}</h3>
          <button class="btn-close" @click="csatTicket = null">×</button>
        </div>
        <div class="modal-body">
          <div class="csat-rating">
            <button
              v-for="star in 5"
              :key="star"
              class="star-btn"
              :class="{ active: star <= csatForm.rating }"
              @click="csatForm.rating = star"
            >
              ★
            </button>
          </div>
          <div class="field">
            <label>Feedback (optional)</label>
            <textarea
              v-model="csatForm.feedback"
              rows="3"
              class="field-input"
              placeholder="Tell us how we did..."
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="csatTicket = null">
              Cancel
            </button>
            <button
              class="btn-primary"
              @click="submitCsat"
              :disabled="!csatForm.rating"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import adminAPI from "@/services/adminAPI";

const router = useRouter();
const loading = ref(false);
const items = ref([]);
const selectedTicket = ref(null);
const showCreate = ref(false);
const filterStatus = ref("");
const filterPriority = ref("");
const filterSla = ref("");
const searchQuery = ref("");
const csatTicket = ref(null);
const csatForm = ref({ rating: 0, feedback: "" });

const SLA_THRESHOLDS = {
  critical: 60 * 60 * 1000,
  high: 4 * 60 * 60 * 1000,
  medium: 24 * 60 * 60 * 1000,
  low: 72 * 60 * 60 * 1000,
};

const priorityOrder = ["low", "medium", "high", "critical"];

const summary = computed(() => {
  const open = items.value.filter((t) => t.status === "open").length;
  const inProgress = items.value.filter(
    (t) => t.status === "in_progress"
  ).length;
  const resolved = items.value.filter((t) => t.status === "resolved").length;
  const overdue = items.value.filter((t) => isOverdue(t)).length;
  return { open, inProgress, resolved, overdue };
});

const analytics = computed(() => {
  const now = Date.now();
  const resolvedTickets = items.value.filter(
    (t) => t.status === "resolved" && t.resolvedAt
  );

  let avgResolutionTime = "—";
  let avgFirstResponse = "—";

  if (resolvedTickets.length > 0) {
    const totalMs = resolvedTickets.reduce((sum, t) => {
      const created = new Date(t.createdAt).getTime();
      const resolved = new Date(t.resolvedAt).getTime();
      return sum + (resolved - created);
    }, 0);
    avgResolutionTime = formatDuration(totalMs / resolvedTickets.length);
  }

  const openTickets = items.value.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  );
  const overdueCount = openTickets.filter((t) => isOverdue(t)).length;
  const onTrackCount = openTickets.length - overdueCount;
  const totalOpen = openTickets.length || 1;
  const compliancePct = Math.round((onTrackCount / totalOpen) * 100);
  const slaCompliance = compliancePct + "%";
  const slaComplianceClass =
    compliancePct >= 80 ? "success" : compliancePct >= 50 ? "warn" : "danger";

  const escalated = items.value.filter(
    (t) =>
      t.priority === "critical" &&
      t.status !== "resolved" &&
      t.status !== "closed"
  ).length;

  return {
    avgResolutionTime,
    avgFirstResponse,
    slaCompliance,
    slaComplianceClass,
    escalated,
  };
});

const isOverdue = (ticket) => {
  if (!ticket || ticket.status === "resolved" || ticket.status === "closed") {
    return false;
  }
  const threshold = SLA_THRESHOLDS[ticket.priority] || SLA_THRESHOLDS.medium;
  const created = new Date(ticket.createdAt).getTime();
  return Date.now() - created > threshold;
};

const slaClass = (ticket) => {
  if (ticket.status === "resolved" || ticket.status === "closed")
    return "sla-resolved";
  if (isOverdue(ticket)) return "sla-overdue";
  return "sla-ok";
};

const slaLabel = (ticket) => {
  if (ticket.status === "resolved" || ticket.status === "closed") return "Met";
  if (isOverdue(ticket)) return "Overdue";
  return "On Track";
};

const formatDuration = (ms) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

const stars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

const load = async () => {
  loading.value = true;
  try {
    const params = { limit: 100 };
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterPriority.value) params.priority = filterPriority.value;
    const res = await adminAPI.listSupportTickets(params);
    let data = res.data?.collection || [];
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      data = data.filter((t) => t.subject.toLowerCase().includes(q));
    }
    if (filterSla.value === "overdue") {
      data = data.filter((t) => isOverdue(t));
    } else if (filterSla.value === "ok") {
      data = data.filter((t) => !isOverdue(t));
    }
    items.value = data;
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (id, status) => {
  await adminAPI.updateSupportTicket(id, { status });
  await load();
};

const updatePriority = async (id, priority) => {
  await adminAPI.updateSupportTicket(id, { priority });
  await load();
};

const assignTicket = async (id, userId) => {
  const userIdNum = userId ? parseInt(userId, 10) : null;
  await adminAPI.updateSupportTicket(id, { assignedTo: userIdNum });
  await load();
};

const escalateTicket = async (id) => {
  const ticket = items.value.find((t) => t.id === id);
  if (!ticket) return;
  const currentIndex = priorityOrder.indexOf(ticket.priority);
  if (currentIndex < 0 || currentIndex >= priorityOrder.length - 1) return;
  const nextPriority = priorityOrder[currentIndex + 1];
  await adminAPI.updateSupportTicket(id, { priority: nextPriority });
  await load();
};

const openCsat = (ticket) => {
  csatTicket.value = ticket;
  csatForm.value = { rating: 0, feedback: "" };
};

const submitCsat = async () => {
  if (!csatForm.value.rating) return;
  await adminAPI.submitCsat(csatTicket.value.id, {
    rating: csatForm.value.rating,
    feedback: csatForm.value.feedback || null,
  });
  csatTicket.value = null;
  await load();
};

const viewTicket = async (id) => {
  const res = await adminAPI.getSupportTicket(id);
  selectedTicket.value = res.data?.item || null;
};

const exportCSV = () => {
  const headers = [
    "ID",
    "Subject",
    "Status",
    "Priority",
    "SLA",
    "Assigned To",
    "Created",
    "Resolved",
  ];
  const rows = items.value.map((t) => [
    t.id,
    t.subject,
    t.status,
    t.priority,
    slaLabel(t),
    t.assignedTo || "",
    t.createdAt || "",
    t.resolvedAt || "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `support-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.support-tickets-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.header-actions {
  display: flex;
  gap: var(--space-3);
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.card-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin-top: var(--space-2);
}
.card-value.success {
  color: var(--earth-600);
}
.card-value.danger {
  color: var(--rose-600);
}
.analytics-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.analytics-item {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-sm);
}
.analytics-label {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--space-1);
}
.analytics-value {
  display: block;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.analytics-value.success {
  color: var(--earth-600);
}
.analytics-value.warn {
  color: var(--amber-600);
}
.analytics-value.danger {
  color: var(--rose-600);
}
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
}
.btn-sm {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-xs);
}
.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-warn {
  border-color: var(--amber-300);
  color: var(--amber-700);
}
.sla-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.sla-ok {
  background: var(--earth-100);
  color: var(--earth-700);
}
.sla-overdue {
  background: var(--rose-100);
  color: var(--rose-700);
}
.sla-resolved {
  background: var(--sky-100);
  color: var(--sky-700);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.modal-header h3 {
  margin: 0;
}
.btn-close {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--ink-muted);
}
.ticket-message {
  white-space: pre-wrap;
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.csat-display {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.csat-stars {
  color: var(--amber-500);
  font-size: var(--text-sm);
  letter-spacing: 0.05em;
}
.csat-feedback {
  color: var(--ink-muted);
  font-size: var(--text-xs);
  font-style: italic;
}
.csat-rating {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}
.star-btn {
  background: none;
  border: none;
  font-size: var(--text-2xl);
  color: var(--border);
  cursor: pointer;
  transition: color 0.15s ease;
}
.star-btn.active {
  color: var(--amber-500);
}
</style>
