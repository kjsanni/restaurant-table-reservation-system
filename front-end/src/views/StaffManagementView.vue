<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import authAPI from "@/services/authAPI";
import locationAPI from "@/services/location.sharedAPI";
import staffLocationAssignmentAPI from "@/services/staffLocationAssignment.sharedAPI";
import logger from "@/utils/logger";

interface StaffUser {
  id: number;
  username: string;
  email: string;
  role: string;
  phone?: string;
  locations?: Array<{ id: number; name: string }>;
}

const router = useRouter();
const staff = ref<StaffUser[]>([]);
const locations = ref<Array<{ id: number; name: string }>>([]);
const loading = ref(true);
const loadingLocations = ref(false);
const showAddModal = ref(false);
const submittingStaff = ref(false);
const staffForm = ref({ username: "", email: "", password: "", phone: "" });
const staffError = ref("");

const showAssignModal = ref(false);
const selectedStaff = ref<StaffUser | null>(null);
const assignmentForm = ref({
  locationId: null as number | null,
  isPrimary: false,
});
const submittingAssignment = ref(false);
const assignmentError = ref("");

const openAddStaff = () => {
  staffForm.value = { username: "", email: "", password: "", phone: "" };
  staffError.value = "";
  showAddModal.value = true;
};

const submitAddStaff = async () => {
  if (
    !staffForm.value.username.trim() ||
    !staffForm.value.email.trim() ||
    !staffForm.value.password.trim()
  )
    return;
  submittingStaff.value = true;
  staffError.value = "";
  try {
    await authAPI.createStaff({
      username: staffForm.value.username.trim(),
      email: staffForm.value.email.trim(),
      password: staffForm.value.password,
      phone: staffForm.value.phone.trim() || undefined,
    });
    showAddModal.value = false;
    await loadStaff();
  } catch (err) {
    staffError.value = err?.response?.data?.message || "Failed to add staff";
  } finally {
    submittingStaff.value = false;
  }
};

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

const loadLocations = async () => {
  loadingLocations.value = true;
  try {
    const res = await locationAPI.list();
    locations.value = res.data?.data || [];
  } catch (err) {
    logger.error("Failed to load locations", { error: err });
  } finally {
    loadingLocations.value = false;
  }
};

const openAssignModal = (member: StaffUser) => {
  selectedStaff.value = member;
  assignmentForm.value = { locationId: null, isPrimary: false };
  assignmentError.value = "";
  showAssignModal.value = true;
};

const submitAssignment = async () => {
  if (!selectedStaff.value || !assignmentForm.value.locationId) return;
  submittingAssignment.value = true;
  assignmentError.value = "";
  try {
    await staffLocationAssignmentAPI.create({
      userId: selectedStaff.value.id,
      locationId: assignmentForm.value.locationId,
      isPrimary: assignmentForm.value.isPrimary,
    });
    showAssignModal.value = false;
    selectedStaff.value = null;
    await loadStaff();
  } catch (err) {
    assignmentError.value =
      err?.response?.data?.message || "Failed to assign location";
  } finally {
    submittingAssignment.value = false;
  }
};

const resetStaffPassword = async (member: StaffUser) => {
  if (!confirm(`Send password reset email to ${member.username}?`)) return;
  try {
    await authAPI.adminResetStaffPassword(member.id);
    alert("Password reset email sent successfully.");
  } catch (err) {
    alert(err?.response?.data?.message || "Failed to send reset email");
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

onMounted(async () => {
  await Promise.all([loadStaff(), loadLocations()]);
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Staff</h1>
        <p>Team members and roles</p>
      </div>
      <div class="topbar-right">
        <router-link
          to="/staff/profile"
          class="btn-secondary"
          style="text-decoration: none; margin-right: 8px"
        >
          My Profile
        </router-link>
        <button class="btn-primary" @click="openAddStaff">+ Add Staff</button>
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
            <div v-if="member.locations?.length" class="location-pills">
              <span
                v-for="loc in member.locations"
                :key="loc.id"
                class="location-pill"
              >
                {{ loc.name }}
              </span>
            </div>
          </div>
          <button
            class="assign-btn"
            @click="openAssignModal(member)"
            :title="'Assign location'"
          >
            Assign Location
          </button>
          <button
            class="reset-btn"
            @click="resetStaffPassword(member)"
            :title="'Send password reset email'"
          >
            Reset Password
          </button>
        </div>
        <div v-if="!staff.length" class="empty-state">
          No staff members found.
        </div>
      </div>
    </div>

    <div
      v-if="showAddModal"
      class="modal-overlay"
      @click.self="showAddModal = false"
    >
      <div class="modal">
        <h2>Add Staff</h2>
        <div class="form-group">
          <label>Username</label>
          <input v-model="staffForm.username" class="field-input" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="staffForm.email" class="field-input" type="email" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input
            v-model="staffForm.password"
            class="field-input"
            type="password"
          />
        </div>
        <div class="form-group">
          <label>Phone (optional)</label>
          <input
            v-model="staffForm.phone"
            class="field-input"
            type="tel"
            placeholder="+233..."
          />
        </div>
        <div v-if="staffError" class="alert alert-danger">{{ staffError }}</div>
        <div class="modal-actions">
          <button
            class="btn-secondary"
            @click="showAddModal = false"
            :disabled="submittingStaff"
          >
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="submitAddStaff"
            :disabled="submittingStaff"
          >
            {{ submittingStaff ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showAssignModal"
      class="modal-overlay"
      @click.self="showAssignModal = false"
    >
      <div class="modal">
        <h2>Assign Location</h2>
        <p class="modal-subtitle">{{ selectedStaff?.username }}</p>
        <div class="form-group">
          <label>Location</label>
          <select v-model="assignmentForm.locationId" class="field-input">
            <option value="">Select location</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="assignmentForm.isPrimary" />
            Primary location
          </label>
        </div>
        <div v-if="assignmentError" class="alert alert-danger">
          {{ assignmentError }}
        </div>
        <div class="modal-actions">
          <button
            class="btn-secondary"
            @click="showAssignModal = false"
            :disabled="submittingAssignment"
          >
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="submitAssignment"
            :disabled="submittingAssignment || !assignmentForm.locationId"
          >
            {{ submittingAssignment ? "Assigning..." : "Assign" }}
          </button>
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
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
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
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
}

.modal h2 {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 18px;
  color: var(--neutral-900);
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-800);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--neutral-900);
  background: rgba(255, 255, 255, 0.8);
}

.field-input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.btn-secondary {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--neutral-300);
  background: var(--white);
  color: var(--neutral-800);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--neutral-100);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert-danger {
  padding: 10px;
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: 13px;
  margin-bottom: 10px;
  background: var(--rose-100);
  color: var(--rose-600);
  border: 1px solid rgba(225, 29, 72, 0.15);
}

.location-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.location-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--sky-100);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
}

.assign-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--neutral-300);
  background: var(--white);
  color: var(--neutral-800);
  margin-top: 8px;
  width: 100%;
}

.assign-btn:hover:not(:disabled) {
  background: var(--neutral-100);
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--neutral-300);
  background: var(--white);
  color: var(--neutral-800);
  margin-top: 6px;
  width: 100%;
}

.reset-btn:hover:not(:disabled) {
  background: var(--neutral-100);
}

.modal-subtitle {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--neutral-600);
  margin-top: -10px;
  margin-bottom: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--neutral-900);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--brand-500);
}
</style>
