const notificationDAO = require("../DAOs/notification.dao");
const mailService = require("../../services/mail.service");
const db = require("../../db/models");

const SUPPORT_NOTIFICATION_TYPES = {
  ticket_created: "ticket_created",
  ticket_assigned: "ticket_assigned",
  ticket_reply: "ticket_reply",
  ticket_resolved: "ticket_resolved",
  ticket_closed: "ticket_closed",
};

const createInAppNotification = async ({
  userId,
  tenantId,
  type,
  title,
  message,
  data = {},
}) => {
  if (!userId || !tenantId) return null;
  return await notificationDAO.create({
    userId,
    tenantId,
    type,
    title,
    message,
    data,
  });
};

const sendSupportEmail = async ({ to, subject, body, tenantId }) => {
  if (!to) return null;
  try {
    await mailService.sendMail(to, "support_notification", {
      subject,
      body,
      name: process.env.RESTAURANT_NAME || "Support",
      restaurantName: process.env.RESTAURANT_NAME || "Support",
    }, tenantId);
    return { channel: "email", sent: true };
  } catch (err) {
    return { channel: "email", sent: false, error: err.message };
  }
};

const notifyTicketCreated = async ({ ticket, tenantId, recipientUserId, recipientEmail }) => {
  const title = `New support ticket #${ticket.id}`;
  const message = `${ticket.subject}`;
  await createInAppNotification({
    userId: recipientUserId,
    tenantId,
    type: SUPPORT_NOTIFICATION_TYPES.ticket_created,
    title,
    message,
    data: { ticketId: ticket.id },
  });
  await sendSupportEmail({
    to: recipientEmail,
    subject: title,
    body: `A new support ticket has been created.\n\nSubject: ${ticket.subject}\nPriority: ${ticket.priority}\nCategory: ${ticket.category}\n\nPlease review and assign it.`,
    tenantId,
  });
};

const notifyTicketAssigned = async ({ ticket, tenantId, assigneeUserId, assigneeEmail, customerEmail }) => {
  if (assigneeUserId && assigneeEmail) {
    const title = `Ticket #${ticket.id} assigned to you`;
    const message = `${ticket.subject}`;
    await createInAppNotification({
      userId: assigneeUserId,
      tenantId,
      type: SUPPORT_NOTIFICATION_TYPES.ticket_assigned,
      title,
      message,
      data: { ticketId: ticket.id },
    });
    await sendSupportEmail({
      to: assigneeEmail,
      subject: title,
      body: `You have been assigned to support ticket #${ticket.id}.\n\nSubject: ${ticket.subject}\nPriority: ${ticket.priority}\n\nPlease review and respond.`,
      tenantId,
    });
  }
  if (customerEmail && customerEmail !== assigneeEmail) {
    await sendSupportEmail({
      to: customerEmail,
      subject: `Ticket #${ticket.id} has been assigned`,
      body: `Your support ticket #${ticket.id} has been assigned to a support agent.\n\nSubject: ${ticket.subject}\n\nWe will get back to you shortly.`,
      tenantId,
    });
  }
};

const notifyTicketReply = async ({ ticket, tenantId, replySenderType, customerEmail, agentEmail }) => {
  const title = `New reply on ticket #${ticket.id}`;
  const message = `${ticket.subject}`;
  if (replySenderType === "agent" && customerEmail) {
    await createInAppNotification({
      userId: ticket.userId,
      tenantId,
      type: SUPPORT_NOTIFICATION_TYPES.ticket_reply,
      title,
      message,
      data: { ticketId: ticket.id },
    });
    await sendSupportEmail({
      to: customerEmail,
      subject: title,
      body: `A support agent has replied to your ticket #${ticket.id}.\n\nSubject: ${ticket.subject}\n\nPlease log in to view the reply.`,
      tenantId,
    });
  }
  if (replySenderType === "customer" && agentEmail) {
    await sendSupportEmail({
      to: agentEmail,
      subject: title,
      body: `A customer has replied to ticket #${ticket.id}.\n\nSubject: ${ticket.subject}\n\nPlease log in to view the reply.`,
      tenantId,
    });
  }
};

const notifyTicketResolved = async ({ ticket, tenantId, customerEmail }) => {
  const title = `Ticket #${ticket.id} resolved`;
  const message = `${ticket.subject}`;
  if (ticket.userId) {
    await createInAppNotification({
      userId: ticket.userId,
      tenantId,
      type: SUPPORT_NOTIFICATION_TYPES.ticket_resolved,
      title,
      message,
      data: { ticketId: ticket.id },
    });
  }
  if (customerEmail) {
    await sendSupportEmail({
      to: customerEmail,
      subject: title,
      body: `Your support ticket #${ticket.id} has been resolved.\n\nSubject: ${ticket.subject}\n\nIf you need further assistance, please reply to this ticket.`,
      tenantId,
    });
  }
};

const resolveUserEmail = async (userId) => {
  if (!userId) return null;
  const user = await db.user.findByPk(userId, {
    attributes: ["id", "email"],
  });
  return user?.email || null;
};

module.exports = {
  SUPPORT_NOTIFICATION_TYPES,
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyTicketReply,
  notifyTicketResolved,
  resolveUserEmail,
};
