<template>
  <div class="erpnext-view">
    <div class="page-header">
      <h1>ERPNext Staff Records</h1>
      <p class="subtitle">Employee directory, attendance, and payroll</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading staff data...</p>
    </div>

    <div v-else class="erpnext-content">
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn-primary" @click="loadCurrentTab">Retry</button>
      </div>

      <div v-else-if="activeTab === 'employees'" class="tab-panel">
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

      <div v-else-if="activeTab === 'attendance'" class="tab-panel">
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

      <div v-else-if="activeTab === 'payroll'" class="tab-panel">
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import erpnextAPI from "@/services/erpnextAPI";

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

<style scoped>
.erpnext-view {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0 0 var(--space-1);
}
.subtitle {
  color: var(--color-text-muted);
  margin: 0;
}
.loading-state {
  text-align: center;
  padding: var(--space-8);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-4);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.tab-nav {
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-4);
}
.tab-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.panel-header h3 {
  margin: 0;
}
.filters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.filter-sep {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.data-table th,
.data-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--color-surface-alt);
}
.data-table tbody tr:hover {
  background: var(--color-surface-sunken);
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.error-state {
  padding: var(--space-4);
  background: #fef2f2;
  color: #991b1b;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.btn-secondary {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--font-size-sm);
}
</style>
