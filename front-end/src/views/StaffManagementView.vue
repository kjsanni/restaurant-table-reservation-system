<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import authAPI from "@/services/authAPI";
import logger from "@/utils/logger";

interface StaffUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

const router = useRouter();
const staff = ref<StaffUser[]>([]);
const loading = ref(true);

const loadStaff = async () => {
  loading.value = true;
  try {
    const res = await authAPI.getStaff();
    staff.value = res.data.users || [];
  } catch (err) {
    logger.error("Failed to load staff", { error: err });
  } finally {
    loading.value = false;
  }
};

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const roleClass = (role: string) => {
  const r = (role || "").toLowerCase();
  if (r === "manager") return "manager";
  if (r === "server") return "server";
  if (r === "host") return "host";
  return "server";
};

onMounted(loadStaff);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Staff</h1>
        <p>Team members and roles</p>
      </div>
      <div class="topbar-right">
        <button class="btn-primary" @click="router.push('/staff/add')">
          + Add Staff
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading staff...</p>
      </div>

      <div v-else class="staff-grid">
        <div v-for="member in staff" :key="member.id" class="staff-card">
          <div class="staff-avatar">{{ getInitials(member.username) }}</div>
          <div class="staff-info">
            <b>{{ member.username }}</b>
            <span>{{ member.email }}</span>
            <span class="role-pill" :class="roleClass(member.role)">
              {{ member.role }}
            </span>
          </div>
        </div>
        <div v-if="!staff.length" class="empty-state">
          No staff members found.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}

.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.staff-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 22px;
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.staff-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 36px rgba(26, 20, 16, 0.08);
}

.staff-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand-500), var(--brand-400));
  color: var(--white);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.staff-info {
  flex: 1;
  min-width: 0;
}

.staff-info b {
  display: block;
  font-size: 14px;
  color: var(--neutral-900);
  font-weight: 600;
}

.staff-info span {
  display: block;
  font-size: 12px;
  color: var(--neutral-600);
  margin-top: 2px;
}

.role-pill {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 4px;
}

.role-pill.manager {
  background: var(--accent-100);
  color: var(--accent-600);
}

.role-pill.server {
  background: var(--sky-100);
  color: var(--sky-600);
}

.role-pill.host {
  background: var(--earth-100);
  color: var(--earth-600);
}

.role-pill.admin {
  background: var(--rose-100);
  color: var(--rose-600);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-6);
  gap: var(--space-4);
}

.spinner {
  width: 36px;
  height: 36px;
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

.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--space-10);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.btn-primary {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}
</style>
