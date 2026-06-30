<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  VaButton,
  VaModal,
  VaCard,
  VaCardContent,
  VaInput,
  VaSelect,
} from "vuestic-ui";
import groupAPI from "@/services/groupAPI";
import authAPI from "@/services/authAPI";

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
    console.error("Failed to load groups", err);
  } finally {
    loading.value = false;
  }
};

const loadUsers = async () => {
  try {
    const res = await authAPI.getUsers();
    users.value = res.data.users;
  } catch (err) {
    console.error("Failed to load users", err);
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
    permissions: group.permissions || {},
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
    <div class="header">
      <h1>Group Management</h1>
    </div>
    <div class="content-wrapper">
      <div class="action-bar">
        <VaButton preset="primary" @click="openCreate">Create Group</VaButton>
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
                <VaButton
                  preset="secondary"
                  size="small"
                  @click="openAddUser(group)"
                  >Add User</VaButton
                >
                <VaButton
                  preset="secondary"
                  size="small"
                  @click="openEdit(group)"
                  >Edit</VaButton
                >
                <VaButton
                  preset="danger"
                  size="small"
                  @click="deleteGroup(group)"
                  >Delete</VaButton
                >
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
                  v-for="(enabled, key) in group.permissions"
                  :key="key"
                  class="perm-tag"
                  :class="{ active: enabled }"
                >
                  {{ key.replace(/_/g, " ") }}
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

      <VaModal
        v-model="showDialog"
        :title="editingGroup ? 'Edit Group' : 'Create Group'"
        size="small"
      >
        <VaCard>
          <VaCardContent>
            <div class="field">
              <VaInput
                v-model="form.name"
                label="Name"
                placeholder="Group name"
              />
            </div>
            <div class="field">
              <VaInput
                v-model="form.description"
                label="Description"
                placeholder="Description"
              />
            </div>
            <div class="field">
              <label class="field-label">Permissions</label>
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
          </VaCardContent>
          <template #actions>
            <VaButton preset="secondary" @click="showDialog = false"
              >Cancel</VaButton
            >
            <VaButton preset="primary" @click="saveGroup">Save</VaButton>
          </template>
        </VaCard>
      </VaModal>

      <VaModal v-model="showUserDialog" title="Add User to Group" size="small">
        <VaCard>
          <VaCardContent>
            <div class="field">
              <VaSelect
                v-model="userForm.userId"
                label="Select User"
                :options="
                  users.map((u) => ({
                    label: `${u.username} (${u.role})`,
                    value: u.id,
                  }))
                "
                placeholder="-- Select user --"
              />
            </div>
          </VaCardContent>
          <template #actions>
            <VaButton preset="secondary" @click="showUserDialog = false"
              >Cancel</VaButton
            >
            <VaButton preset="primary" @click="addUser">Add</VaButton>
          </template>
        </VaCard>
      </VaModal>

      <VaModal v-model="showConfirmModal" title="Confirm" size="small">
        <VaCard>
          <VaCardContent>
            <p class="modal-subtitle">{{ confirmMessage }}</p>
          </VaCardContent>
          <template #actions>
            <VaButton preset="secondary" @click="showConfirmModal = false"
              >Cancel</VaButton
            >
            <VaButton preset="danger" @click="confirmAction">Confirm</VaButton>
          </template>
        </VaCard>
      </VaModal>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
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
  padding: 80px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--lighter-gray);
  border-top-color: var(--primary-blue);
  border-radius: 50%;
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
  gap: 16px;
}

.group-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--card-shadow);
}

.group-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.group-name {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black);
  margin: 0;
}

.group-description {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--secondary-gray);
  margin: 0;
}

.group-meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.meta-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-label {
  font-family: "Inter-Medium";
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--secondary-gray);
}

.perm-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.perm-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  background-color: #f3f4f6;
  color: var(--secondary-gray);
  font-family: "Inter-Medium";
  text-transform: capitalize;
}

.perm-tag.active {
  background-color: #d1fae5;
  color: #065f46;
}

.members-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.member-tag {
  font-size: 12px;
  background-color: #dbeafe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: "Inter-Medium";
}

.remove-btn {
  background: none;
  border: none;
  color: #1e40af;
  cursor: pointer;
  font-weight: bold;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  transition: color 0.15s;
}

.remove-btn:hover {
  color: #991b1b;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.field {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
}

.permissions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.permission-item {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Inter-Light";
}

.modal-subtitle {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
}
</style>
