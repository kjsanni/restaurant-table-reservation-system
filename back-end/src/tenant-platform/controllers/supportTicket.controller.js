const supportTicketDAO = require("../DAOs/supportTicket.dao");
const supportTicketMessageDAO = require("../DAOs/supportTicketMessage.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const supportNotificationService = require("../services/supportNotification.service");

const listSupportTicketsHandler = async (req, res) => {
  const { status, priority, category, limit } = req.query;
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;
  const data = await supportTicketDAO.list({
    tenantId,
    status,
    priority,
    category,
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
  const { subject, message, priority, category } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: "Subject and message are required" });
  }
  try {
    const ticket = await supportTicketDAO.create({
      tenantId: req.tenant?.id || null,
      userId: req.user?.id || null,
      subject,
      message,
      priority: priority || "medium",
      category: category || "general",
      status: "open",
    });

    await supportTicketMessageDAO.create({
      ticketId: ticket.id,
      senderId: req.user?.id || null,
      senderType: req.user?.isSuperAdmin ? "agent" : "customer",
      body: message,
    });

    await platformAuditDAO.log(
      req.user.id,
      "support.ticket_created",
      "support_ticket",
      ticket.id,
      req.tenant?.id || null,
      { subject, priority, category },
      req.ip
    );

    if (ticket.userId && ticket.userId !== req.user.id) {
      const customerEmail = await supportNotificationService.resolveUserEmail(ticket.userId);
      await supportNotificationService.notifyTicketCreated({
        ticket,
        tenantId: req.tenant?.id,
        recipientUserId: ticket.userId,
        recipientEmail: customerEmail,
      });
    }

    res.status(201).json({ success: true, item: ticket });
  } catch (err) {
    console.error("SUPPORT TICKET CREATE ERROR:", err);
    throw err;
  }
};

const updateSupportTicketHandler = async (req, res) => {
  const allowed = ["status", "priority", "assignedTo"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  const existingTicket = await supportTicketDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  const ticket = await supportTicketDAO.update(req.params.id, updates, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  if (updates.assignedTo && updates.assignedTo !== existingTicket.assignedTo) {
    const assigneeEmail = await supportNotificationService.resolveUserEmail(updates.assignedTo);
    const customerEmail = await supportNotificationService.resolveUserEmail(ticket.userId);
    await supportNotificationService.notifyTicketAssigned({
      ticket,
      tenantId: req.tenant?.id,
      assigneeUserId: updates.assignedTo,
      assigneeEmail,
      customerEmail,
    });
  }

  if (updates.status === "resolved" && existingTicket.status !== "resolved") {
    const customerEmail = await supportNotificationService.resolveUserEmail(ticket.userId);
    await supportNotificationService.notifyTicketResolved({ ticket, tenantId: req.tenant?.id, customerEmail });
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

const listTicketMessagesHandler = async (req, res) => {
  const ticket = await supportTicketDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  const messages = await supportTicketMessageDAO.list({ ticketId: ticket.id });
  res.status(200).json({ success: true, collection: messages });
};

const sendTicketMessageHandler = async (req, res) => {
  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ success: false, message: "Message body is required" });
  }

  const ticket = await supportTicketDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  const message = await supportTicketMessageDAO.create({
    ticketId: ticket.id,
    senderId: req.user?.id || null,
    senderType: req.user?.isSuperAdmin ? "agent" : "customer",
    body,
  });

  if (ticket.status === "open") {
    await supportTicketDAO.update(ticket.id, { status: "in_progress" }, req.user?.isSuperAdmin ? null : req.tenant?.id);
  }

  if (!ticket.firstResponseAt && req.user?.isSuperAdmin) {
    await supportTicketDAO.update(ticket.id, { firstResponseAt: new Date() }, req.user?.isSuperAdmin ? null : req.tenant?.id);
  }

  const replySenderType = req.user?.isSuperAdmin ? "agent" : "customer";
  const customerEmail = await supportNotificationService.resolveUserEmail(ticket.userId);
  const agentEmail = replySenderType === "agent" ? req.user.email : await supportNotificationService.resolveUserEmail(ticket.assignedTo);
  await supportNotificationService.notifyTicketReply({
    ticket,
    tenantId: req.tenant?.id,
    replySenderType,
    customerEmail,
    agentEmail,
  });

  await platformAuditDAO.log(
    req.user.id,
    "support.message_sent",
    "support_ticket_message",
    message.id,
    req.tenant?.id || null,
    { ticketId: ticket.id },
    req.ip
  );

  res.status(201).json({ success: true, item: message });
};

const isWithinBusinessHours = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  const gmtOffset = 0;
  const localHour = (hour + gmtOffset + 24) % 24;
  return day >= 1 && day <= 5 && localHour >= 8 && localHour < 18;
};

