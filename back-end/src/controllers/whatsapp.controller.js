const whatsappOrderService = require("../services/whatsapp-order.service");
const { verifyWebhookSignature } = require("../services/whatsapp.service");
const whatsappAppointmentService = require("../verticals/salon/services/whatsappAppointment.service");
const logger = require("../utils/logger");
const { Op } = require("sequelize");
const db = require("../db/models");

const inboundHandler = async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers["x-hub-signature-256"] || req.headers["x-signature"];
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
      logger.error("WHATSAPP_APP_SECRET is not set — rejecting inbound webhook for security.");
      return res.status(503).json({ success: false, message: "Webhook not configured" });
    }

    if (!signature) {
      return res.status(401).json({ success: false, message: "Missing signature" });
    }
    const isValid = verifyWebhookSignature(payload, signature, appSecret);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    const entry = payload.entry && payload.entry[0];
    const changes = entry && entry.changes && entry.changes[0];
    const value = changes && changes.value;
    const messages = value && value.messages;

    if (!messages || !messages.length) {
      return res.status(200).json({ success: true });
    }

    const message = messages[0];
    const phone = message.from;
    const tenantId = await resolveTenantId(value.metadata || {});

    if (!tenantId) {
      return res.status(200).json({ success: true });
    }

    const tenant = await db.tenant.findByPk(tenantId);
    const isSalon = tenant?.businessVertical === "salon";

    if (isSalon) {
      const settings = tenant?.settings || {};
      const flags = settings.featureFlags || {};
      const waBookingEnabled = flags.salon_whatsapp_booking !== false;

      if (!waBookingEnabled) {
        return res.status(200).json({ success: true });
      }

      if (message.type === "text" && message.text && message.text.body) {
        const session = await whatsappAppointmentService.getSession(phone);
        if (session.state === "idle") {
          await whatsappAppointmentService.startSalonAppointmentFlow(phone, tenantId);
        } else {
          await whatsappAppointmentService.handleSalonAppointmentState(phone, message.text.body.toLowerCase(), message.text.body, session, tenantId);
        }
      }
      return res.status(200).json({ success: true });
    }

    if (message.type === "text" && message.text && message.text.body) {
      await whatsappOrderService.processMessage(phone, message.text.body, tenantId);
    } else if (message.type === "location" && message.location) {
      const { latitude, longitude, address } = message.location;
      await whatsappOrderService.processLocationMessage(
        phone,
        { latitude, longitude, address },
        tenantId
      );
    } else if (message.type === "interactive" && message.interactive) {
      const reply = message.interactive.button_reply || message.interactive.list_reply;
      if (reply && reply.id) {
        await whatsappOrderService.processMessage(phone, reply.id, tenantId);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("WhatsApp inbound error:", err);
    return res.status(200).json({ success: true });
  }
};

const resolveTenantId = async (metadata) => {
  if (!metadata || !metadata.phone_number_id) return null;
  try {
    const setting = await require("../db/models").setting.findOne({
      where: { key: "whatsapp_config" },
    });
    if (setting && setting.value) {
      const cfg = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (cfg.phoneNumberId === metadata.phone_number_id) {
        return cfg.tenantId || null;
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
};

const verifyTokenHandler = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (!/^\d+$/.test(challenge)) {
    return res.status(403).send("Forbidden");
  }

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).type("text/plain").send(challenge);
  }
  return res.status(403).send("Forbidden");
};

module.exports = {
  inboundHandler,
  verifyTokenHandler,
};
