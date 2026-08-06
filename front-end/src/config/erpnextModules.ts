export interface ErpnextModule {
  flag: string;
  name: string;
  description: string;
  path: string;
}

export const ERP_NEXT_MODULES: ErpnextModule[] = [
  {
    flag: "erpnext_accounting",
    name: "Accounting",
    description: "P&L, invoices, payments",
    path: "/erpnext/accounting",
  },
  {
    flag: "erpnext_stock",
    name: "Inventory",
    description: "Items, stock, warehouses",
    path: "/erpnext/inventory",
  },
  {
    flag: "erpnext_crm",
    name: "CRM",
    description: "Customers, leads, campaigns",
    path: "/erpnext/crm",
  },
  {
    flag: "erpnext_hr",
    name: "Staff Records",
    description: "Employees, attendance, payroll",
    path: "/erpnext/employees",
  },
  {
    flag: "erpnext_pos",
    name: "POS",
    description: "Point of sale integration",
    path: "#",
  },
  {
    flag: "erpnext_manufacturing",
    name: "Manufacturing",
    description: "BOMs, production plans",
    path: "/erpnext/manufacturing",
  },
];

export const ERP_NEXT_MODULE_OPTIONS = ERP_NEXT_MODULES.map((m) => ({
  flag: m.flag,
  name: m.name,
}));
