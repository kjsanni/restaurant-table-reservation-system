<template>
  <div class="support-chat-view">
    <div class="page-header">
      <div>
        <h1>Support Chat</h1>
        <p class="subtitle">Manage tenant conversations and messages</p>
      </div>
      <div class="header-actions">
        <select
          v-model="filterStatus"
          class="filter-select"
          @change="loadConversations"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button class="btn-primary" @click="showCreate = true">
          New Conversation
        </button>
      </div>
    </div>

    <div class="chat-layout">
      <div class="conversation-list-panel">
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="conversations.length === 0" class="empty-state">
          No conversations
        </div>
        <div v-else class="conversation-list">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: selectedConversation?.id === conv.id }"
            @click="selectConversation(conv)"
          >
            <div class="conv-header">
              <span class="conv-id">#{{ conv.id }}</span>
              <span class="badge" :class="statusClass(conv.status)">{{
                conv.status
              }}</span>
            </div>
            <div class="conv-subject">{{ conv.subject || "No subject" }}</div>
            <div class="conv-meta">
              <span>Tenant #{{ conv.tenantId }}</span>
              <span>{{
                formatDate(conv.lastMessageAt || conv.createdAt)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="message-panel">
        <div v-if="!selectedConversation" class="empty-panel">
          Select a conversation to view messages
        </div>
        <div v-else class="message-thread">
          <div class="thread-header">
            <div>
              <h3>Conversation #{{ selectedConversation.id }}</h3>
              <p class="thread-subject">
                {{ selectedConversation.subject || "No subject" }}
              </p>
            </div>
            <div class="thread-actions">
              <select v-model="replyStatus" class="filter-select">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                class="btn-secondary"
                @click="updateStatus"
                :disabled="updating"
              >
                {{ updating ? "Saving..." : "Update" }}
              </button>
              <button
                class="btn-danger"
                @click="confirmDelete"
                :disabled="deleting"
              >
                {{ deleting ? "Deleting..." : "Delete" }}
              </button>
            </div>
          </div>

          <div class="messages-list" ref="messagesContainer">
            <div v-if="messagesLoading" class="loading-state-inline">
              <div class="spinner-sm"></div>
            </div>
            <div v-else-if="messages.length === 0" class="empty-state">
              No messages yet
            </div>
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="message-bubble"
              :class="msg.senderType"
            >
              <div class="message-header">
                <span class="sender">{{
                  msg.senderType === "agent" ? "Agent" : "Customer"
                }}</span>
                <span class="time">{{ formatDate(msg.createdAt) }}</span>
              </div>
              <div class="message-body">{{ msg.body }}</div>
            </div>
          </div>

          <div class="reply-box">
            <textarea
              v-model="replyBody"
              rows="2"
              class="reply-input"
              placeholder="Type a reply..."
            ></textarea>
            <button
              class="btn-primary"
              @click="sendReply"
              :disabled="sending || !replyBody.trim()"
            >
              {{ sending ? "Sending..." : "Send" }}
            </button>
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
        <h3>New Conversation</h3>
        <div class="form-group">
          <label>Subject</label>
          <input
            v-model="newConv.subject"
            class="filter-select"
            placeholder="Subject"
          />
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select v-model="newConv.priority" class="filter-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea
            v-model="newConv.message"
            rows="3"
            class="filter-select"
            placeholder="Initial message"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreate = false">
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="createConversation"
            :disabled="creating || !newConv.message"
          >
            {{ creating ? "Creating..." : "Create" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const conversations = ref([]);
const selectedConversation = ref(null);
const messages = ref([]);
const messagesLoading = ref(false);
const filterStatus = ref("");
const replyBody = ref("");
const sending = ref(false);
const updating = ref(false);
const deleting = ref(false);
const replyStatus = ref("open");
const showCreate = ref(false);
const creating = ref(false);
const newConv = ref({ subject: "", priority: "medium", message: "" });
const messagesContainer = ref(null);

const loadConversations = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listSupportConversations({
      status: filterStatus.value || undefined,
    });
    conversations.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const selectConversation = async (conv) => {
  selectedConversation.value = conv;
  replyStatus.value = conv.status || "open";
  messages.value = [];
  messagesLoading.value = true;
  try {
    const res = await adminAPI.getSupportConversation(conv.id);
    messages.value = res.data?.item?.messages || [];
    await loadMessages(conv.id);
  } finally {
    messagesLoading.value = false;
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop =
          messagesContainer.value.scrollHeight;
      }
    });
  }
};

const loadMessages = async (conversationId) => {
  const res = await adminAPI.listSupportMessages(conversationId);
  messages.value = res.data?.collection || [];
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendReply = async () => {
  if (!selectedConversation.value || !replyBody.value.trim()) return;
  sending.value = true;
  try {
    await adminAPI.sendSupportMessage(
      selectedConversation.value.id,
      replyBody.value
    );
    replyBody.value = "";
    await loadMessages(selectedConversation.value.id);
  } finally {
    sending.value = false;
  }
};

const updateStatus = async () => {
  if (!selectedConversation.value) return;
  updating.value = true;
  try {
    const res = await adminAPI.updateSupportConversation(
      selectedConversation.value.id,
      { status: replyStatus.value }
    );
    selectedConversation.value = res.data?.item || selectedConversation.value;
  } finally {
    updating.value = false;
  }
};

const confirmDelete = async () => {
  if (!selectedConversation.value) return;
  const confirmed = window.confirm(
    "Delete this conversation and all messages?"
  );
  if (!confirmed) return;
  deleting.value = true;
  try {
    await adminAPI.deleteSupportConversation(selectedConversation.value.id);
    selectedConversation.value = null;
    messages.value = [];
    await loadConversations();
  } finally {
    deleting.value = false;
  }
};

const createConversation = async () => {
  creating.value = true;
  try {
    const res = await adminAPI.createSupportConversation(newConv.value);
    showCreate.value = false;
    newConv.value = { subject: "", priority: "medium", message: "" };
    await loadConversations();
    await selectConversation(res.data?.item);
  } finally {
    creating.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

const statusClass = (status) => {
  const map = {
    open: "status-warning",
    in_progress: "status-healthy",
    resolved: "status-healthy",
    closed: "status-failed",
  };
  return map[status] || "";
};

onMounted(() => {
  loadConversations();
});
</script>

<style scoped>
.support-chat-view {
  padding: var(--space-6);
  height: calc(100vh - var(--space-12));
  display: flex;
  flex-direction: column;
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
  align-items: center;
}
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
.chat-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-4);
  flex: 1;
  min-height: 0;
}
.conversation-list-panel {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.conversation-list {
  overflow-y: auto;
  flex: 1;
}
.conversation-item {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.15s ease;
}
.conversation-item:hover {
  background: var(--surface-sunken);
}
.conversation-item.active {
  background: var(--surface-sunken);
  border-left: 3px solid var(--accent);
}
.conv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}
.conv-id {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  font-weight: 600;
}
.conv-subject {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.message-panel {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ink-muted);
}
.message-thread {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.thread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}
.thread-header h3 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.thread-subject {
  margin: var(--space-0-5) 0 0 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.thread-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.message-bubble {
  max-width: 70%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
}
.message-bubble.agent {
  align-self: flex-start;
  background: var(--surface-sunken);
  border: 1px solid var(--border-subtle);
}
.message-bubble.customer {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
}
.message-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-1);
  font-size: var(--text-xs);
  opacity: 0.8;
}
.message-body {
  line-height: 1.5;
  word-break: break-word;
}
.reply-box {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-subtle);
}
.reply-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  resize: none;
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-healthy {
  color: var(--earth-600);
}
.status-warning {
  color: var(--accent-600);
}
.status-failed {
  color: var(--rose-600);
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
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-danger {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: none;
  background: var(--rose-500);
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
}
.modal h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
}
.form-group {
  margin-bottom: var(--space-3);
}
.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
  margin-bottom: var(--space-1);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
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
</style>
