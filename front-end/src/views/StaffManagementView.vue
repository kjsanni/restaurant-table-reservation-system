<script setup>
import { ref, onMounted } from "vue";
import authAPI from "@/services/authAPI";
import roleAPI from "@/services/roleAPI";
import logger from "@/utils/logger";
import PageHeader from "@/components/PageHeader.vue";

const staff = ref([]);
const loading = ref(true);
const roles = ref([]);
const rolesLoading = ref(true);
const showAddDialog = ref(false);
const newStaff = ref({
  username: "",
  email: "",
  password: "",
  role: "staff",
  permissions: {
    view_reservations: true,
    edit_reservations: true,
    manage_tables: true,
    manage_schedule: false,
    manage_staff: false,
  },
});

const permissionKeys = [
  { key: "view_reservations", label: "View Reservations" },
  { key: "edit_reservations", label: "Edit Reservations" },
  { key: "manage_tables", label: "Manage Tables" },
  { key: "manage_schedule", label: "Manage Schedule" },
  { key: "manage_staff", label: "Manage Staff" },
];

onMounted(async () => {
  await loadStaff();
  await loadRoles();
});

const loadStaff = async () => {
  loading.value = true;
  try {
    const res = await authAPI.getStaff();
    staff.value = res.data.users;
  } catch (err) {
    logger.error("Failed to load staff", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const loadRoles = async () => {
  rolesLoading.value = true;
  try {
    const res = await roleAPI.getAllRoles();
    const roleList = res.data.roles || [];
    roles.value = roleList
      .map((r) => (typeof r === "string" ? r : r.name))
      .filter(Boolean);
  } catch (err) {
    logger.error("Failed to load roles", { error: err.message });
  } finally {
    rolesLoading.value = false;
  }
};

const formError = ref("");
const saving = ref(false);

const addStaff = async () => {
  try {
    await authAPI.createStaff(newStaff.value);
    showAddDialog.value = false;
    newStaff.value = {
      username: "",
      email: "",
      password: "",
      role: "staff",
      permissions: {
        view_reservations: true,
        edit_reservations: true,
        manage_tables: true,
        manage_schedule: false,
        manage_staff: false,
      },
    };
    await loadStaff();
  } catch (err) {
    logger.error("Failed to add staff", { error: err.message });
  }
};

const updatePermission = async (staffMember, permission, value) => {
  const updatedPerms = { ...staffMember.permissions, [permission]: value };
  await authAPI.updateStaff(staffMember.id, { permissions: updatedPerms });
};

const deleteStaffMember = async (id) => {
  await authAPI.deleteStaff(id);
  await loadStaff();
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Staff" subtitle="Manage team members and roles" />
    <div class="content-wrapper">
      <div class="action-bar">
        <button class="btn btn-primary" @click="showAddDialog = true">
          Add Staff
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading staff...</p>
      </div>
      <div v-else class="staff-grid">
        <div v-for="member in staff" :key="member.id" class="staff-card">
          <div class="staff-header">
            <div class="staff-avatar">
              {{ member.username.charAt(0).toUpperCase() }}
            </div>
            <div class="staff-info">
              <h3 class="staff-name">
                {{ member.username }}
                <span class="role-badge">{{ member.role }}</span>
              </h3>
              <p class="staff-email">{{ member.email }}</p>
            </div>
            <button
              class="btn btn-danger btn-sm"
              @click="deleteStaffMember(member.id)"
            >
              Remove
            </button>
          </div>

          <div class="permissions-section">
            <span class="meta-label">Permissions</span>
            <div class="perm-grid">
              <label
                v-for="perm in permissionKeys"
                :key="perm.key"
                class="perm-item"
              >
                <input
                  type="checkbox"
                  :checked="member.permissions?.[perm.key]"
                  @change="
                    updatePermission(member, perm.key, $event.target.checked)
                  "
                />
                <span>{{ perm.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="!staff.length" class="empty-state">
          No staff members found.
        </div>
      </div>

      <div v-if="showAddDialog" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">Add Staff Member</h3>
          <div class="field">
            <label>Username</label>
            <input
              v-model="newStaff.username"
              placeholder="Username"
              class="modal-input"
            />
          </div>
          <div class="field">
            <label>Email</label>
            <input
              v-model="newStaff.email"
              type="email"
              placeholder="Email"
              class="modal-input"
            />
          </div>
          <div class="field">
            <label>Password</label>
            <input
              v-model="newStaff.password"
              type="password"
              placeholder="Password"
              class="modal-input"
            />
            <p class="field-hint">
              Minimum 12 characters, with uppercase, lowercase, number and
              special character.
            </p>
          </div>
          <div class="field">
            <label>Role</label>
            <select v-model="newStaff.role" class="modal-select">
              <option v-for="role in roles" :key="role.name" :value="role.name">
                {{ role.name }}
              </option>
            </select>
          </div>
          <div v-if="formError" class="form-error">{{ formError }}</div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showAddDialog = false">
              Cancel
            </button>
            <button
              class="btn btn-primary"
              :disabled="saving"
              @click="addStaff"
            >
              {{ saving ? "Adding..." : "Add" }}
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
  padding: 80px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--sky-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.staff-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.staff-card {
  background: var(--surface);
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.staff-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.staff-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
  color: var(--sky-600);
  font-family: "Inter-Bold";
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.staff-info {
  flex: 1;
  min-width: 0;
}

.staff-name {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--ink);
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.staff-email {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--ink-muted);
  margin: 0;
}

.role-badge {
  font-size: 11px;
  background-color: #f3f4f6;
  color: #6b7280;
  padding: 3px 10px;
  border-radius: 6px;
  text-transform: capitalize;
}

.permissions-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-label {
  font-family: "Inter-Medium";
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ink-muted);
}

.perm-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.perm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-family: "Inter-Light";
  color: var(--ink);
  cursor: pointer;
}

.perm-item input {
  accent-color: var(--sky-600);
  width: 16px;
  height: 16px;
  cursor: pointer;
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
  white-space: nowrap;
}

.btn-primary {
  background-color: var(--sky-600);
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-danger:hover {
  background-color: #fee2e2;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: var(--ink);
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--ink-muted);
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
  max-width: 420px;
}

.modal-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--ink);
  margin: 0 0 20px 0;
}

.field {
  margin-bottom: 16px;
}

.field-hint {
  margin: 6px 0 0 0;
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--ink-muted);
  line-height: 1.4;
}

.form-error {
  margin: 0 0 16px 0;
  padding: 10px 12px;
  border-radius: 8px;
  background-color: #fef2f2;
  color: #dc2626;
  font-family: "Inter-Medium";
  font-size: 13px;
  line-height: 1.4;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--ink);
}

.modal-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--ink);
  box-sizing: border-box;
}

.modal-input:focus {
  outline: none;
  border-color: var(--sky-600);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.modal-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--ink);
  background-color: white;
  box-sizing: border-box;
  cursor: pointer;
}

.modal-select:focus {
  outline: none;
  border-color: var(--sky-600);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

@media screen and (min-width: 640px) {
  .staff-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
