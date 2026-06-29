<script setup>
import TextBox from "@/components/TextBox.vue";
import ButtonFilled from "@/components/ButtonFilled.vue";
import SuccessMessage from "@/components/SuccessMessage.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import SaveIcon from "~icons/fluent/save-16-regular";

import getValues from "@/utils/getValues";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";
import tableAPI from "@/services/tableAPI";

import { ref, onMounted } from "vue";

const table = ref({
  name: {
    textBoxType: "text",
    id: "name",
    labelText: "Table Name",
    placeholderText: "Enter table name...",
    value: "",
  },
  capacity: {
    textBoxType: "number",
    id: "capacity",
    labelText: "Capacity",
    placeholderText: "Enter capacity...",
    value: "",
  },
});

const validationErrors = ref(null);
const emptyFieldsError = ref(null);
const isSuccessful = ref(false);

const staffList = ref([]);
const loadingStaff = ref(false);
const selectedStaffIds = ref([]);

const loadWaitingStaff = async () => {
  loadingStaff.value = true;
  try {
    const res = await tableAPI.getWaitingStaff();
    staffList.value = res.data.staff;
  } catch (err) {
    logger.error("Failed to load staff", { error: err.message });
  } finally {
    loadingStaff.value = false;
  }
};

const toggleStaff = (userId) => {
  const idx = selectedStaffIds.value.indexOf(userId);
  if (idx > -1) {
    selectedStaffIds.value.splice(idx, 1);
  } else {
    selectedStaffIds.value.push(userId);
  }
};

onMounted(() => {
  loadWaitingStaff();
});

const registerTable = async () => {
  validationErrors.value = null;
  emptyFieldsError.value = null;
  isSuccessful.value = false;
  try {
    const payload = getValues(table.value);
    payload.staffIds = selectedStaffIds.value;
    await tableAPI.registerTable(payload);
    isSuccessful.value = true;
    selectedStaffIds.value = [];
  } catch (err) {
    emptyFieldsError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Add Table</h1>
    </div>
    <div class="form-wrapper">
      <form @submit.prevent="registerTable">
        <TextBox
          v-for="textBox in table"
          :key="textBox.id"
          :text-box-type="textBox.textBoxType"
          :id="textBox.id"
          :label-text="textBox.labelText"
          :placeholder-text="textBox.placeholderText"
          :errors="validationErrors"
          v-model:input="textBox.value"
        />
        <ErrorMessage
          :error-flag="emptyFieldsError"
          :error-message="emptyFieldsError"
        />
        <SuccessMessage
          :is-successful="isSuccessful"
          success-message="Successfully registered the new table!"
        />
        <div class="staff-section">
          <h3 class="staff-title">Assign Waiting Staff</h3>
          <p class="staff-hint">
            Each waiter can handle up to 5 tables. Staff already at capacity are
            disabled.
          </p>
          <div v-if="loadingStaff" class="staff-loading">Loading staff...</div>
          <div v-else-if="staffList.length === 0" class="staff-empty">
            No waiting staff available.
          </div>
          <div v-else class="staff-grid">
            <label
              v-for="staff in staffList"
              :key="staff.id"
              :class="['staff-chip', { disabled: staff.tableCount >= 5 }]"
            >
              <input
                type="checkbox"
                :value="staff.id"
                :disabled="staff.tableCount >= 5"
                v-model="selectedStaffIds"
              />
              <span class="staff-name">{{ staff.username }}</span>
              <span
                :class="[
                  'staff-count',
                  { full: staff.tableCount >= 5 },
                ]"
              >
                {{ staff.tableCount }}/5 tables
              </span>
            </label>
          </div>
        </div>
        <ButtonFilled class="button" text="Submit">
          <template #icon><SaveIcon /></template>
        </ButtonFilled>
      </form>
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
  background: var(--lighter-gray) url("@/assets/images/add-table-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0% 40%;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}
.form-wrapper {
  display: flex;
  justify-content: center;
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  align-items: center;
  background-color: var(--primary-white);
  padding: var(--card-padding);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}
form {
  width: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.general-error {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  margin-bottom: 15px;
  color: var(--accent-red);
  font-family: "Inter-Light";
}

.button {
  width: 200px;
}

.staff-section {
  width: 100%;
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.staff-title {
  font-family: "Inter-Bold";
  font-size: 14px;
  color: var(--primary-black);
  margin: 0 0 6px 0;
}

.staff-hint {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
  margin: 0 0 12px 0;
}

.staff-loading,
.staff-empty {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
  padding: 6px 0;
}

.staff-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.staff-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
  user-select: none;
}

.staff-chip:hover:not(.disabled) {
  border-color: var(--primary-blue);
  background: #eef2ff;
}

.staff-chip.disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.staff-chip input[type="checkbox"] {
  accent-color: var(--primary-blue);
}

.staff-chip input[type="checkbox"]:disabled {
  accent-color: #9ca3af;
}

.staff-name {
  font-weight: 500;
}

.staff-count {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--secondary-gray);
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
}

.staff-count.full {
  color: #dc2626;
  background: #fef2f2;
  font-weight: 600;
}

@media screen and (min-width: 1024px) {
  .form-wrapper {
    margin: 50px var(--x-spacing-desktop) var(--x-spacing-desktop) 50px;
  }
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
}
</style>
