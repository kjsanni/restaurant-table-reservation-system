<script setup lang="ts">
import { ref, onMounted } from "vue";
import { VaButton, VaModal, VaCard, VaCardContent, VaInput } from "vuestic-ui";
import roleAPI from "@/services/roleAPI";

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
    console.error("Failed to load roles", err);
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
        <VaButton preset="primary" @click="openCreate">Create Role</VaButton>
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
                <VaButton
                  preset="secondary"
                  size="small"
                  @click="openEdit(role)"
                >
                  Edit
                </VaButton>
                <VaButton
                  v-if="!role.isSystem"
                  preset="danger"
                  size="small"
                  @click="deleteRole(role)"
                >
                  Delete
                </VaButton>
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
                v-for="(enabled, key) in role.permissions"
                :key="key"
                class="perm-tag"
                :class="{ active: enabled }"
              >
                {{ key.replace(/_/g, " ") }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="!roles.length" class="empty-state">
          No roles configured yet.
        </div>
      </div>

      <VaModal
        v-model="showDialog"
        :title="editingRole ? 'Edit Role' : 'Create Role'"
        size="small"
      >
        <VaCard>
          <VaCardContent>
            <div class="field">
              <VaInput
                v-model="form.name"
                label="Name"
                placeholder="Role name"
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
            <VaButton preset="primary" @click="saveRole">Save</VaButton>
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
