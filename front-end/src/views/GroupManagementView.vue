<script setup>
import { ref, onMounted } from "vue";
import groupAPI from "@/services/groupAPI";
import authAPI from "@/services/authAPI";
import logger from "@/utils/logger";

const groups = ref([]);
const users = ref([]);
const loading = ref(true);
const showDialog = ref(false);
const editingGroup = ref(null);
const showUserDialog = ref(false);
const selectedGroup = ref(null);
const showConfirmModal = ref(false);
const confirmMessage = ref("");
const confirmCallback = ref(null);
const form = ref({
  name: "",
  description: "",
  permissions: {
    view_reservations: true,
    edit_reservations: true,
    manage_tables: true,
    manage_schedule: false,
    manage_staff: false,
    manage_roles: false,
    manage_groups: false,
    view_audit_logs: false,
  },
});
const userForm = ref({ userId: "" });

const permissionKeys = [
  { key: "view_reservations", label: "View Reservations" },
  { key: "edit_reservations", label: "Edit Reservations" },
  { key: "manage_tables", label: "Manage Tables" },
  { key: "manage_schedule", label: "Manage Schedule" },
  { key: "manage_staff", label: "Manage Staff" },
  { key: "manage_roles", label: "Manage Roles" },
  { key: "manage_groups", label: "Manage Groups" },
  { key: "view_audit_logs", label: "View Audit Logs" },
];

onMounted(async () => {
  await Promise.all([loadGroups(), loadUsers()]);
});

const loadGroups = async () => {
  loading.value = true;
  try {
    const res = await groupAPI.getAllGroups();
    groups.value = res.data.groups;
  } catch (err) {
    logger.error("Failed to load groups", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const loadUsers = async () => {
  try {
    const res = await authAPI.getUsers();
    users.value = res.data.users;
  } catch (err) {
    logger.error("Failed to load users", { error: err.message });
  }
};

const openCreate = () => {
  editingGroup.value = null;
  form.value = {
    name: "",
    description: "",
    permissions: {
      view_reservations: true,
      edit_reservations: true,
      manage_tables: true,
      manage_schedule: false,
      manage_staff: false,
      manage_roles: false,
      manage_groups: false,
      view_audit_logs: false,
    },
  };
  showDialog.value = true;
};

const openEdit = (group) => {
  editingGroup.value = group;
  form.value = {
    name: group.name,
    description: group.description || "",
    permissions:
      typeof group.permissions === "object" && group.permissions !== null
        ? group.permissions
        : {},
  };
  showDialog.value = true;
};

const openAddUser = (group) => {
  selectedGroup.value = group;
  userForm.value = { userId: "" };
  showUserDialog.value = true;
};

const saveGroup = async () => {
  if (editingGroup.value) {
    await groupAPI.updateGroup(editingGroup.value.id, form.value);
  } else {
    await groupAPI.createGroup(form.value);
  }
  showDialog.value = false;
  await loadGroups();
};

const deleteGroup = async (group) => {
  confirmMessage.value = `Delete group "${group.name}"?`;
  confirmCallback.value = async () => {
    await groupAPI.deleteGroup(group.id);
    await loadGroups();
  };
  showConfirmModal.value = true;
};

const addUser = async () => {
  await groupAPI.addUserToGroup(selectedGroup.value.id, userForm.value.userId);
  showUserDialog.value = false;
  await loadGroups();
};

const removeUser = async (group, userId) => {
  confirmMessage.value = "Remove this user from the group?";
  confirmCallback.value = async () => {
    await groupAPI.removeUserFromGroup(group.id, userId);
    await loadGroups();
  };
  showConfirmModal.value = true;
};

const confirmAction = async () => {
  if (confirmCallback.value) {
    await confirmCallback.value();
  }
  showConfirmModal.value = false;
  confirmMessage.value = "";
  confirmCallback.value = null;
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-inner">
        <h1 class="topbar-title">Groups</h1>
        <p class="topbar-subtitle">Organize staff into groups</p>
      </div>
    </div>
    <div class="content-wrapper">
      <div class="action-bar">
        <button class="btn btn-primary" @click="openCreate">
          Create Group
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading groups...</p>
      </div>
      <div v-else class="groups-container">
        <div v-for="group in groups" :key="group.id" class="group-card">
          <div class="group-header">
            <div class="group-title-row">
              <h3 class="group-name">{{ group.name }}</h3>
              <div class="group-actions">
                <button
                  class="btn btn-secondary btn-sm"
                  @click="openAddUser(group)"
                >
                  Add User
                </button>
                <button
                  class="btn btn-secondary btn-sm"
                  @click="openEdit(group)"
                >
                  Edit
                </button>
                <button
                  class="btn btn-danger btn-sm"
                  @click="deleteGroup(group)"
                >
                  Delete
                </button>
              </div>
            </div>
            <p v-if="group.description" class="group-description">
              {{ group.description }}
            </p>
          </div>

          <div class="group-meta">
            <div class="meta-section">
              <span class="meta-label">Permissions</span>
              <div class="perm-grid">
                <span
                  v-for="(enabled, key) in group.permissions || {}"
                  :key="key"
                  class="perm-tag"
                  :class="{ active: enabled }"
                >
                  {{ typeof key === "string" ? key.replace(/_/g, " ") : key }}
                </span>
              </div>
            </div>

            <div v-if="group.Users && group.Users.length" class="meta-section">
              <span class="meta-label">Members</span>
              <div class="members-grid">
                <span v-for="u in group.Users" :key="u.id" class="member-tag">
                  {{ u.username }}
                  <button
                    class="remove-btn"
                    @click="removeUser(group, u.id)"
                    title="Remove member"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!groups.length" class="empty-state">
          No groups configured yet.
        </div>
      </div>

      <div v-if="showDialog" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">
            {{ editingGroup ? "Edit Group" : "Create Group" }}
          </h3>
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" placeholder="Group name" />
          </div>
          <div class="field">
            <label>Description</label>
            <input v-model="form.description" placeholder="Description" />
          </div>
          <div class="field">
            <label>Permissions</label>
            <div class="permissions-grid">
              <label
                v-for="perm in permissionKeys"
                :key="perm.key"
                class="permission-item"
              >
                <input type="checkbox" v-model="form.permissions[perm.key]" />
                {{ perm.label }}
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showDialog = false">
              Cancel
            </button>
            <button class="btn btn-primary" @click="saveGroup">Save</button>
          </div>
        </div>
      </div>

      <div v-if="showUserDialog" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">Add User to {{ selectedGroup?.name }}</h3>
          <div class="field">
            <label>Select User</label>
            <select v-model="userForm.userId">
              <option value="">-- Select user --</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.username }} ({{ u.role }})
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showUserDialog = false">
              Cancel
            </button>
            <button class="btn btn-primary" @click="addUser">Add</button>
          </div>
        </div>
      </div>

      <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">Confirm</h3>
          <p class="modal-subtitle">{{ confirmMessage }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showConfirmModal = false">
              Cancel
            </button>
            <button class="btn btn-danger" @click="confirmAction">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: var(--space-5) var(--page-margin-x);
}
.topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.topbar-title {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}
.topbar-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  margin: 4px 0 0;
}

.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.action-bar {
  margin-bottom: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-5);
  gap: var(--space-4);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.group-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--card-shadow);
}

