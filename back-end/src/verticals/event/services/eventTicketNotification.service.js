"use strict";

const crypto = require("crypto");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const qrCodeService = require("./qrCode.service");
const db = require("../../../db/models");
const whatsappService = require("../../../services/whatsapp/whastapp.service");
const logger = require("../../../utils/logger");
const cache = require("../../../utils/cache");

const MAX_TICKETS_PER_WHATSAPP = 10;
const SHORT_URL_TTL = 60 * 60 * 24 * 7;

const generateShortUrl = async (ticketId, tenantId, rawToken) => {
  const shortCode = crypto.randomBytes(8).toString("hex");
  const secret = await qrCodeService.loadQrSecret(tenantId);
  const sig = crypto.createHmac("sha256", secret).update(rawToken).digest("hex");
  const payload = JSON.stringify({ ticketId, tenantId, rawToken, sig });
  await cache.set(`event_pass:${shortCode}`, payload, SHORT_URL_TTL);
  return `/e/${shortCode}`;
};

const buildWhatsAppTemplatePayload = (event, tickets, shortUrls, recipientPhone) => {
  const templateName = "event_ticket_delivery";
  const templateData = {
    messaging_product: "business_account",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: event.name },
            { type: "text", text: tickets.length.toString() },
            { type: "text", text: shortUrls.map((u) => `${process.env.PLATFORM_BASE_URL || ""}${u}`).join(", ") },
          ],
        },
      ],
    },
  };

  return templateData;
};

const eventTicketNotificationService = {};

eventTicketNotificationService.sendTicketsBatched = async (eventId, guestListEntries, tenantId) => {
  const results = [];
  const event = await db.Event.findOne({ where: { id: eventId, tenantId } });

  if (!event) {
    throw new Error("Event not found");
  }

  const batches = [];
  for (let i = 0; i < guestListEntries.length; i += MAX_TICKETS_PER_WHATSAPP) {
    batches.push(guestListEntries.slice(i, i + MAX_TICKETS_PER_WHATSAPP));
  }

  for (const batch of batches) {
    const tickets = [];
    const shortUrls = [];

    for (const entry of batch) {
      const { record, rawToken, tokenHash } = await qrCodeDAO.create({
        eventId,
        tenantId,
        guestListId: entry.id,
        attendeeName: `${entry.firstName || ""} ${entry.lastName || ""}`.trim() || null,
        seat: entry.seat || null,
        tier: entry.tier || null,
        ticketType: entry.ticketType || null,
        maxUses: 1,
        validFrom: entry.validFrom || null,
        expiresAt: event.endTime ? new Date() : null,
        metadata: entry.metadata || null,
      });

      const shortUrl = await generateShortUrl(record.id, tenantId, rawToken);
      shortUrls.push(shortUrl);
      tickets.push({ ticketId: record.id, tokenHash, shortUrl });
    }

    try {
      const recipientPhone = batch[0]?.phone || batch[0]?.whatsappNumber;
      if (!recipientPhone) {
        throw new Error("No WhatsApp number found for recipient");
      }

      const payload = buildWhatsAppTemplatePayload(event, tickets, shortUrls, recipientPhone);
      await whatsappService.sendMessage(payload);

      for (const ticket of tickets) {
        results.push({
          ticketId: ticket.ticketId,
          tokenHash: ticket.tokenHash,
          shortUrl: ticket.shortUrl,
          channel: "whatsapp",
          status: "sent",
        });
      }

      await logger.info("Event tickets sent via WhatsApp", {
        tenantId,
        eventId,
        count: tickets.length,
      });
    } catch (err) {
      logger.error("Failed to send WhatsApp tickets", {
        tenantId,
        eventId,
        error: err.message,
        ticketIds: tickets.map((t) => t.ticketId),
      });

      for (const ticket of tickets) {
        results.push({
          ticketId: ticket.ticketId,
          tokenHash: ticket.tokenHash,
          shortUrl: ticket.shortUrl,
          channel: "whatsapp",
          status: "failed",
          error: err.message,
        });
      }
    }
  }

  return results;
};

eventTicketNotificationService.sendTicketFallback = async (ticketId, tenantId, rawToken, recipientPhone) => {
  const shortUrl = await generateShortUrl(ticketId, tenantId, rawToken);

  return {
    shortUrl,
    channels: ["whatsapp", "email", "sms"],
    message: `Your ticket link ${shortUrl} has been queued for delivery via WhatsApp, email, and SMS`,
  };
};

module.exports = eventTicketNotificationService;
