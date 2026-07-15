<script setup>
import { ref, onMounted } from "vue";
import roleAPI from "@/services/roleAPI";
import logger from "@/utils/logger";

const roles = ref([]);
const loading = ref(true);
const showDialog = ref(false);
const editingRole = ref(null);
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

const loadRoles = async () => {
  loading.value = true;
  try {
    const res = await roleAPI.getAllRoles();
    roles.value = res.data.roles;
  } catch (err) {
    logger.error("Failed to load roles", { error: err.message });
  } finally {
    loading.value = false;
  }
};

onMounted(loadRoles);

const openCreate = () => {
  editingRole.value = null;
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

const openEdit = (role) => {
  editingRole.value = role;
  form.value = {
    name: role.name,
    description: role.description || "",
    permissions: role.permissions || {},
  };
  showDialog.value = true;
};

const saveRole = async () => {
  if (editingRole.value) {
    await roleAPI.updateRole(editingRole.value.id, form.value);
  } else {
    await roleAPI.createRole(form.value);
  }
  showDialog.value = false;
  await loadRoles();
};

const deleteRole = async (role) => {
  confirmMessage.value = `Delete role "${role.name}"?`;
  confirmCallback.value = async () => {
    await roleAPI.deleteRole(role.id);
    await loadRoles();
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
      <h1>Role Management</h1>
    </div>
    <div class="content-wrapper">
      <div class="action-bar">
        <button class="btn btn-primary" @click="openCreate">Create Role</button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading roles...</p>
      </div>
      <div v-else class="roles-container">
        <div v-for="role in roles" :key="role.id" class="role-card">
          <div class="role-header">
            <div class="role-title-row">
              <h3 class="role-name">
                {{ role.name }}
                <span v-if="role.isSystem" class="system-badge">System</span>
              </h3>
              <div class="role-actions">
                <button
                  class="btn btn-secondary btn-sm"
                  @click="openEdit(role)"
                >
                  Edit
                </button>
                <button
                  v-if="!role.isSystem"
                  class="btn btn-danger btn-sm"
                  @click="deleteRole(role)"
                >
                  Delete
                </button>
              </div>
            </div>
            <p v-if="role.description" class="role-description">
              {{ role.description }}
            </p>
          </div>

          <div class="meta-section">
            <span class="meta-label">Permissions</span>
            <div class="perm-grid">
              <span
                v-for="(enabled, key) in role.permissions || {}"
                :key="key"
                class="perm-tag"
                :class="{ active: enabled }"
              >
                {{ typeof key === "string" ? key.replace(/_/g, " ") : key }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="!roles.length" class="empty-state">
          No roles configured yet.
        </div>
      </div>

      <div v-if="showDialog" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">
            {{ editingRole ? "Edit Role" : "Create Role" }}
          </h3>
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" placeholder="Role name" />
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
            <button class="btn btn-primary" @click="saveRole">Save</button>
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

.roles-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.role-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--card-shadow);
}

.role-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.role-name {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.system-badge {
  font-size: 11px;
  background-color: #f3f4f6;
  color: #6b7280;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: "Inter-Medium";
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.role-description {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--secondary-gray);
  margin: 0;
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

.role-actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  transition: all 0.15s;
}

.btn-primary {
  background-color: var(--primary-blue);
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: var(--primary-black);
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-danger:hover {
  background-color: #fee2e2;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
}

.modal-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0 0 20px 0;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
}

.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  box-sizing: border-box;
}

.field input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
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