.group-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.group-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.group-name {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
  margin: 0;
}

.group-description {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0;
}

.group-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-3-5);
}

.meta-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.meta-label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ink-muted);
}

.perm-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.perm-tag {
  font-size: 11px;
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-sm, 6px);
  background-color: var(--neutral-100);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 500;
  text-transform: capitalize;
}

.perm-tag.active {
  background-color: var(--earth-50);
  color: var(--earth-600);
}

.members-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.member-tag {
  font-size: 12px;
  background-color: var(--accent-soft);
  color: var(--accent-text);
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-sm, 6px);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5);
  font-family: var(--font-sans);
  font-weight: 500;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--accent-text);
  cursor: pointer;
  font-weight: bold;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  transition: color var(--duration-150) var(--ease-in-out);
}

.remove-btn:hover {
  color: var(--rose-600);
}

.group-actions {
  display: flex;
  gap: var(--space-2);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  transition: all var(--duration-150) var(--ease-in-out);
}

.btn-primary {
  background: linear-gradient(135deg, var(--ink) 0%, var(--ink-secondary) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: var(--neutral-50);
  color: var(--ink);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--neutral-100);
}

.btn-danger {
  background-color: var(--rose-50);
  color: var(--rose-600);
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--rose-100);
}

.btn-sm {
  padding: var(--space-1-5) var(--space-3);
  font-size: var(--text-xs);
}

.empty-state {
  text-align: center;
  padding: var(--space-10);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal, 1000);
}

.modal {
  background-color: var(--surface);
  padding: var(--space-6);
  border-radius: var(--card-radius);
  width: 90%;
  max-width: 480px;
  box-shadow: var(--shadow-xl, var(--shadow-md));
}

.modal-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
  margin: 0 0 var(--space-5) 0;
}

.field {
  margin-bottom: var(--space-4);
}

.field label {
  display: block;
  margin-bottom: var(--space-1-5);
  font-weight: 600;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
}

.field input,
.field select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  box-sizing: border-box;
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.permissions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2-5);
}

.permission-item {
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 300;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2-5);
  margin-top: var(--space-2);
}
</style>
