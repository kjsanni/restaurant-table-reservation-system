<template>
  <div class="salon-staff-view">
    <div class="page-header">
      <div>
        <h1>{{ t("salon.staff") }}</h1>
        <p class="subtitle">{{ t("salon.staffSubtitle") }}</p>
      </div>
      <button class="btn-primary" @click="openCreateForm">
        {{ t("salon.addStaff", "Add Staff") }}
      </button>
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
                  v-for="loc in person.locations || []"
                  :key="loc.id"
                  class="badge badge-location"
                >
                  {{ loc.name }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-sm" @click="openEditForm(person)">
                  {{ t("common.edit", "Edit") }}
                </button>
                <button class="btn-danger-sm" @click="confirmDelete(person)">
                  {{ t("common.delete", "Delete") }}
                </button>
                <button class="btn-sm" @click="openAssignModal(person)">
                  {{ t("salon.assignLocation", "Assign") }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showFormModal"
      class="modal-overlay"
      @click.self="showFormModal = false"
    >
      <div class="modal">
        <h2>
          {{
            editingStaff
              ? t("salon.editStaff", "Edit Staff")
              : t("salon.addStaff", "Add Staff")
          }}
        </h2>
        <div class="form-group">
          <label>{{ t("salon.username", "Username") }}</label>
          <input v-model="form.username" class="field-input" />
        </div>
        <div class="form-group">
          <label>{{ t("salon.email", "Email") }}</label>
          <input v-model="form.email" class="field-input" type="email" />
        </div>
        <div class="form-group">
          <label>{{ t("salon.fullName", "Full Name") }}</label>
          <input v-model="form.name" class="field-input" />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showFormModal = false">
            {{ t("salon.cancelBtn", "Cancel") }}
          </button>
          <button
            class="btn-primary"
            @click="submitStaffForm"
            :disabled="submittingForm"
          >
            {{
              submittingForm
                ? t("salon.saving", "Saving...")
                : t("common.save", "Save")
            }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal">
        <h2>{{ t("salon.confirmDeleteStaff", "Delete Staff") }}</h2>
        <p>
          {{
            t(
              "salon.confirmDeleteStaffMsg",
              "Are you sure you want to delete this staff member?"
            )
          }}
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteConfirm = false">
            {{ t("salon.cancelBtn", "Cancel") }}
          </button>
          <button
            class="btn-danger"
            @click="submitDelete"
            :disabled="submittingDelete"
          >
            {{ t("common.delete", "Delete") }}
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
        <h2>
          {{ t("salon.assignStaffToLocation", "Assign Staff to Location") }}
        </h2>
        <p class="modal-subtitle">{{ selectedStaff?.username }}</p>
        <div class="form-group">
          <label>{{ t("salon.location", "Location") }}</label>
          <select v-model="assignmentForm.locationId" class="field-input">
            <option value="">
              {{ t("salon.selectLocation", "Select location") }}
            </option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
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
          <button
            class="btn-primary"
            @click="submitAssignment"
            :disabled="submittingAssignment"
          >
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
const showFormModal = ref(false);
const showDeleteConfirm = ref(false);
const showAssignModal = ref(false);
const editingStaff = ref(null);
const selectedStaff = ref(null);
const submittingForm = ref(false);
const submittingDelete = ref(false);
const submittingAssignment = ref(false);
const form = ref({ username: "", email: "", name: "" });
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
  } catch (err) {
    toastStore.add(
      t("salon.failedToLoadStaff", "Failed to load staff"),
      "error"
    );
  } finally {
    loading.value = false;
  }
};

const openCreateForm = () => {
  editingStaff.value = null;
  form.value = { username: "", email: "", name: "" };
  showFormModal.value = true;
};

const openEditForm = (person) => {
  editingStaff.value = person;
  form.value = {
    username: person.username || "",
    email: person.email || "",
    name: person.name || person.username || "",
  };
  showFormModal.value = true;
};

const submitStaffForm = async () => {
  if (!form.value.username.trim() || !form.value.email.trim()) return;
  submittingForm.value = true;
  try {
    if (editingStaff.value) {
      await salonAPI.updateStaff(editingStaff.value.id, form.value);
      toastStore.add(t("salon.staffUpdated", "Staff updated"), "success");
    } else {
      await salonAPI.createStaff(form.value);
      toastStore.add(t("salon.staffCreated", "Staff created"), "success");
    }
    showFormModal.value = false;
    await load();
  } catch (err) {
    toastStore.add(t("salon.staffSaveFailed", "Failed to save staff"), "error");
  } finally {
    submittingForm.value = false;
  }
};

const confirmDelete = (person) => {
  selectedStaff.value = person;
  showDeleteConfirm.value = true;
};

const submitDelete = async () => {
  if (!selectedStaff.value) return;
  submittingDelete.value = true;
  try {
    await salonAPI.deleteStaff(selectedStaff.value.id);
    showDeleteConfirm.value = false;
    selectedStaff.value = null;
    await load();
    toastStore.add(t("salon.staffDeleted", "Staff deleted"), "success");
  } catch (err) {
    toastStore.add(
      t("salon.staffDeleteFailed", "Failed to delete staff"),
      "error"
    );
  } finally {
    submittingDelete.value = false;
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
    toastStore.add(
      t("salon.assignmentCreated", "Location assigned"),
      "success"
    );
  } catch (err) {
    toastStore.add(
      t("salon.assignmentFailed", "Failed to assign location"),
      "error"
    );
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal h2 {
  font-family: var(--font-serif);
  font-size: 20px;
  margin: 0 0 16px;
}
.modal-subtitle {
  color: var(--neutral-600);
  margin: 0 0 16px;
  font-size: 14px;
}
.form-group {
  margin-bottom: 12px;
}
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.field-input {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  width: 100%;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
.btn-primary {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--brand-600);
  color: var(--white);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: #fecaca;
  color: #7f1d1d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: none;
  background: #fecaca;
  color: #7f1d1d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>
