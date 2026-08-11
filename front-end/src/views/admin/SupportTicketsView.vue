<template>
  <div class="support-tickets-view">
    <div class="page-header">
      <div>
        <h1>Support Tickets</h1>
        <p class="subtitle">Manage and triage venue support requests</p>
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
      <select v-model="filterCategory" class="filter-select" @change="load">
        <option value="">All Categories</option>
        <option value="general">General</option>
        <option value="billing">Billing</option>
        <option value="technical">Technical</option>
        <option value="onboarding">Onboarding</option>
        <option value="salon">Salon</option>
        <option value="restaurant">Restaurant</option>
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
              <th>Category</th>
              <th>Status</th>
              <th>Priority</th>
              <th>SLA</th>
              <th>Assignee</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in items" :key="ticket.id">
              <td>#{{ ticket.id }}</td>
              <td>{{ ticket.subject }}</td>
              <td>
                <span
                  class="category-badge"
                  :class="categoryClass(ticket.category)"
                >
                  {{ ticket.category }}
                </span>
              </td>
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
                <select
                  :value="ticket.assignedTo || ''"
                  class="filter-select assignee-select"
                  @change="assignTicket(ticket.id, $event.target.value)"
                >
                  <option value="">Unassigned</option>
                  <option
                    v-for="agent in agents"
                    :key="agent.id"
                    :value="agent.id"
                  >
                    {{ agent.username }}
                  </option>
                </select>
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
                <button
                  class="btn-sm"
                  @click="autoAssignTicket(ticket.id)"
                  :disabled="ticket.assignedTo"
                >
                  Auto-Assign
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="selectedTicket" class="modal-overlay" @click.self="closeDetail">
      <div class="detail-modal">
        <div class="modal-header">
          <div>
            <h3>Ticket #{{ selectedTicket.id }}</h3>
            <span class="ticket-meta">
              {{ selectedTicket.subject }} • {{ selectedTicket.category }} •
              Created {{ formatDateTime(selectedTicket.createdAt) }}
            </span>
          </div>
          <button class="btn-close" @click="closeDetail">×</button>
        </div>

        <div class="modal-body">
          <div class="thread-section">
            <h4>Thread</h4>
            <div class="thread">
              <div class="thread-item original">
                <div class="thread-header">
                  <span class="thread-author">{{
                    selectedTicket.submitter?.username || "Customer"
                  }}</span>
                  <span class="thread-time">{{
                    formatDateTime(selectedTicket.createdAt)
                  }}</span>
                </div>
                <p class="thread-body">{{ selectedTicket.message }}</p>
              </div>
              <div
                v-for="msg in selectedTicket.messages"
                :key="msg.id"
                class="thread-item"
                :class="msg.senderType"
              >
                <div class="thread-header">
                  <span class="thread-author">{{
                    msg.sender?.username ||
                    (msg.senderType === "agent" ? "Agent" : "Customer")
                  }}</span>
                  <span class="thread-time">{{
                    formatDateTime(msg.createdAt)
                  }}</span>
                </div>
                <p class="thread-body">{{ msg.body }}</p>
              </div>
            </div>
            <div class="reply-box">
              <div class="template-select">
                <select v-model="selectedTemplateId" class="filter-select">
                  <option value="">Insert template...</option>
                  <option
                    v-for="template in templates"
                    :key="template.id"
                    :value="template.id"
                  >
                    {{ template.title }}
                  </option>
                </select>
                <button
                  class="btn-secondary"
                  @click="insertTemplate"
                  :disabled="!selectedTemplateId"
                >
                  Insert
                </button>
              </div>
              <textarea
                v-model="replyBody"
                rows="2"
                placeholder="Write a reply..."
                class="reply-input"
                @keydown.enter.exact.prevent="sendReply"
              ></textarea>
              <button
                class="btn-primary"
                @click="sendReply"
                :disabled="!replyBody.trim() || sendingReply"
              >
                {{ sendingReply ? "Sending..." : "Send" }}
              </button>
            </div>
          </div>

          <div class="side-panels">
            <div class="panel notes-panel">
              <h4>Internal Notes</h4>
              <div class="notes-list">
                <div v-if="notes.length === 0" class="notes-empty">
                  No internal notes yet.
                </div>
                <div v-for="note in notes" :key="note.id" class="note-item">
                  <div class="note-body">
                    <p class="note-text">{{ note.body }}</p>
                    <span class="note-meta">
                      #{{ note.id }} • {{ formatDate(note.createdAt) }}
                    </span>
                  </div>
                  <button
                    class="btn-sm btn-danger"
                    @click="removeNote(note.id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div class="note-form">
                <textarea
                  v-model="newNote"
                  rows="2"
                  placeholder="Add an internal note..."
                  class="note-input"
                ></textarea>
                <button
                  class="btn-primary"
                  @click="addNote"
                  :disabled="addingNote || !newNote.trim()"
                >
                  {{ addingNote ? "Adding..." : "Add" }}
                </button>
              </div>
            </div>

            <div class="panel attachments-panel">
              <h4>Attachments</h4>
              <div v-if="attachments.length === 0" class="attachments-empty">
                No attachments yet.
              </div>
              <div v-else class="attachments-list">
                <div
                  v-for="file in attachments"
                  :key="file.id"
                  class="attachment-item"
                >
                  <div class="attachment-info">
                    <span class="attachment-name">{{ file.originalName }}</span>
                    <span class="attachment-meta">{{
                      formatSize(file.size)
                    }}</span>
                  </div>
                  <div class="attachment-actions">
                    <a
                      v-if="file.url"
                      :href="file.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn-sm btn-link"
                    >
                      Download
                    </a>
                    <button
                      class="btn-sm btn-danger"
                      @click="removeAttachment(file.id)"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <div class="attachment-upload">
                <input
                  type="file"
                  @change="onFileSelected"
                  class="file-input"
                />
                <button
                  class="btn-primary"
                  @click="uploadAttachment"
                  :disabled="!selectedFile || uploading"
                >
                  {{ uploading ? "Uploading..." : "Upload" }}
                </button>
              </div>
            </div>

            <div class="panel actions-panel">
              <h4>Actions</h4>
              <div class="action-group">
                <label class="field-label">Status</label>
                <select
                  :value="selectedTicket.status"
                  class="filter-select"
                  @change="updateStatus(selectedTicket.id, $event.target.value)"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div class="action-group">
                <label class="field-label">Priority</label>
                <select
                  :value="selectedTicket.priority"
                  class="filter-select"
                  @change="
                    updatePriority(selectedTicket.id, $event.target.value)
                  "
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div class="action-group">
                <label class="field-label">CSAT</label>
                <div v-if="selectedTicket.csat" class="csat-display">
                  <span class="csat-stars">{{
                    stars(selectedTicket.csat)
                  }}</span>
                </div>
                <button v-else class="btn-secondary" @click="openCsat">
                  Rate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showCreate"
      class="modal-overlay"
      @click.self="showCreate = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>Create Support Ticket</h3>
          <button class="btn-close" @click="showCreate = false">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Subject</label>
            <input
              v-model="createForm.subject"
              type="text"
              class="field-input"
              placeholder="Brief summary of the issue"
            />
          </div>
          <div class="field">
            <label>Category</label>
            <select v-model="createForm.category" class="field-input">
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="onboarding">Onboarding</option>
              <option value="salon">Salon</option>
              <option value="restaurant">Restaurant</option>
            </select>
          </div>
          <div class="field">
            <label>Priority</label>
            <select v-model="createForm.priority" class="field-input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div class="field">
            <label>Initial Message</label>
            <textarea
              v-model="createForm.message"
              rows="4"
              class="field-input"
              placeholder="Describe the issue in detail"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showCreate = false">
              Cancel
            </button>
            <button
              class="btn-primary"
              @click="submitCreate"
              :disabled="creating || !createForm.subject || !createForm.message"
            >
              {{ creating ? "Creating..." : "Create Ticket" }}
            </button>
          </div>
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
const filterCategory = ref("");
const searchQuery = ref("");
const csatTicket = ref(null);
const csatForm = ref({ rating: 0, feedback: "" });
const notes = ref([]);
const newNote = ref("");
const sendingReply = ref(false);
const addingNote = ref(false);
const agents = ref([]);
const templates = ref([]);
const selectedTemplateId = ref("");
const replyBody = ref("");
const attachments = ref([]);
const selectedFile = ref(null);
const uploading = ref(false);
const creating = ref(false);
const createForm = ref({
  subject: "",
  category: "general",
  priority: "medium",
  message: "",
});

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

