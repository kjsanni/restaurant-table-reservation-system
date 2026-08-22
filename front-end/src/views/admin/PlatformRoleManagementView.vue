<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import adminAPI from "@/services/adminAPI";
import Pagination from "@/components/AdminPagination.vue";

interface PlatformRole {
  key: string;
  label: string;
  description: string;
}

interface PlatformUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  platformRoles: string[];
}

const loading = ref(true);
const error = ref<string | null>(null);
const roles = ref<PlatformRole[]>([]);
const users = ref<PlatformUser[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize.value))
);

const showCreateModal = ref(false);
const createForm = ref({
  username: "",
  email: "",
  password: "",
  role: "admin",
  isSuperAdmin: false,
  platformRoles: [] as string[],
});
const createSubmitting = ref(false);
const createError = ref<string | null>(null);

const roleSelectOptions = computed(() =>
  roles.value.map((r) => ({ label: r.label, value: r.key }))
);

const loadRoles = async () => {
  try {
    const response = await adminAPI.listPlatformRoles();
    roles.value = response.data?.roles || [];
  } catch {
    error.value = "Failed to load platform roles.";
  }
};

const loadUsers = async () => {
  try {
    const response = await adminAPI.listPlatformUsers({
      page: page.value,
      pageSize: pageSize.value,
    });
    users.value = response.data?.users || [];
    total.value = response.data?.total || 0;
  } catch {
    error.value = "Failed to load users.";
  }
};

watch(page, () => {
  loadUsers();
});

const onPageChange = (p: number) => {
  page.value = p;
};

const assignRole = async (userId: number, role: string) => {
  try {
    await adminAPI.assignPlatformRole(userId, role);
    await loadUsers();
  } catch (err: any) {
    alert(err?.response?.data?.message || "Failed to assign role.");
  }
};

const revokeRole = async (userId: number, role: string) => {
  if (!confirm("Are you sure?")) return;
  try {
    await adminAPI.revokePlatformRole(userId, role);
    await loadUsers();
  } catch (err: any) {
    alert(err?.response?.data?.message || "Failed to revoke role.");
  }
};

const handleCreate = async () => {
  if (createSubmitting.value) return;
  createError.value = null;
  createSubmitting.value = true;
  try {
    await adminAPI.createPlatformUser({
      username: createForm.value.username,
      email: createForm.value.email,
      password: createForm.value.password,
      role: createForm.value.role,
      isSuperAdmin: createForm.value.isSuperAdmin,
      platformRoles: createForm.value.platformRoles,
    });
    await loadUsers();
    closeCreateModal();
  } catch (err: any) {
    createError.value =
      err?.response?.data?.message || "Failed to create user.";
  } finally {
    createSubmitting.value = false;
  }
};

function closeCreateModal() {
  showCreateModal.value = false;
  createForm.value = {
    username: "",
    email: "",
    password: "",
    role: "admin",
    isSuperAdmin: false,
    platformRoles: [],
  };
}

const roleLabel = (roleKey: string): string => {
  const r = roles.value.find((r) => r.key === roleKey);
  return r ? r.label : roleKey;
};

onMounted(async () => {
  await Promise.all([loadRoles(), loadUsers()]);
  loading.value = false;
});
</script>

