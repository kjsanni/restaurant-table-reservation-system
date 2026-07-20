const invoiceDAO = require("../DAOs/invoice.dao");

const listInvoicesHandler = async (req, res) => {
  const { tenantId, status, limit } = req.query;
  const data = await invoiceDAO.list({ tenantId: tenantId ? parseInt(tenantId, 10) : null, status, limit: limit ? parseInt(limit, 10) : 100 });
  res.status(200).json({ success: true, collection: data });
};

const getInvoiceHandler = async (req, res) => {
  const inv = await invoiceDAO.getById(req.params.id);
  if (!inv) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }
  res.status(200).json({ success: true, item: inv });
};

const createInvoiceHandler = async (req, res) => {
  const { tenantId, amount, currency, dueDate, lineItems, notes } = req.body;
  if (!tenantId || !amount) {
    return res.status(400).json({ success: false, message: "tenantId and amount are required" });
  }
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const record = await invoiceDAO.create({
    tenantId,
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
  const allowed = ["status", "dueDate", "paidAt", "lineItems", "notes"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  if (updates.status === "paid" && !updates.paidAt) {
    updates.paidAt = new Date();
  }
  const inv = await invoiceDAO.update(req.params.id, updates);
  if (!inv) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }
  res.status(200).json({ success: true, item: inv });
};

const deleteInvoiceHandler = async (req, res) => {
  const inv = await invoiceDAO.remove(req.params.id);
  if (!inv) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
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
