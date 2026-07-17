<script setup>
import { ref, onMounted } from "vue";
import roleAPI from "@/services/roleAPI";
import logger from "@/utils/logger";

const roles = ref([]);
const templates = ref([]);
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
    const [rolesRes, templatesRes] = await Promise.all([
      roleAPI.getAllRoles(),
      roleAPI.getAllTemplates(),
    ]);
    roles.value = rolesRes.data.roles;
    templates.value = templatesRes.data.templates || [];
  } catch (err) {
    logger.error("Failed to load roles", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const applyTemplate = (template) => {
  form.value = {
    name: template.name || "",
    description: template.description || "",
    permissions: template.permissions || {},
  };
  showDialog.value = true;
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
    <PageHeader
      title="Roles"
      subtitle="Manage permissions and access control"
    />
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

      <div class="templates-section">
        <div class="section-header">
          <h2 class="section-title">Permission Templates</h2>
          <button class="btn btn-primary btn-sm" @click="openCreate">
            + New Template
          </button>
        </div>
        <div v-if="!templates.length" class="empty-state">
          No templates yet.
        </div>
        <div v-else class="templates-grid">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-card"
          >
            <div class="template-header">
              <h4 class="template-name">{{ template.name }}</h4>
              <span v-if="template.isPublic" class="meta-badge">Public</span>
            </div>
            <p v-if="template.description" class="template-description">
              {{ template.description }}
            </p>
            <div class="perm-grid">
              <span
                v-for="(enabled, key) in template.permissions"
                :key="key"
                class="perm-tag"
                :class="{ active: enabled }"
              >
                {{ key.replace(/_/g, " ") }}
              </span>
            </div>
            <div class="template-actions">
              <button
                class="btn btn-secondary btn-sm"
                @click="applyTemplate(template)"
              >
                Apply to Role
              </button>
            </div>
          </div>
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

.roles-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.role-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--card-shadow);
}

.role-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.role-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.role-name {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2-5);
}

.system-badge {
  font-size: 11px;
  background-color: var(--neutral-100);
  color: var(--ink-secondary);
  padding: var(--space-0-5) var(--space-2-5);
  border-radius: var(--radius-sm, 6px);
  font-family: var(--font-sans);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.role-description {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0;
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

.role-actions {
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

.field input {
  width: 100%;
  padding: var(--space-3) var(--space-3);
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

.field input:focus {
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

.templates-section {
  margin-top: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.template-card {
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: 16px;
  background: white;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-name {
  margin: 0;
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black);
}

.template-description {
  margin: 0;
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
}

.meta-badge {
  padding: 2px 8px;
  border-radius: 10px;
  background: #dbeafe;
  color: #1e40af;
  font-family: "Inter-Medium";
  font-size: 11px;
}

.template-actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.perm-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.perm-tag {
  padding: 3px 8px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  font-family: "Inter-Medium";
  font-size: 11px;
  text-transform: capitalize;
}

.perm-tag.active {
  background: #dcfce7;
  color: #166534;
}
</style>