<template>
  <div class="pr-page">
    <div class="pr-header">
      <div class="pr-header-title">
        <button
          @click="$router.back()"
          class="pr-back-btn"
          aria-label="Go back"
        >
          <Icon icon="mdi:chevron-left" width="20" height="20" />
        </button>
        <div>
          <h1 class="pr-title">Platform Roles</h1>
          <p class="pr-subtitle">
            Separate duties among platform administrators
          </p>
        </div>
      </div>
      <button @click="showCreateModal = true" class="pr-create-btn">
        <Icon icon="mdi:account-plus" width="18" height="18" />
        Create Platform User
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="pr-error-banner">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="pr-loading">
      <div class="pr-spinner"></div>
      <p>Loading platform roles…</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0" class="pr-empty">
      <Icon icon="mdi:account-group" width="48" height="48" />
      <h3>No platform users found.</h3>
      <p>Create a platform user to get started.</p>
      <button @click="showCreateModal = true" class="pr-create-btn">
        <Icon icon="mdi:account-plus" width="18" height="18" />
        Create Platform User
      </button>
    </div>

    <!-- Users Table -->
    <div v-else class="pr-table-card">
      <div class="pr-table">
        <div class="pr-table-row pr-table-header-row">
          <div class="pr-th">User</div>
          <div class="pr-th">Email</div>
          <div class="pr-th">Roles</div>
          <div class="pr-th">Actions</div>
        </div>
        <div v-for="user in users" :key="user.id" class="pr-table-row">
          <div class="pr-td">
            <div class="pr-user-info">
              <div class="pr-user-avatar">
                {{ user.username?.charAt(0)?.toUpperCase() }}
              </div>
              <span>{{ user.username }}</span>
            </div>
          </div>
          <div class="pr-td">{{ user.email }}</div>
          <div class="pr-td">
            <div class="pr-role-badges">
              <span v-if="user.isSuperAdmin" class="pr-badge pr-badge-primary">
                Super Admin
              </span>
              <span
                v-for="role in user.platformRoles || []"
                :key="role"
                class="pr-badge"
              >
                {{ roleLabel(role) }}
              </span>
              <span
                v-if="
                  !user.isSuperAdmin &&
                  (!user.platformRoles || user.platformRoles.length === 0)
                "
                class="pr-text-muted"
              >
                None
              </span>
            </div>
          </div>
          <div class="pr-td pr-actions">
            <select
              @change="
                (e) => {
                  const target = e.target as HTMLSelectElement;
                  const val = target.value;
                  if (val) assignRole(user.id, val);
                  target.value = '';
                }
              "
              class="pr-select"
            >
              <option value="" disabled>Assign role…</option>
              <option
                v-for="role in roleSelectOptions"
                :key="role.value"
                :value="role.value"
              >
                {{ role.label }}
              </option>
            </select>
            <button
              v-for="role in user.platformRoles || []"
              :key="'revoke-' + role"
              @click="revokeRole(user.id, role)"
              class="pr-btn-small pr-btn-ghost"
            >
              Revoke {{ roleLabel(role) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <Pagination
      v-if="users.length > 0"
      :current-page="page"
      :total-pages="totalPages"
      @update:page="onPageChange"
    />

    <!-- Roles Legend -->
    <div class="pr-legend">
      <h3 class="pr-legend-title">Available Platform Roles</h3>
      <div class="pr-legend-grid">
        <div v-for="role in roles" :key="role.key" class="pr-legend-card">
          <div class="pr-legend-label">{{ role.label }}</div>
          <div class="pr-legend-desc">
            {{ role.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <div
      v-if="showCreateModal"
      class="pr-modal-overlay"
      @click.self="closeCreateModal"
    >
      <div
        class="pr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="pr-modal-header">
          <h2 id="modal-title" class="pr-modal-title">Create Platform User</h2>
          <button
            @click="closeCreateModal"
            class="pr-modal-close"
            aria-label="Close"
          >
            <Icon icon="mdi:close" width="20" height="20" />
          </button>
        </div>

        <div v-if="createError" class="pr-alert pr-alert-danger">
          {{ createError }}
        </div>

        <form @submit.prevent="handleCreate">
          <div class="pr-field">
            <label for="c-username" class="pr-label">Username</label>
            <input
              id="c-username"
              v-model="createForm.username"
              type="text"
              placeholder="admin-user"
              autocomplete="username"
              class="pr-input"
              required
            />
          </div>

          <div class="pr-field">
            <label for="c-email" class="pr-label">Email</label>
            <input
              id="c-email"
              v-model="createForm.email"
              type="email"
              placeholder="you@company.com"
              autocomplete="email"
              class="pr-input"
              required
            />
          </div>

          <div class="pr-field">
            <label for="c-password" class="pr-label">Password</label>
            <input
              id="c-password"
              v-model="createForm.password"
              type="password"
              placeholder="Minimum 12 characters, mixed case, number, special char"
              autocomplete="new-password"
              class="pr-input"
              required
            />
          </div>

          <div class="pr-field">
            <label for="c-role" class="pr-label">Role</label>
            <select id="c-role" v-model="createForm.role" class="pr-select">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div class="pr-field">
            <label class="pr-checkbox-label">
              <input type="checkbox" v-model="createForm.isSuperAdmin" />
              Grant super-admin access (bypasses all role checks)
            </label>
          </div>

          <div class="pr-field">
            <span class="pr-label">Platform Roles</span>
            <div class="pr-role-checkboxes">
              <label
                v-for="role in roles"
                :key="role.key"
                class="pr-checkbox-label"
              >
                <input
                  type="checkbox"
                  :value="role.key"
                  v-model="createForm.platformRoles"
                />
                {{ role.label }} — {{ role.description }}
              </label>
            </div>
          </div>

          <div class="pr-modal-actions">
            <button
              type="button"
              @click="closeCreateModal"
              class="pr-btn pr-btn-secondary"
              :disabled="createSubmitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="pr-btn pr-btn-primary"
              :disabled="createSubmitting"
            >
              {{ createSubmitting ? "Creating…" : "Create User" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pr-page {
  padding: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}

.pr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.pr-header-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pr-back-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: var(--ink-secondary);
  transition: all var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.pr-back-btn:hover {
  background: var(--neutral-100);
  color: var(--ink);
  border-color: var(--border);
}

.pr-title {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
  margin: 0;
}

.pr-subtitle {
  color: var(--ink-secondary);
  margin: var(--space-1) 0 0;
}

.pr-create-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--brand-700);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.pr-create-btn:hover {
  background: var(--brand-800);
  transform: translateY(-1px);
}

.pr-error-banner {
  background: var(--rose-50);
  color: var(--rose-600);
  border: 1px solid var(--rose-200);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.pr-loading {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--ink-secondary);
}

.pr-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-700);
  border-radius: 50%;
  animation: pr-spin 0.8s linear infinite;
  margin: 0 auto var(--space-4);
}

@keyframes pr-spin {
  to {
    transform: rotate(360deg);
  }
}

.pr-empty {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--ink-secondary);
}

.pr-empty svg {
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.pr-empty h3 {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--ink);
  margin: 0 0 var(--space-2);
}

.pr-empty p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.pr-table-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.pr-table {
  width: 100%;
}

.pr-table-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
}

.pr-table-row:last-child {
  border-bottom: none;
}

.pr-table-header-row {
  background: var(--neutral-50);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-secondary);
}

