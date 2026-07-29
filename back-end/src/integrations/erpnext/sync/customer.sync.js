"use strict";

const { getClient } = require("../client");
const { mapCustomerToErpnext } = require("../mappers/customer.mapper");
const db = require("../../../db/models");

const createOrUpdateErpnextCustomer = async (customer, tenantId) => {
  const payload = mapCustomerToErpnext(customer);

  const existing = await db.erpnextSync.findOne({
    where: {
      tenantId,
      rtrsEntityType: "customer",
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
    rtrsEntityType: "customer",
    rtrsEntityId: customer.id,
    erpnextDocType: "Customer",
    erpnextDocname: erpnextCustomer.name,
    erpnextDocStatus: erpnextCustomer.status || "Draft",
  });

  return erpnextCustomer;
};

const syncCustomer = async (tenantId, customerId) => {
  const customer = await db.customer.findByPk(customerId, {
    where: { tenantId },
  });
  if (!customer) {
    throw new Error(`Customer ${customerId} not found for tenant ${tenantId}`);
  }
  return createOrUpdateErpnextCustomer(customer, tenantId);
};

const syncAllCustomers = async (tenantId) => {
  const customers = await db.customer.findAll({ where: { tenantId } });
  const results = [];
  for (const customer of customers) {
    try {
      const result = await createOrUpdateErpnextCustomer(customer, tenantId);
      results.push({ customerId: customer.id, status: "success", erpnextName: result.name });
    } catch (err) {
      results.push({ customerId: customer.id, status: "failed", error: err.message });
    }
  }
  return results;
};

module.exports = {
  syncCustomer,
  syncAllCustomers,
};