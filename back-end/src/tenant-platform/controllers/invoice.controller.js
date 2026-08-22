const response = require("../utils/response");

const invoiceDAO = require("../DAOs/invoice.dao");

const listInvoicesHandler = async (req, res) => {
  const { status: invoiceStatus, limit, locationId, page, pageSize, offset } = req.query;
  const tenantId = req.tenant?.id;
  const data = await invoiceDAO.list({
    tenantId,
    status: invoiceStatus,
    locationId,
    limit: limit ? parseInt(limit, 10) : 100,
    page: page ? parseInt(page, 10) : 1,
    pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    offset: offset !== undefined ? parseInt(offset, 10) : undefined,
  });
  res.status(200).json({ success: true, collection: data.collection, total: data.total });
};

const getInvoiceHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  const inv = await invoiceDAO.getById(req.params.id, tenantId);
  if (!inv) {
    return response.notFound(res, "Invoice not found");
  }
  res.status(200).json({ success: true, item: inv });
};

const createInvoiceHandler = async (req, res) => {
  const { amount, currency, dueDate, lineItems, notes, locationId } = req.body;
  const tenantId = req.tenant?.id;
  if (!tenantId || !amount) {
    return response.badRequest(res, "tenantId and amount are required");
  }
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const record = await invoiceDAO.create({
    tenantId,
    locationId: locationId || null,
    invoiceNumber,
    amount,
    currency: currency || "GHS",
    dueDate: dueDate ? new Date(dueDate) : null,
    lineItems: lineItems || [],
    notes,
  });
  res.status(201).json({ success: true, item: record });
};

const updateInvoiceHandler = async (req, res) => {
  const allowed = ["status", "dueDate", "paidAt", "lineItems", "notes", "locationId"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  if (updates.status === "paid" && !updates.paidAt) {
    updates.paidAt = new Date();
  }
  const tenantId = req.tenant?.id;
  const inv = await invoiceDAO.update(req.params.id, updates, tenantId);
  if (!inv) {
    return response.notFound(res, "Invoice not found");
  }
  res.status(200).json({ success: true, item: inv });
};

const deleteInvoiceHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  const inv = await invoiceDAO.remove(req.params.id, tenantId);
  if (!inv) {
    return response.notFound(res, "Invoice not found");
  }
  res.status(200).json({ success: true, message: "Invoice deleted" });
};

module.exports = {
  listInvoicesHandler,
  getInvoiceHandler,
  createInvoiceHandler,
  updateInvoiceHandler,
  deleteInvoiceHandler,
};
