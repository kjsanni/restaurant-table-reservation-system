const supportTicketDAO = require("../DAOs/supportTicket.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listSupportTicketsHandler = async (req, res) => {
  const { status, priority, limit } = req.query;
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;
  const data = await supportTicketDAO.list({
    tenantId,
    status,
    priority,
    limit: limit ? parseInt(limit, 10) : 50,
  });
  res.status(200).json({ success: true, collection: data });
};

const getSupportTicketHandler = async (req, res) => {
  const ticket = await supportTicketDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }
  res.status(200).json({ success: true, item: ticket });
};

const createSupportTicketHandler = async (req, res) => {
  const { subject, message, priority } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: "Subject and message are required" });
  }
  const ticket = await supportTicketDAO.create({
    tenantId: req.tenant?.id || null,
    userId: req.user?.id || null,
    subject,
    message,
    priority: priority || "medium",
  });

  await platformAuditDAO.log(
    req.user.id,
    "support.ticket_created",
    "support_ticket",
    ticket.id,
    req.tenant?.id || null,
    { subject, priority },
    req.ip
  );

  res.status(201).json({ success: true, item: ticket });
};

const updateSupportTicketHandler = async (req, res) => {
  const allowed = ["status", "priority", "assignedTo"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  const ticket = await supportTicketDAO.update(req.params.id, updates, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  await platformAuditDAO.log(
    req.user.id,
    "support.ticket_updated",
    "support_ticket",
    ticket.id,
    req.tenant?.id || null,
    { updates },
    req.ip
  );

  res.status(200).json({ success: true, item: ticket });
};

const deleteSupportTicketHandler = async (req, res) => {
  const ticket = await supportTicketDAO.remove(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  await platformAuditDAO.log(
    req.user.id,
    "support.ticket_deleted",
    "support_ticket",
    ticket.id,
    req.tenant?.id || null,
    {},
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listSupportTicketsHandler,
  getSupportTicketHandler,
  createSupportTicketHandler,
  updateSupportTicketHandler,
  deleteSupportTicketHandler,
};
