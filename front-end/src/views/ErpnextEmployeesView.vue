<template>
  <ErpnextBaseView
    title="ERPNext Staff Records"
    subtitle="Employee directory, attendance, and payroll"
    :tabs="tabs"
    v-model:activeTab="activeTab"
    :loading="loading"
    :error="error"
    loading-text="Loading staff data..."
    @retry="loadCurrentTab"
  >
    <template #tab-content="{ activeTab }">
      <div v-if="activeTab === 'employees'" class="tab-panel">
        <div class="panel-header">
          <h3>Employees</h3>
          <div class="filters">
            <input
              v-model="empSearch"
              type="search"
              placeholder="Search employees..."
              class="form-input"
            />
            <button class="btn-secondary" @click="loadEmployees">Search</button>
          </div>
        </div>
        <div v-if="employees.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in employees" :key="emp.name">
                <td>{{ emp.employee_name }}</td>
                <td>{{ emp.company_email || emp.personal_email }}</td>
                <td>{{ emp.department }}</td>
                <td>{{ emp.designation }}</td>
                <td>{{ emp.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No employees found.</div>
      </div>

      <div v-if="activeTab === 'attendance'" class="tab-panel">
        <div class="panel-header">
          <h3>Attendance</h3>
          <div class="filters">
            <input v-model="attFrom" type="date" class="form-input" />
            <span class="filter-sep">to</span>
            <input v-model="attTo" type="date" class="form-input" />
            <button class="btn-secondary" @click="loadAttendance">Apply</button>
          </div>
        </div>
        <div v-if="attendance.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in attendance" :key="row.name">
                <td>{{ row.employee_name }}</td>
                <td>{{ row.attendance_date }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.working_hours }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No attendance records found.</div>
      </div>

      <div v-if="activeTab === 'payroll'" class="tab-panel">
        <div class="panel-header">
          <h3>Payroll</h3>
          <div class="filters">
            <input v-model="payFrom" type="date" class="form-input" />
            <span class="filter-sep">to</span>
            <input v-model="payTo" type="date" class="form-input" />
            <button class="btn-secondary" @click="loadPayroll">Apply</button>
          </div>
        </div>
        <div v-if="payroll.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Gross Pay</th>
                <th>Net Pay</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in payroll" :key="row.name">
                <td>{{ row.employee_name }}</td>
                <td>{{ row.start_date }} → {{ row.end_date }}</td>
                <td>{{ row.gross_pay }}</td>
                <td>{{ row.net_pay }}</td>
                <td>{{ row.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No payroll records found.</div>
      </div>
    </template>
  </ErpnextBaseView>
</template>

<script setup>
import { ref, onMounted } from "vue";
import erpnextAPI from "@/services/erpnextAPI";
import ErpnextBaseView from "@/components/erpnext/ErpnextBaseView.vue";
import "@/components/erpnext/erpnext-view-shared.css";

const loading = ref(true);
const error = ref(null);
const activeTab = ref("employees");

const empSearch = ref("");
const employees = ref([]);

const attFrom = ref("");
const attTo = ref("");
const attendance = ref([]);

const payFrom = ref("");
const payTo = ref("");
const payroll = ref([]);

const tabs = [
  { key: "employees", label: "Employees" },
  { key: "attendance", label: "Attendance" },
  { key: "payroll", label: "Payroll" },
];

const loadEmployees = async () => {
  try {
    const params = {};
    if (empSearch.value) params.search = empSearch.value;
    const res = await erpnextAPI.getHrEmployees(params);
    employees.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load employees";
  }
};

const loadAttendance = async () => {
  try {
    const params = {};
    if (attFrom.value) params.from = attFrom.value;
    if (attTo.value) params.to = attTo.value;
    const res = await erpnextAPI.getHrAttendance(params);
    attendance.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load attendance";
  }
};

const loadPayroll = async () => {
  try {
    const params = {};
    if (payFrom.value) params.from = payFrom.value;
    if (payTo.value) params.to = payTo.value;
    const res = await erpnextAPI.getHrPayroll(params);
    payroll.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load payroll";
  }
};

const loadCurrentTab = async () => {
  error.value = null;
  if (activeTab.value === "employees") await loadEmployees();
  else if (activeTab.value === "attendance") await loadAttendance();
  else if (activeTab.value === "payroll") await loadPayroll();
};

onMounted(async () => {
  loading.value = true;
  error.value = null;
  await Promise.all([loadEmployees(), loadAttendance(), loadPayroll()]);
  loading.value = false;
});
</script>
