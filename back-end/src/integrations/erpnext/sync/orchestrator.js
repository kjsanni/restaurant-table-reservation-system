"use strict";

const { createQueue } = require("../../../queues/queue");
const { syncCustomer, syncAllCustomers } = require("./sync/customer.sync");
const { syncInvoice, syncAllInvoices } = require("./sync/invoice.sync");
const { syncPayment, syncAllPayments } = require("./sync/payment.sync");
const { syncItem, syncAllItems } = require("./sync/item.sync");
const { syncStockEntry, syncStockAdjustments } = require("./sync/stock-entry.sync");
const { syncEmployee, syncAllEmployees } = require("./sync/employee.sync");
const { syncCrmLead, syncAllCrmLeads, syncCrmCustomer, syncAllCrmCustomers } = require("./sync/crm.sync");

const erpnextQueue = createQueue("erpnext-sync");

const enqueueCustomerSync = async (tenantId, customerId = null) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("sync-customer", { tenantId, customerId });
};

const enqueueInvoiceSync = async (tenantId, reservationId = null) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("sync-invoice", { tenantId, reservationId });
};

const enqueuePaymentSync = async (tenantId, paymentId = null) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("sync-payment", { tenantId, paymentId });
};

const enqueueItemSync = async (tenantId, itemId = null) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("sync-item", { tenantId, itemId });
};

const enqueueStockEntrySync = async (tenantId) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("sync-stock-entry", { tenantId });
};

const enqueueFullSync = async (tenantId) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("full-sync", { tenantId });
};

const enqueueEmployeeSync = async (tenantId, staffId = null) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("sync-employee", { tenantId, staffId });
};

const enqueueCrmLeadSync = async (tenantId, customerId = null) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("sync-crm-lead", { tenantId, customerId });
};

const enqueueCrmCustomerSync = async (tenantId, customerId = null) => {
  if (!erpnextQueue) return { enqueued: false };
  return erpnextQueue.add("sync-crm-customer", { tenantId, customerId });
};

const startErpnextWorker = () => {
  if (!erpnextQueue) return null;

  const worker = new (require("bullmq").Worker)(
    "erpnext-sync",
    async (job) => {
      const { tenantId, customerId, reservationId, paymentId } = job.data;

      switch (job.name) {
        case "sync-customer":
          if (customerId) {
            return syncCustomer(tenantId, customerId);
          }
          return syncAllCustomers(tenantId);
        case "sync-invoice":
          if (reservationId) {
            return syncInvoice(tenantId, reservationId);
          }
          return syncAllInvoices(tenantId);
        case "sync-payment":
          if (paymentId) {
            return syncPayment(tenantId, paymentId);
          }
          return syncAllPayments(tenantId);
        case "sync-item":
          if (itemId) {
            return syncItem(tenantId, itemId);
          }
          return syncAllItems(tenantId);
        case "sync-stock-entry":
          return syncStockAdjustments(tenantId);
        case "sync-employee":
          if (staffId) {
            return syncEmployee(tenantId, staffId);
          }
          return syncAllEmployees(tenantId);
        case "sync-crm-lead":
          if (customerId) {
            return syncCrmLead(tenantId, customerId);
          }
          return syncAllCrmLeads(tenantId);
        case "sync-crm-customer":
          if (customerId) {
            return syncCrmCustomer(tenantId, customerId);
          }
          return syncAllCrmCustomers(tenantId);
        case "full-sync":
          await syncAllCustomers(tenantId);
          await syncAllInvoices(tenantId);
          await syncAllPayments(tenantId);
          await syncAllItems(tenantId);
          await syncStockAdjustments(tenantId);
          await syncAllEmployees(tenantId);
          await syncAllCrmLeads(tenantId);
          await syncAllCrmCustomers(tenantId);
          return { status: "completed", tenantId };
        default:
          throw new Error(`Unknown ERPNext sync job: ${job.name}`);
      }
    },
    { connection: require("../../utils/cache").client ? { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) } : undefined }
  );

  worker.on("completed", (job, result) => {
    console.log(`[ERPNext Sync] Job ${job.id} (${job.name}) completed for tenant ${job.data.tenantId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[ERPNext Sync] Job ${job.id} (${job.name}) failed for tenant ${job.data.tenantId}:`, err.message);
  });

  return worker;
};

module.exports = {
  enqueueCustomerSync,
  enqueueInvoiceSync,
  enqueuePaymentSync,
  enqueueItemSync,
  enqueueStockEntrySync,
  enqueueEmployeeSync,
  enqueueCrmLeadSync,
  enqueueCrmCustomerSync,
  enqueueFullSync,
  startErpnextWorker,
};