let roundRobinIndex = 0;

const autoAssignTicketHandler = async (req, res) => {
  const ticket = await supportTicketDAO.findById(req.params.id, req.user?.isSuperAdmin ? null : req.tenant?.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  const agents = await db.user.findAll({
    where: { role: { [db.Sequelize.Op.in]: ["admin", "staff"] } },
    limit: 20,
    order: [["createdAt", "ASC"]],
  });

  if (!agents.length) {
    return res.status(404).json({ success: false, message: "No available agents for auto-assignment" });
  }

  const agentLoads = await Promise.all(
    agents.map(async (agent) => {
      const openTickets = await supportTicketDAO.list({
        assignedTo: agent.id,
        status: { [db.Sequelize.Op.not]: "resolved" },
      });
      const categoryMatches = ticket.category
        ? await supportTicketDAO.list({
            assignedTo: agent.id,
            category: ticket.category,
            status: { [db.Sequelize.Op.not]: "resolved" },
          })
        : [];
      return {
        agent,
        openCount: openTickets.length,
        categoryMatchCount: categoryMatches.length,
      };
    })
  );

  const withinBusinessHours = isWithinBusinessHours();
  const maxOpenTickets = withinBusinessHours ? 5 : 8;
  const available = agentLoads.filter((item) => item.openCount < maxOpenTickets);
  const candidates = available.length > 0 ? available : agentLoads;

  candidates.sort((a, b) => {
    if (ticket.category) {
      if (a.categoryMatchCount !== b.categoryMatchCount) {
        return a.categoryMatchCount - b.categoryMatchCount;
      }
    }
    if (a.openCount !== b.openCount) {
      return a.openCount - b.openCount;
    }
    const aIndex = agents.findIndex((agent) => agent.id === a.agent.id);
    const bIndex = agents.findIndex((agent) => agent.id === b.agent.id);
    const aDistance = (aIndex - roundRobinIndex + agents.length) % agents.length;
    const bDistance = (bIndex - roundRobinIndex + agents.length) % agents.length;
    return aDistance - bDistance;
  });

  const assignee = candidates[0].agent;
  roundRobinIndex = (agents.findIndex((agent) => agent.id === assignee.id) + 1) % agents.length;

  const updated = await supportTicketDAO.update(ticket.id, { assignedTo: assignee.id }, req.user?.isSuperAdmin ? null : req.tenant?.id);

  await platformAuditDAO.log(
    req.user.id,
    "support.ticket_auto_assigned",
    "support_ticket",
    ticket.id,
    req.tenant?.id || null,
    { assignedTo: assignee.id, category: ticket.category, withinBusinessHours },
    req.ip
  );

  res.status(200).json({ success: true, item: updated, withinBusinessHours });
};

module.exports = {
  listSupportTicketsHandler,
  getSupportTicketHandler,
  createSupportTicketHandler,
  updateSupportTicketHandler,
  deleteSupportTicketHandler,
  listTicketMessagesHandler,
  sendTicketMessageHandler,
  autoAssignTicketHandler,
};
