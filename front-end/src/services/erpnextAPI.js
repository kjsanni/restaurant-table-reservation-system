import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/v1/erpnext",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || "ERPNext request failed";
      console.error("[ERPNext API]", message);
    }
    return Promise.reject(error);
  }
);

const erpnextAPI = {
  getHealth: () => apiClient.get("/health"),

  getCompany: () => apiClient.get("/accounting/company"),

  getProfitLoss: (params = {}) =>
    apiClient.get("/accounting/profit-loss", { params }),

  getBalanceSheet: (params = {}) =>
    apiClient.get("/accounting/balance-sheet", { params }),

  getInvoices: (params = {}) =>
    apiClient.get("/accounting/invoices", { params }),

  getInvoice: (invoiceId) => apiClient.get(`/accounting/invoices/${invoiceId}`),

  getPayments: (params = {}) =>
    apiClient.get("/accounting/payments", { params }),

  getCustomers: (params = {}) =>
    apiClient.get("/accounting/customers", { params }),

  syncCustomers: (customerIds = null) =>
    apiClient.post("/accounting/sync/customers", { customerIds }),

  syncInvoices: (params = {}) =>
    apiClient.post("/accounting/sync/invoices", params),

  syncAppointmentInvoices: (appointmentIds = null) =>
    apiClient.post("/accounting/sync/invoices", { appointmentIds }),

  syncPayments: (paymentIds = null) =>
    apiClient.post("/accounting/sync/payments", { paymentIds }),

  getInventoryItems: (params = {}) =>
    apiClient.get("/inventory/items", { params }),

  getStockLedger: (params = {}) =>
    apiClient.get("/inventory/stock", { params }),

  getStockValuation: (params = {}) =>
    apiClient.get("/inventory/stock/valuation", { params }),

  getLowStockAlerts: (params = {}) =>
    apiClient.get("/inventory/stock/low-stock", { params }),

  getWarehouses: () => apiClient.get("/inventory/warehouses"),

  syncInventoryItems: (itemIds = null) =>
    apiClient.post("/inventory/sync/items", { itemIds }),

  syncStockEntries: () => apiClient.post("/inventory/sync/stock-entries"),

  getHrEmployees: (params = {}) => apiClient.get("/hr/employees", { params }),

  getHrAttendance: (params = {}) =>
    apiClient.get("/hr/employees/attendance", { params }),

  getHrPayroll: (params = {}) =>
    apiClient.get("/hr/employees/payroll", { params }),

  syncEmployees: (staffIds = null) =>
    apiClient.post("/hr/sync/employees", { staffIds }),

  getCrmLeads: (params = {}) => apiClient.get("/crm/leads", { params }),

  getCrmCustomers: (params = {}) => apiClient.get("/crm/customers", { params }),

  getCrmCampaigns: (params = {}) => apiClient.get("/crm/campaigns", { params }),

  getCrmOpportunities: (params = {}) =>
    apiClient.get("/crm/opportunities", { params }),

  syncCrmLeads: (customerIds = null) =>
    apiClient.post("/crm/sync/leads", { customerIds }),

  syncCrmCustomers: (customerIds = null) =>
    apiClient.post("/crm/sync/customers", { customerIds }),

  getManufacturingBoms: (params = {}) =>
    apiClient.get("/manufacturing/boms", { params }),

  getManufacturingPlans: (params = {}) =>
    apiClient.get("/manufacturing/production-plans", { params }),

  getOnboardingStatus: () => apiClient.get("/onboarding/status"),

  createCompany: (data) => apiClient.post("/onboarding/company", data),

  createWarehouse: (data) => apiClient.post("/onboarding/warehouse", data),

  importEmployees: (data) =>
    apiClient.post("/onboarding/employee-import", data),

  getTaxTemplates: () => apiClient.get("/accounting/tax-templates"),

  getGhanaTaxSummary: (params = {}) =>
    apiClient.get("/accounting/ghana-tax-summary", { params }),

  getGhanaPL: (params = {}) => apiClient.get("/reports/ghana/pl", { params }),

  getGhanaBalanceSheet: (params = {}) =>
    apiClient.get("/reports/ghana/balance-sheet", { params }),

  getGhanaTaxCompliance: (params = {}) =>
    apiClient.get("/reports/ghana/tax-compliance", { params }),

  getPosProxy: (path, method = "GET", params = {}) =>
    apiClient.request({
      method,
      url: `/pos/proxy?path=${encodeURIComponent(path)}`,
      ...(method === "GET" ? { params } : { data: params }),
    }),

  syncPos: (syncType, payload = {}) =>
    apiClient.post("/pos/sync", { syncType, payload }),

  getPosSyncStatus: () => apiClient.get("/pos/sync/status"),
};

export default erpnextAPI;
