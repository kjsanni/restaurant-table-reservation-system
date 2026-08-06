"use strict";

const { getClient } = require("../client");
const db = require("../../../db/models");

const mapCustomerToErpnextCustomer = (customer, tenant) => {
  return {
    first_name: customer.firstName || "",
    last_name: customer.lastName || "",
    customer_name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
    email_id: customer.email || "",
    mobile_no: customer.phone || "",
    customer_group: "RTRS Customers",
    territory: "All Territories",
    customer_type: "Individual",
    tax_id: customer.taxId || "",
    company: tenant.name,
    rtrs_customer_id: customer.id,
    rtrs_tenant_id: tenant.id,
  };
};

const createOrUpdateErpnextCustomer = async (customer, tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const payload = mapCustomerToErpnextCustomer(customer, tenant);

  const existing = await db.erpnextSync.findOne({
    where: {
      tenantId,
      rtrsEntityType: "customer_crm",
      rtrsEntityId: customer.id,
    },
  });

  if (existing && existing.erpnextDocname) {
    const result = await getClient().put(`/api/resource/Customer/${existing.erpnextDocname}`, payload);
    return result.data;
  }

  const result = await getClient().post("/api/resource/Customer", payload);
  const erpnextCustomer = result.data.data;

  await db.erpnextSync.upsert({
    tenantId,
    rtrsEntityType: "customer_crm",
    rtrsEntityId: customer.id,
    erpnextDocType: "Customer",
    erpnextDocname: erpnextCustomer.name,
    erpnextDocStatus: erpnextCustomer.status || "Active",
  });

  return erpnextCustomer;
};

const syncCrmCustomer = async (tenantId, customerId) => {
  const customer = await db.customer.findByPk(customerId, {
    where: { tenantId },
  });
  if (!customer) {
    throw new Error(`Customer ${customerId} not found for tenant ${tenantId}`);
  }
  return createOrUpdateErpnextCustomer(customer, tenantId);
};

const syncAllCrmCustomers = async (tenantId) => {
  const customers = await db.customer.findAll({ where: { tenantId } });
  const results = [];
  for (const c of customers) {
    try {
      const result = await createOrUpdateErpnextCustomer(c, tenantId);
      results.push({ customerId: c.id, status: "success", erpnextName: result.name });
    } catch (err) {
      results.push({ customerId: c.id, status: "failed", error: err.message });
    }
  }
  return results;
};

module.exports = {
  syncCrmCustomer,
  syncAllCrmCustomers,
};