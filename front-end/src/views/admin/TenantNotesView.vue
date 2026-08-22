<template>
  <div class="tenant-notes">
    <div class="header">
      <button @click="$router.back()" class="back-btn">← Back</button>
      <h1>Venue Notes</h1>
    </div>

    <div class="section">
      <div class="note-form">
        <textarea
          v-model="newNote"
          rows="3"
          placeholder="Add a support note for this venue..."
        ></textarea>
        <button
          class="btn primary"
          @click="addNote"
          :disabled="addingNote || !newNote.trim()"
        >
          {{ addingNote ? "Adding..." : "Add Note" }}
        </button>
      </div>

      <div v-if="loading" class="loading">Loading notes...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <ul v-else-if="notes.length" class="notes-list">
        <li v-for="note in notes" :key="note.id" class="note-item">
          <div class="note-body">
            <p class="note-text">{{ note.note }}</p>
            <span class="note-date">{{ formatDate(note.createdAt) }}</span>
          </div>
          <button class="note-delete" @click="removeNote(note)">Delete</button>
        </li>
      </ul>
      <p v-else class="notes-empty">No notes yet.</p>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

const route = useRoute();
const tenantId = route.params.id;

const notes = ref([]);
const newNote = ref("");
const addingNote = ref(false);
const loading = ref(false);
const error = ref("");

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const fetchNotes = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get(`${API_BASE}/admin/tenants/${tenantId}/notes`, {
      withCredentials: true,
    });
    notes.value = res.data.collection || res.data.items || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load notes.";
  } finally {
    loading.value = false;
  }
};

const addNote = async () => {
  if (!newNote.value.trim()) return;
  addingNote.value = true;
  try {
    const res = await axios.post(
      `${API_BASE}/admin/tenants/${tenantId}/notes`,
      { note: newNote.value.trim() },
      { withCredentials: true }
    );
    notes.value.push(res.data.item);
    newNote.value = "";
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to add note.";
  } finally {
    addingNote.value = false;
  }
};

const removeNote = async (note) => {
  if (!confirm("Are you sure?")) return;
  try {
    await axios.delete(
      `${API_BASE}/admin/tenants/${tenantId}/notes/${note.id}`,
      { withCredentials: true }
    );
    notes.value = notes.value.filter((n) => n.id !== note.id);
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to delete note.";
  }
};

onMounted(fetchNotes);
</script>

<style scoped>
.tenant-notes {
  padding: 1.5rem;
}
.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #666;
}
.note-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.note-form textarea {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
}
.notes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.note-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: #fafafa;
}
.note-body {
  flex: 1;
}
.note-text {
  margin: 0 0 0.25rem;
  white-space: pre-wrap;
}
.note-date {
  font-size: 0.8rem;
  color: #6b7280;
}
.note-delete {
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 0.25rem;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
  font-size: 0.8rem;
}
.note-delete:hover {
  background: #b91c1c;
}
.loading,
.error,
.notes-empty {
  color: #6b7280;
}
.error {
  color: #dc2626;
}
</style>
