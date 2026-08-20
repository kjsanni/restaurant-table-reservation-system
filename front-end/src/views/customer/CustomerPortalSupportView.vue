<template>
  <div class="customer-support">
    <div class="page-header">
      <div>
        <h1>Support</h1>
        <p class="subtitle">
          Get help with your orders, reservations, and account
        </p>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        <span class="btn-icon">+</span> New Ticket
      </button>
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
        <div class="card-label">Closed</div>
        <div class="card-value">{{ summary.closed }}</div>
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
      <select v-model="filterCategory" class="filter-select" @change="load">
        <option value="">All Categories</option>
        <option value="general">General</option>
        <option value="billing">Billing</option>
        <option value="technical">Technical</option>
        <option value="order">Order</option>
        <option value="reservation">Reservation</option>
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
        No support tickets yet
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in items" :key="ticket.id" class="ticket-row">
              <td>#{{ ticket.id }}</td>
              <td>
                <div class="subject-cell">
                  <span class="subject-text">{{ ticket.subject }}</span>
                  <span v-if="ticket.messages?.length" class="reply-count">
                    {{ ticket.messages.length }} replies
                  </span>
                </div>
              </td>
              <td>
                <span
                  class="category-badge"
                  :class="categoryClass(ticket.category)"
                >
                  {{ ticket.category }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="statusClass(ticket.status)">
                  {{ formatStatus(ticket.status) }}
                </span>
              </td>
              <td>{{ formatDate(ticket.updatedAt || ticket.createdAt) }}</td>
              <td class="actions-cell">
                <button class="btn-sm" @click.stop="viewTicket(ticket.id)">
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="selectedTicket" class="modal-overlay" @click.self="closeDetail">
      <div ref="detailModalRef" class="detail-modal" tabindex="-1">
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
            <h4>Conversation</h4>
            <div class="thread">
              <div class="thread-item original">
                <div class="thread-header">
                  <span class="thread-author">You</span>
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
                    (msg.senderType === "agent" ? "Support" : "You")
                  }}</span>
                  <span class="thread-time">{{
                    formatDateTime(msg.createdAt)
                  }}</span>
                </div>
                <p class="thread-body">{{ msg.body }}</p>
              </div>
            </div>
            <div class="reply-box" v-if="selectedTicket.status !== 'closed'">
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
            <div v-else class="reply-box">
              <p class="ticket-message">This ticket is closed.</p>
            </div>
          </div>

          <div class="side-panels">
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
                  <span class="attachment-name">{{ file.originalName }}</span>
                  <span class="attachment-meta">{{
                    formatSize(file.size)
                  }}</span>
                </div>
              </div>
              <div
                class="attachment-upload"
                v-if="selectedTicket.status !== 'closed'"
              >
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
              <h4>Details</h4>
              <div class="action-group">
                <label class="field-label">Status</label>
                <span
                  class="status-badge"
                  :class="statusClass(selectedTicket.status)"
                >
                  {{ formatStatus(selectedTicket.status) }}
                </span>
              </div>
              <div class="action-group">
                <label class="field-label">Priority</label>
                <span class="priority-badge">{{
                  selectedTicket.priority
                }}</span>
              </div>
              <div class="action-group">
                <label class="field-label">Created</label>
                <span class="detail-text">{{
                  formatDateTime(selectedTicket.createdAt)
                }}</span>
              </div>
              <div class="action-group" v-if="selectedTicket.resolvedAt">
                <label class="field-label">Resolved</label>
                <span class="detail-text">{{
                  formatDateTime(selectedTicket.resolvedAt)
                }}</span>
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
      <div ref="createModalRef" class="modal" tabindex="-1">
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
              <option value="order">Order</option>
              <option value="reservation">Reservation</option>
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
            <label>Message</label>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import customerPortalAPI from "@/services/customerPortalAPI";

