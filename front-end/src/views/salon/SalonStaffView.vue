<template>
  <div class="salon-staff-view">
    <div class="page-header">
      <div>
        <h1>{{ t("salon.staff") }}</h1>
        <p class="subtitle">{{ t("salon.staffSubtitle") }}</p>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="staff.length === 0" class="empty-state">
        {{ t("salon.noStaffFound") }}
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t("salon.name") }}</th>
              <th>{{ t("salon.email") }}</th>
              <th>{{ t("salon.services") }}</th>
              <th>{{ t("salon.locations") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in staff" :key="person.id">
              <td>{{ person.username }}</td>
              <td>{{ person.email }}</td>
              <td>
                <span
                  v-for="skill in person.skills"
                  :key="skill.serviceId"
                  class="badge"
                >
                  {{ t("salon.serviceFallback", "Service") }} #{{
                    skill.serviceId
                  }}
                </span>
              </td>
              <td>
                <span
                  v-for="loc in (person.locations || [])"
                  :key="loc.id"
                  class="badge badge-location"
                >
                  {{ loc.name }}
                </span>
              </td>
              <td>
                <button class="btn-sm" @click="openAssignModal(person)">
                  {{ t("salon.assignLocation", "Assign") }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="modal">
        <h2>{{ t("salon.assignStaffToLocation", "Assign Staff to Location") }}</h2>
        <p class="modal-subtitle">{{ selectedStaff?.username }}</p>
        <div class="form-group">
          <label>{{ t("salon.location", "Location") }}</label>
          <select v-model="assignmentForm.locationId" class="field-input">
            <option value="">{{ t("salon.selectLocation", "Select location") }}</option>
            <option
              v-for="loc in locations"
              :key="loc.id"
              :value="loc.id"
            >
              {{ loc.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="assignmentForm.isPrimary" />
            {{ t("salon.primaryLocation", "Primary location") }}
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAssignModal = false">
            {{ t("salon.cancelBtn", "Cancel") }}
          </button>
          <button class="btn-primary" @click="submitAssignment" :disabled="submittingAssignment">
            {{ t("salon.assign", "Assign") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import salonAPI from "@/services/salonAPI";
import locationAPI from "@/services/locationAPI";
import staffLocationAssignmentAPI from "@/services/staffLocationAssignmentAPI";
import { useI18n } from "@/composables/useI18n";
import { useToastStore } from "@/stores/toast";

const { t } = useI18n();
const toastStore = useToastStore();

const loading = ref(false);
const staff = ref([]);
const locations = ref([]);
const showAssignModal = ref(false);
const selectedStaff = ref(null);
const submittingAssignment = ref(false);
const assignmentForm = ref({ locationId: null, isPrimary: false });

const load = async () => {
  loading.value = true;
  try {
    const [staffRes, locationsRes] = await Promise.all([
      salonAPI.getStaff(),
      locationAPI.list(),
    ]);
    staff.value = staffRes.data?.data || [];
    locations.value = locationsRes.data?.data || [];
  } finally {
    loading.value = false;
  }
};

const openAssignModal = (person) => {
  selectedStaff.value = person;
  assignmentForm.value = { locationId: null, isPrimary: false };
  showAssignModal.value = true;
};

const submitAssignment = async () => {
  if (!selectedStaff.value || !assignmentForm.value.locationId) return;
  submittingAssignment.value = true;
  try {
    await staffLocationAssignmentAPI.create({
      userId: selectedStaff.value.id,
      locationId: assignmentForm.value.locationId,
      isPrimary: assignmentForm.value.isPrimary,
    });
    showAssignModal.value = false;
    selectedStaff.value = null;
    await load();
    toastStore.add(t("salon.assignmentCreated", "Location assigned"), "success");
  } catch (err) {
    toastStore.add(t("salon.assignmentFailed", "Failed to assign location"), "error");
  } finally {
    submittingAssignment.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.salon-staff-view {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--surface-sunken);
  color: var(--ink);
  margin-right: var(--space-1);
}
.badge-location {
  background: #fef3c7;
  color: #92400e;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
</style>
