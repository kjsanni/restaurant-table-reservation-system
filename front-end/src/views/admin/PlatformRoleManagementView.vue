<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import adminAPI from "@/services/adminAPI";

const router = useRouter();
const loading = ref(true);
const error = ref<string | null>(null);
const roles = ref<any[]>([]);
const users = ref<any[]>([]);

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
    const response = await adminAPI.getUsers();
    const allUsers = response.data?.users || response.data?.collection || [];
    users.value = allUsers.filter(
      (u: any) =>
        u.isSuperAdmin ||
        (Array.isArray(u.platformRoles) && u.platformRoles.length > 0)
    );
  } catch {
    error.value = "Failed to load users.";
  }
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
  try {
    await adminAPI.revokePlatformRole(userId, role);
    await loadUsers();
  } catch (err: any) {
    alert(err?.response?.data?.message || "Failed to revoke role.");
  }
};

onMounted(async () => {
  await Promise.all([loadRoles(), loadUsers()]);
  loading.value = false;
});
</script>

<template>
  <div class="platform-roles-page">
    <div class="page-header">
      <div>
        <button @click="$router.back()" class="back-btn">← Back</button>
        <h1>Platform Roles</h1>
        <p class="subtitle">Separate duties among platform administrators</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else-if="users.length === 0" class="empty-state">
      No platform users found.
    </div>

    <div v-else class="table-wrapper">
      <table class="roles-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>
              <div class="role-badges">
                <span v-if="user.isSuperAdmin" class="badge badge-admin"
                  >Super Admin</span
                >
                <span
                  v-for="role in user.platformRoles || []"
                  :key="role"
                  class="badge"
                >
                  {{ roles.find((r) => r.key === role)?.label || role }}
                </span>
                <span
                  v-if="
                    !user.isSuperAdmin &&
                    (!user.platformRoles || user.platformRoles.length === 0)
                  "
                  class="text-muted"
                  >None</span
                >
              </div>
            </td>
            <td class="actions">
              <select
                @change="
                  (e) =>
                    assignRole(user.id, (e.target as HTMLSelectElement).value)
                "
                class="role-select"
              >
                <option value="">Assign role...</option>
                <option v-for="role in roles" :key="role.key" :value="role.key">
                  {{ role.label }}
                </option>
              </select>
              <button
                v-for="role in user.platformRoles || []"
                :key="'revoke-' + role"
                @click="revokeRole(user.id, role)"
                class="btn-small danger"
              >
                Revoke {{ roles.find((r) => r.key === role)?.label || role }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="roles-legend">
      <h3>Available Platform Roles</h3>
      <div class="legend-grid">
        <div v-for="role in roles" :key="role.key" class="legend-card">
          <div class="legend-label">{{ role.label }}</div>
          <div class="legend-desc">{{ role.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.platform-roles-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 2rem;
}
.back-btn {
  background: transparent;
  border: none;
  color: #4a4540;
  cursor: pointer;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}
.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #1a1410;
}
.subtitle {
  color: #645d54;
  margin: 0.25rem 0 0;
}
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #645d54;
}
.error-state {
  color: #e11d48;
}
.table-wrapper {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.75rem;
  overflow: hidden;
}
.roles-table {
  width: 100%;
  border-collapse: collapse;
}
.roles-table th,
.roles-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e7e4de;
}
.roles-table th {
  background: #faf9f7;
  font-weight: 600;
  color: #4a4540;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.role-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  background: #f3f1ed;
  color: #4a4540;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
}
.badge-admin {
  background: #1a1410;
  color: #fff;
}
.text-muted {
  color: #9a9389;
  font-size: 0.9rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.role-select {
  padding: 0.4rem 0.6rem;
  border: 1px solid #d6d1c9;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  background: #fff;
}
.btn-small {
  padding: 0.35rem 0.7rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
}
.btn-small.danger {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.btn-small.danger:hover {
  background: #fee2e2;
}
.roles-legend {
  margin-top: 2rem;
}
.roles-legend h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #1a1410;
}
.legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
.legend-card {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1rem;
}
.legend-label {
  font-weight: 600;
  color: #1a1410;
  margin-bottom: 0.25rem;
}
.legend-desc {
  color: #645d54;
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