const loading = ref(false);
const creating = ref(false);
const sendingReply = ref(false);
const uploading = ref(false);
const items = ref([]);
const selectedTicket = ref(null);
const showCreate = ref(false);
const notes = ref([]);
const attachments = ref([]);
const selectedFile = ref(null);
const replyBody = ref("");
const filterStatus = ref("");
const filterCategory = ref("");
const searchQuery = ref("");

const detailModalRef = ref(null);
const createModalRef = ref(null);
const previousActiveElement = ref<HTMLElement | null>(null);

watch(selectedTicket, (val) => {
  if (val) {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      previousActiveElement.value = active;
    }
    nextTick(() => detailModalRef.value?.focus());
  }
});

watch(showCreate, (val) => {
  if (val) {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      previousActiveElement.value = active;
    }
    nextTick(() => createModalRef.value?.focus());
  } else if (previousActiveElement.value) {
    nextTick(() => previousActiveElement.value?.focus());
  }
});

const createForm = ref({
  subject: "",
  category: "general",
  priority: "medium",
  message: "",
});

const summary = computed(() => {
  const open = items.value.filter((t) => t.status === "open").length;
  const inProgress = items.value.filter(
    (t) => t.status === "in_progress"
  ).length;
  const resolved = items.value.filter((t) => t.status === "resolved").length;
  const closed = items.value.filter((t) => t.status === "closed").length;
  return { open, inProgress, resolved, closed };
});

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

const formatStatus = (status) => {
  const map = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return map[status] || status;
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

const categoryClass = (category) => {
  const map = {
    general: "cat-general",
    billing: "cat-billing",
    technical: "cat-technical",
    order: "cat-order",
    reservation: "cat-reservation",
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

const load = async () => {
  loading.value = true;
  try {
    const params = { limit: 100 };
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterCategory.value) params.category = filterCategory.value;
    const res = await customerPortalAPI.listSupportTickets(params);
    let data = res.data?.collection || [];
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      data = data.filter((t) => t.subject.toLowerCase().includes(q));
    }
    items.value = data;
  } finally {
    loading.value = false;
  }
};

const viewTicket = async (id) => {
  const res = await customerPortalAPI.getSupportTicket(id);
  selectedTicket.value = res.data?.item || null;
  if (selectedTicket.value) {
    replyBody.value = "";
    await loadMessages(selectedTicket.value.id);
    await loadAttachments(selectedTicket.value.id);
  }
};

const closeDetail = () => {
  selectedTicket.value = null;
  attachments.value = [];
  replyBody.value = "";
  nextTick(() => previousActiveElement.value?.focus());
};

const sendReply = async () => {
  if (!replyBody.value.trim() || !selectedTicket.value) return;
  sendingReply.value = true;
  try {
    const res = await customerPortalAPI.sendTicketMessage(
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

const loadMessages = async (ticketId) => {
  try {
    const res = await customerPortalAPI.listTicketMessages(ticketId);
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

const loadAttachments = async (ticketId) => {
  try {
    const res = await customerPortalAPI.listTicketAttachments(ticketId);
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
    await customerPortalAPI.createTicketAttachment(
      selectedTicket.value.id,
      form
    );
    selectedFile.value = null;
    await loadAttachments(selectedTicket.value.id);
  } finally {
    uploading.value = false;
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
    await customerPortalAPI.createSupportTicket(createForm.value);
    showCreate.value = false;
    await load();
  } finally {
    creating.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.customer-support {
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
.btn-icon {
  font-size: var(--text-lg);
  line-height: 1;
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
.ticket-row {
  cursor: default;
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
.cat-order {
  background: var(--sky-100);
  color: var(--sky-700);
}
.cat-reservation {
  background: var(--violet-100);
  color: var(--violet-700);
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
.actions-cell {
  display: flex;
  gap: var(--space-2);
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
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.modal-header h3 {
  margin: 0;
}
.ticket-meta {
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.btn-close {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
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
.priority-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.detail-text {
  font-size: var(--text-sm);
  color: var(--ink);
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
.ticket-message {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
</style>
