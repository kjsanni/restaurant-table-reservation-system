<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import {
  VaBadge,
  VaButton,
  VaCard,
  VaCardContent,
  VaInput,
  VaModal,
  VaSelect,
} from "vuestic-ui";
import { useAuthStore } from "@/stores/auth";
import tableAPI from "@/services/tableAPI";

const authStore = useAuthStore();
const staff = ref([]);
const loading = ref(true);
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

const roles = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Staff", value: "staff" },
] as const;
type Role = (typeof roles)[number]["value"];

const permissionKeys = [
  { key: "view_reservations", label: "View Reservations" },
  { key: "edit_reservations", label: "Edit Reservations" },
  { key: "manage_tables", label: "Manage Tables" },
  { key: "manage_schedule", label: "Manage Schedule" },
  { key: "manage_staff", label: "Manage Staff" },
];

const selectedPermissions = ref<Record<string, boolean>>({});
const featureAvailable = ref(false);

onMounted(async () => {
  await loadStaff();
});

const loadStaff = async () => {
  loading.value = true;
  try {
    const res = await tableAPI.getWaitingStaff();
    staff.value = res.data.staff;
  } catch (err) {
    console.error("Failed to load staff", err);
  } finally {
    loading.value = false;
  }
};

const addStaff = async () => {
  showAddDialog.value = false;
};

const deleteStaffMember = async () => {};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="..." />
    <div class="header">
      <h1>Staff Management</h1>
    </div>
    <div class="content-wrapper">
      <div class="action-bar">
        <VaButton
          preset="primary"
          @click="showAddDialog = true"
          :disabled="!featureAvailable"
        >
          Add Staff
        </VaButton>
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
            <VaButton
              preset="danger"
              size="small"
              @click="deleteStaffMember(member.id)"
              :disabled="!featureAvailable"
            >
              Remove
            </VaButton>
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
                  disabled
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

      <VaModal v-model="showAddDialog" title="Add Staff Member" size="small">
        <VaCard>
          <VaCardContent>
            <div class="feature-unavailable">
              <VaBadge color="info" class="mb-4">Read Only</VaBadge>
              <p>
                This panel shows the currently loaded staff assignments. Create,
                update, or remove staff using the backend for now.
              </p>
            </div>
            <div class="field">
              <label class="field-label">Username</label>
              <VaInput
                v-model="newStaff.username"
                placeholder="Username"
                disabled
              />
            </div>
            <div class="field">
              <label class="field-label">Email</label>
              <VaInput
                v-model="newStaff.email"
                type="email"
                placeholder="Email"
                disabled
              />
            </div>
            <div class="field">
              <label class="field-label">Password</label>
              <VaInput
                v-model="newStaff.password"
                type="password"
                placeholder="Password"
                disabled
              />
            </div>
            <div class="field">
              <label class="field-label">Role</label>
              <VaSelect
                v-model="newStaff.role"
                :options="roles"
                placeholder="Select role"
                disabled
              />
            </div>
          </VaCardContent>
          <template #actions>
            <VaButton preset="secondary" @click="showAddDialog = false">
              Close
            </VaButton>
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
  margin-top: 12px;
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

.staff-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.staff-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
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
  color: var(--primary-blue);
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
  color: var(--primary-black);
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.staff-email {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
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
  color: var(--secondary-gray);
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
  color: var(--primary-black);
  cursor: not-allowed;
  opacity: 0.7;
}

.perm-item input {
  accent-color: var(--primary-blue);
  width: 16px;
  height: 16px;
  cursor: not-allowed;
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

.feature-unavailable {
  margin-bottom: 16px;
}

@media screen and (min-width: 640px) {
  .staff-grid {
    grid-template-columns: repeat(2, 1fr);
  }
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
