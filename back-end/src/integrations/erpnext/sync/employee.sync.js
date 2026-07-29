"use strict";

const { getClient } = require("../client");
const db = require("../../db/models");

const mapStaffToErpnextEmployee = (staff, tenant) => {
  return {
    first_name: staff.firstName || "",
    last_name: staff.lastName || "",
    employee_name: `${staff.firstName || ""} ${staff.lastName || ""}`.trim(),
    company: tenant.name,
    department: staff.department || "",
    designation: staff.role || "Staff",
    status: "Active",
    date_of_joining: staff.createdAt ? new Date(staff.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    rtrs_staff_id: staff.id,
    rtrs_tenant_id: tenant.id,
  };
};

const mapCustomerToErpnextLead = (customer, tenant) => {
  return {
    first_name: customer.firstName || "",
    last_name: customer.lastName || "",
    customer_name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
    email_id: customer.email || "",
    mobile_no: customer.phone || "",
    customer_group: "RTRS Customers",
    territory: "All Territories",
    customer_type: "Individual",
    lead_source: "RTRS",
    company: tenant.name,
    rtrs_customer_id: customer.id,
    rtrs_tenant_id: tenant.id,
  };
};

const createOrUpdateErpnextEmployee = async (staff, tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const payload = mapStaffToErpnextEmployee(staff, tenant);

  const existing = await db.erpnextSync.findOne({
    where: {
      tenantId,
      rtrsEntityType: "staff",
      rtrsEntityId: staff.id,
    },
  });

  if (existing && existing.erpnextDocname) {
    const result = await getClient().put(`/api/resource/Employee/${existing.erpnextDocname}`, payload);
    return result.data;
  }

  const result = await getClient().post("/api/resource/Employee", payload);
  const employee = result.data.data;

  await db.erpnextSync.upsert({
    tenantId,
    rtrsEntityType: "staff",
    rtrsEntityId: staff.id,
    erpnextDocType: "Employee",
    erpnextDocname: employee.name,
    erpnextDocStatus: employee.status || "Active",
  });

  return employee;
};

const syncEmployee = async (tenantId, staffId) => {
  const staff = await db.user.findByPk(staffId, {
    where: { tenantId, role: "staff" },
  });
  if (!staff) {
    throw new Error(`Staff ${staffId} not found for tenant ${tenantId}`);
  }
  return createOrUpdateErpnextEmployee(staff, tenantId);
};

const syncAllEmployees = async (tenantId) => {
  const staff = await db.user.findAll({ where: { tenantId, role: "staff" } });
  const results = [];
  for (const s of staff) {
    try {
      const result = await createOrUpdateErpnextEmployee(s, tenantId);
      results.push({ staffId: s.id, status: "success", erpnextName: result.name });
    } catch (err) {
      results.push({ staffId: s.id, status: "failed", error: err.message });
    }
  }
  return results;
};

const createOrUpdateErpnextLead = async (customer, tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const payload = mapCustomerToErpnextLead(customer, tenant);

  const existing = await db.erpnextSync.findOne({
    where: {
      tenantId,
      rtrsEntityType: "customer_crm",
      rtrsEntityId: customer.id,
    },
  });

  if (existing && existing.erpnextDocname) {
    const result = await getClient().put(`/api/resource/Lead/${existing.erpnextDocname}`, payload);
    return result.data;
  }

  const result = await getClient().post("/api/resource/Lead", payload);
  const lead = result.data.data;

  await db.erpnextSync.upsert({
    tenantId,
    rtrsEntityType: "customer_crm",
    rtrsEntityId: customer.id,
    erpnextDocType: "Lead",
    erpnextDocname: lead.name,
    erpnextDocStatus: lead.status || "Open",
  });

  return lead;
};

const syncCrmLead = async (tenantId, customerId) => {
  const customer = await db.customer.findByPk(customerId, {
    where: { tenantId },
  });
  if (!customer) {
    throw new Error(`Customer ${customerId} not found for tenant ${tenantId}`);
  }
  return createOrUpdateErpnextLead(customer, tenantId);
};

const syncAllCrmLeads = async (tenantId) => {
  const customers = await db.customer.findAll({ where: { tenantId } });
  const results = [];
  for (const c of customers) {
    try {
      const result = await createOrUpdateErpnextLead(c, tenantId);
      results.push({ customerId: c.id, status: "success", erpnextName: result.name });
    } catch (err) {
      results.push({ customerId: c.id, status: "failed", error: err.message });
    }
  }
  return results;
};

module.exports = {
  syncEmployee,
  syncAllEmployees,
  syncCrmLead,
  syncAllCrmLeads,
};