const categoryClass = (category) => {
  const map = {
    general: "cat-general",
    billing: "cat-billing",
    technical: "cat-technical",
    onboarding: "cat-onboarding",
    salon: "cat-salon",
    restaurant: "cat-restaurant",
  };
  return map[category] || "cat-general";
};

const statusClass = (status) => {
  const map = {
    open: "status-open",
    in_progress: "status-progress",
    resolved: "status-resolved",
    closed: "status-closed",
  };
  return map[status] || "status-open";
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
    if (filterCategory.value) {
      data = data.filter((t) => t.category === filterCategory.value);
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

const loadNotes = async (ticketId) => {
  try {
    const res = await adminAPI.listSupportNotes(null, ticketId);
    notes.value = res.data?.collection || [];
  } catch {
    notes.value = [];
  }
};

const addNote = async () => {
  if (!newNote.value.trim() || !selectedTicket.value) return;
  addingNote.value = true;
  try {
    await adminAPI.createSupportNote({
      ticketId: selectedTicket.value.id,
      conversationId: selectedTicket.value.conversationId || null,
      body: newNote.value.trim(),
    });
    newNote.value = "";
    await loadNotes(selectedTicket.value.id);
  } finally {
    addingNote.value = false;
  }
};

const removeNote = async (id) => {
  await adminAPI.deleteSupportNote(id);
  if (selectedTicket.value) {
    await loadNotes(selectedTicket.value.id);
  }
};

const loadAttachments = async (ticketId) => {
  try {
    const res = await adminAPI.listSupportAttachments(null, ticketId);
    attachments.value = res.data?.collection || [];
  } catch {
    attachments.value = [];
  }
};

const onFileSelected = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
  }
};

