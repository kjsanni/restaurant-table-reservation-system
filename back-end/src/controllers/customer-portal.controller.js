const reservationDAO = require("../DAOs/reservation.dao");
const supportTicketDAO = require("../tenant-platform/DAOs/supportTicket.dao");
const supportTicketMessageDAO = require("../tenant-platform/DAOs/supportTicketMessage.dao");
const supportAttachmentDAO = require("../tenant-platform/DAOs/supportAttachment.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const supportNotificationService = require("../tenant-platform/services/supportNotification.service");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/support-attachments");

const buildCustomerDetails = (user) => {
  const email = user?.email;
  const phone = user?.phone || "";
  const nameParts = (user?.username || email || "Customer")
    .split(" ")
    .filter(Boolean);
  const firstName = nameParts.shift() || (email ? email.split("@")[0] : "Customer");
  const lastName = nameParts.join(" ") || "-";
  return { email, phone, firstName, lastName };
};

const resolveCustomer = async (req) => {
  return await reservationDAO.findOrCreateCustomer(
    buildCustomerDetails(req.user),
    null,
    req.tenant?.id
  );
};

const getCustomerProfileHandler = async (req, res) => {
  try {
    const customer = await resolveCustomer(req);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer profile linked to this account",
      });
    }
    return res.status(200).json({ success: true, customer });
  } catch (err) {
    console.error("getCustomerProfileHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};

const updateCustomerProfileHandler = async (req, res) => {
  try {
    const customer = await resolveCustomer(req);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer profile linked to this account",
      });
    }
    const updated = await reservationDAO.updateCustomer(customer.id, req.body, req.tenant?.id);
    return res.status(200).json({ success: true, customer: updated });
  } catch (err) {
    console.error("updateCustomerProfileHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

const getCustomerReservationsHandler = async (req, res) => {
  try {
    const customer = await resolveCustomer(req);
    if (!customer) {
      return res.status(200).json({ success: true, reservations: [] });
    }
    const reservations = await reservationDAO.findAllReservationsRaw(
      { customerId: customer.id },
      req.tenant?.id
    );
    return res.status(200).json({ success: true, reservations });
  } catch (err) {
    console.error("getCustomerReservationsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load reservations" });
  }
};

const cancelReservationHandler = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await reservationDAO.findReservationById(reservationId, req.tenant?.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }
    if (reservation.resStatus === "cancelled" || reservation.resStatus === "completed") {
      return res.status(400).json({ success: false, message: "Reservation cannot be cancelled" });
    }

    const customer = await resolveCustomer(req);
    if (!customer || reservation.customerId !== customer.id) {
      return res.status(403).json({ success: false, message: "Not authorized for this reservation" });
    }

    const updated = await reservationDAO.updateReservation(reservationId, { resStatus: "cancelled" }, req.tenant?.id);
    return res.status(200).json({ success: true, reservation: updated });
  } catch (err) {
    console.error("cancelReservationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to cancel reservation" });
  }
};

const listCustomerTicketsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, message: "Tenant context and customer identity required" });
    }
    const { status, category, limit } = req.query;
    const data = await supportTicketDAO.list({
      tenantId,
      userId,
      status,
      category,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    res.status(200).json({ success: true, collection: data });
  } catch (err) {
    console.error("listCustomerTicketsHandler error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load tickets" });
  }
};

const getCustomerTicketHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const ticket = await supportTicketDAO.findById(req.params.id, tenantId);
    if (!ticket || ticket.userId !== userId) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.status(200).json({ success: true, item: ticket });
  } catch (err) {
    console.error("getCustomerTicketHandler error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load ticket" });
  }
};

const createCustomerTicketHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, message: "Tenant context and customer identity required" });
    }
    const { subject, message, priority, category } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }
    const ticket = await supportTicketDAO.create({
      tenantId,
      userId,
      subject,
      message,
      priority: priority || "medium",
      category: category || "general",
      status: "open",
      source: "customer_portal",
    });
    await supportTicketMessageDAO.create({
      ticketId: ticket.id,
      senderId: userId,
      senderType: "customer",
      body: message,
    });
    await platformAuditDAO.log(
      userId,
      "support.customer_ticket_created",
      "support_ticket",
      ticket.id,
      tenantId,
      { subject, priority, category },
      req.ip
    );

    const customerEmail = await supportNotificationService.resolveUserEmail(userId);
    await supportNotificationService.notifyTicketCreated({
      ticket,
      tenantId,
      recipientUserId: userId,
      recipientEmail: customerEmail,
    });

    res.status(201).json({ success: true, item: ticket });
  } catch (err) {
    console.error("createCustomerTicketHandler error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create ticket" });
  }
};

const listCustomerMessagesHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const ticket = await supportTicketDAO.findById(req.params.id, tenantId);
    if (!ticket || ticket.userId !== userId) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    const messages = await supportTicketMessageDAO.list({ ticketId: ticket.id });
    res.status(200).json({ success: true, collection: messages });
  } catch (err) {
    console.error("listCustomerMessagesHandler error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load messages" });
  }
};

const sendCustomerMessageHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const ticket = await supportTicketDAO.findById(req.params.id, tenantId);
    if (!ticket || ticket.userId !== userId) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ success: false, message: "Message body is required" });
    }
    if (ticket.status === "closed") {
      return res.status(400).json({ success: false, message: "Cannot reply to a closed ticket" });
    }
    const message = await supportTicketMessageDAO.create({
      ticketId: ticket.id,
      senderId: userId,
      senderType: "customer",
      body,
    });
    await supportTicketDAO.update(ticket.id, { status: "in_progress" }, tenantId);

    const agentEmail = await supportNotificationService.resolveUserEmail(ticket.assignedTo);
    await supportNotificationService.notifyTicketReply({
      ticket,
      tenantId,
      replySenderType: "customer",
      customerEmail: req.user.email,
      agentEmail,
    });

    await platformAuditDAO.log(
      userId,
      "support.customer_message_sent",
      "support_ticket_message",
      message.id,
      tenantId,
      { ticketId: ticket.id },
      req.ip
    );
    res.status(201).json({ success: true, item: message });
  } catch (err) {
    console.error("sendCustomerMessageHandler error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

const listCustomerAttachmentsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const ticket = await supportTicketDAO.findById(req.params.id, tenantId);
    if (!ticket || ticket.userId !== userId) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    const attachments = await supportAttachmentDAO.list({ ticketId: ticket.id, tenantId });
    res.status(200).json({ success: true, collection: attachments });
  } catch (err) {
    console.error("listCustomerAttachmentsHandler error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load attachments" });
  }
};

const createCustomerAttachmentHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const ticket = await supportTicketDAO.findById(req.params.id, tenantId);
    if (!ticket || ticket.userId !== userId) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }
    const attachment = await supportAttachmentDAO.create({
      tenantId,
      ticketId: ticket.id,
      userId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/api/v1/customer-portal/support-tickets/${ticket.id}/attachments/download/${file.filename}`,
    });
    await platformAuditDAO.log(
      userId,
      "support.customer_attachment_uploaded",
      "support_attachment",
      attachment.id,
      tenantId,
      { ticketId: ticket.id, filename: file.filename },
      req.ip
    );
    res.status(201).json({ success: true, item: attachment });
  } catch (err) {
    console.error("createCustomerAttachmentHandler error:", err.message);
    res.status(500).json({ success: false, message: "Failed to upload attachment" });
  }
};

const downloadCustomerAttachmentHandler = async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const filename = req.params.filename;
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;

  const ticket = await supportTicketDAO.findById(ticketId, tenantId);
  if (!ticket || ticket.userId !== userId) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  const attachment = await supportAttachmentDAO.list({
    tenantId,
    ticketId,
    filename,
    limit: 1,
  });

  const file = attachment[0];
  if (!file) {
    return res.status(404).json({ success: false, message: "Attachment not found" });
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(filename));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found on disk" });
  }

  res.download(filePath, file.originalName, (err) => {
    if (err) {
      console.error("Customer attachment download error:", err.message);
    }
  });
};

module.exports = {
  getCustomerProfileHandler,
  updateCustomerProfileHandler,
  getCustomerReservationsHandler,
  cancelReservationHandler,
  listCustomerTicketsHandler,
  getCustomerTicketHandler,
  createCustomerTicketHandler,
  listCustomerMessagesHandler,
  sendCustomerMessageHandler,
  listCustomerAttachmentsHandler,
  createCustomerAttachmentHandler,
  downloadCustomerAttachmentHandler,
};