.pr-th {
  padding: var(--space-3) var(--space-4);
  flex: 1;
}

.pr-th:first-child {
  min-width: 160px;
}

.pr-th:nth-child(2) {
  min-width: 200px;
}

.pr-th:nth-child(3) {
  min-width: 200px;
}

.pr-td {
  padding: var(--space-3) var(--space-4);
  color: var(--ink);
  font-size: var(--text-sm);
}

.pr-user-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.pr-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  color: var(--brand-900);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.pr-role-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
}

.pr-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--neutral-700);
  background: var(--neutral-100);
  border: 1px solid var(--border-subtle);
}

.pr-badge-primary {
  background: var(--brand-100);
  color: var(--brand-800);
  border-color: var(--brand-200);
}

.pr-text-muted {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

.pr-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.pr-select {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  min-width: 140px;
}

.pr-btn-small {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.pr-btn-ghost {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--rose-600);
}

.pr-btn-ghost:hover {
  background: var(--rose-50);
  border-color: var(--rose-300);
}

.pr-legend {
  margin-top: var(--space-8);
}

.pr-legend-title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-4);
}

.pr-legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}

.pr-legend-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-xs);
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.pr-legend-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.pr-legend-label {
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
}

.pr-legend-desc {
  color: var(--ink-secondary);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.pr-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.pr-modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 0;
  min-width: 0;
  max-width: 560px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--border-subtle);
}

.pr-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.pr-modal-title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}

.pr-modal-close {
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: var(--ink-secondary);
  transition: all var(--duration-fast) var(--ease-out);
}

.pr-modal-close:hover {
  background: var(--neutral-100);
  color: var(--ink);
  border-color: var(--border);
}

.pr-alert {
  padding: var(--space-3) var(--space-6);
  border-top: none;
  border-left: 3px solid;
  border-radius: 0;
  margin: 0;
  font-size: var(--text-sm);
}

.pr-alert-danger {
  background: var(--rose-50);
  color: var(--rose-600);
  border-left-color: var(--rose-500);
}

.pr-field {
  padding: 0 var(--space-6) var(--space-4);
}

.pr-field:last-child {
  padding-bottom: var(--space-4);
}

.pr-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--space-2);
}

.pr-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.pr-input:focus {
  outline: none;
  border-color: var(--brand-700);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-700) 15%, transparent);
}

.pr-input::placeholder {
  color: var(--ink-subtle);
}

.pr-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  transition: border-color var(--duration-fast) var(--ease-out);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-2) center;
  background-size: 14px;
  padding-right: calc(var(--space-3) + 14px);
}

.pr-select:focus {
  outline: none;
  border-color: var(--brand-700);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-700) 15%, transparent);
}

.pr-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  padding: var(--space-2) 0;
  margin: 0;
}

.pr-checkbox-label input[type="checkbox"] {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: var(--brand-700);
}

.pr-role-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pr-modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-2);
  padding: var(--space-4) var(--space-6) var(--space-6);
  border-top: 1px solid var(--border-subtle);
}

.pr-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.pr-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pr-btn-primary {
  background: var(--brand-700);
  color: var(--white);
}

.pr-btn-primary:hover:not(:disabled) {
  background: var(--brand-800);
  transform: translateY(-1px);
}

.pr-btn-secondary {
  background: var(--neutral-100);
  color: var(--ink);
  border: 1px solid var(--border-subtle);
}

.pr-btn-secondary:hover:not(:disabled) {
  background: var(--neutral-200);
}

@media (max-width: 768px) {
  .pr-page {
    padding: var(--space-4);
  }

  .pr-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .pr-modal {
    max-width: 100%;
    border-radius: var(--radius-lg);
  }
}
</style>