const uploadAttachment = async () => {
  if (!selectedFile.value || !selectedTicket.value) return;
  uploading.value = true;
  try {
    const form = new FormData();
    form.append("file", selectedFile.value);
    form.append("ticketId", String(selectedTicket.value.id));
    if (selectedTicket.value.conversationId) {
      form.append(
        "conversationId",
        String(selectedTicket.value.conversationId)
      );
    }
    await adminAPI.createSupportAttachment(form);
    selectedFile.value = null;
    await loadAttachments(selectedTicket.value.id);
  } finally {
    uploading.value = false;
  }
};

const removeAttachment = async (id) => {
  await adminAPI.deleteSupportAttachment(id);
  if (selectedTicket.value) {
    await loadAttachments(selectedTicket.value.id);
  }
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

const exportCSV = () => {
  const headers = [
    "ID",
    "Subject",
    "Category",
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
    t.category,
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

const loadAgents = async () => {
  try {
    const res = await adminAPI.getUsers?.();
    const payload = res?.data;
    const list = payload?.collection || payload?.items || payload?.users || [];
    agents.value = list;
  } catch {
    agents.value = [];
  }
};

const loadTemplates = async () => {
  try {
    const res = await adminAPI.listSupportTemplates?.();
    templates.value = res?.data?.collection || [];
  } catch {
    templates.value = [];
  }
};

const openCreateModal = () => {
  createForm.value = {
    subject: "",
    category: "general",
    priority: "medium",
    message: "",
  };
  showCreate.value = true;
};

const submitCreate = async () => {
  if (!createForm.value.subject || !createForm.value.message) return;
  creating.value = true;
  try {
    await adminAPI.createSupportTicket(createForm.value);
    showCreate.value = false;
    await load();
  } finally {
    creating.value = false;
  }
};

const closeDetail = () => {
  selectedTicket.value = null;
  notes.value = [];
  attachments.value = [];
  replyBody.value = "";
  selectedTemplateId.value = "";
};

const viewTicket = async (id) => {
  const res = await adminAPI.getSupportTicket(id);
  selectedTicket.value = res.data?.item || null;
  if (selectedTicket.value) {
    replyBody.value = "";
    selectedTemplateId.value = "";
    await loadMessages(selectedTicket.value.id);
    await loadNotes(selectedTicket.value.id);
    await loadAttachments(selectedTicket.value.id);
  }
};

const loadMessages = async (ticketId) => {
  try {
    const res = await adminAPI.listTicketMessages(ticketId);
    const messages = res.data?.collection || [];
    if (selectedTicket.value) {
      selectedTicket.value.messages = messages;
    }
  } catch {
    if (selectedTicket.value) {
      selectedTicket.value.messages = [];
    }
  }
};

const sendReply = async () => {
  if (!replyBody.value.trim() || !selectedTicket.value) return;
  sendingReply.value = true;
  try {
    const res = await adminAPI.sendTicketMessage(
      selectedTicket.value.id,
      replyBody.value.trim()
    );
    const msg = res.data?.item;
    if (msg && selectedTicket.value) {
      selectedTicket.value.messages = selectedTicket.value.messages || [];
      selectedTicket.value.messages.push(msg);
      replyBody.value = "";
    }
  } finally {
    sendingReply.value = false;
  }
};

const insertTemplate = async () => {
  if (!selectedTemplateId.value || !selectedTicket.value) return;
  const template = templates.value.find(
    (t) => t.id === selectedTemplateId.value
  );
  if (!template) return;
  replyBody.value = template.body || replyBody.value;
};

const autoAssignTicket = async (id) => {
  await adminAPI.autoAssignTicket(id);
  await load();
  if (selectedTicket.value?.id === id) {
    const res = await adminAPI.getSupportTicket(id);
    selectedTicket.value = res.data?.item || selectedTicket.value;
  }
};

onMounted(() => {
  load();
  loadAgents();
  loadTemplates();
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
.notes-panel {
  margin-top: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}
.notes-header {
  margin-bottom: var(--space-3);
}
.notes-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
}
.notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.notes-empty {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.note-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface);
}
.note-body {
  flex: 1;
}
.note-text {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-sm);
  color: var(--ink);
}
.note-meta {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.note-form {
  display: flex;
  gap: var(--space-3);
}
.note-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  resize: vertical;
}
.attachments-section {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}
.attachments-section h4 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
}
.attachments-empty {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.attachments-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface);
}
.attachment-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.attachment-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.btn-link {
  text-decoration: none;
  color: var(--brand-700);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
}
.btn-link:hover {
  text-decoration: underline;
}
.attachment-name {
  font-size: var(--text-sm);
  color: var(--ink);
}
.attachment-meta {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.attachment-upload {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.file-input {
  flex: 1;
  font-size: var(--text-sm);
}
.category-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.cat-general {
  background: var(--surface-hover);
  color: var(--ink);
}
.cat-billing {
  background: var(--amber-100);
  color: var(--amber-700);
}
.cat-technical {
  background: var(--rose-100);
  color: var(--rose-700);
}
.cat-onboarding {
  background: var(--sky-100);
  color: var(--sky-700);
}
.cat-salon {
  background: var(--violet-100);
  color: var(--violet-700);
}
.cat-restaurant {
  background: var(--orange-100);
  color: var(--orange-700);
}
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.status-open {
  background: var(--sky-100);
  color: var(--sky-700);
}
.status-progress {
  background: var(--amber-100);
  color: var(--amber-700);
}
.status-resolved {
  background: var(--earth-100);
  color: var(--earth-700);
}
.status-closed {
  background: var(--ink-100);
  color: var(--ink-muted);
}
.ticket-row {
  cursor: pointer;
}
.ticket-row:hover {
  background: var(--surface-hover);
}
.subject-cell {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.subject-text {
  font-weight: 600;
  color: var(--ink);
}
.reply-count {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.assignee-select {
  width: 120px;
}
.detail-modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.ticket-meta {
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.thread-section {
  margin-bottom: var(--space-5);
}
.thread-section h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
}
.thread {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.thread-item {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.thread-item.original {
  background: var(--surface-hover);
}
.thread-item.agent {
  background: var(--brand-50);
  border-color: var(--brand-200);
}
.thread-item.customer {
  background: var(--surface);
}
.thread-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}
.thread-author {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}
.thread-time {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.thread-body {
  margin: 0;
  white-space: pre-wrap;
  font-size: var(--text-sm);
  color: var(--ink);
}
.reply-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.template-select {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}
.template-select .filter-select {
  flex: 1;
}
.reply-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  resize: vertical;
}
.side-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.panel {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.panel h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
}
.action-group {
  margin-bottom: var(--space-3);
}
.field-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
  margin-bottom: var(--space-1);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.field {
  margin-bottom: var(--space-3);
}
.field label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-1);
}
.field-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
.btn-danger {
  border-color: var(--rose-300);
  color: var(--rose-700);
}
</style>
