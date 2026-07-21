const deliveryService = require("../services/delivery.service");
const shaqExpressService = require("../services/shaqexpress.service");
const logger = require("../utils/logger");

const shaqWebhookHandler = async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers["x-shaqexpress-signature"] || req.headers["x-signature"];
    const { secret } = await shaqExpressService.getCredentials(null);

    if (!shaqExpressService.verifyWebhookSignature(payload, signature, secret)) {
      logger.warn("Shaq Express webhook signature verification failed");
      return res.status(401).json({ status: "ERROR", message: "Invalid signature" });
    }

    const tenantId = await resolveTenantId(payload);

    if (!tenantId) {
      return res.status(200).json({ status: "OK" });
    }

    await deliveryService.handleShaqExpressWebhook(payload, tenantId);
    return res.status(200).json({ status: "OK" });
  } catch (err) {
    logger.error("Shaq Express webhook error:", err);
    return res.status(200).json({ status: "OK" });
  }
};

const resolveTenantId = async (payload) => {
  try {
    const partnerRef = payload?.data?.partner_ref;
    if (!partnerRef) return null;

    const delivery = await require("../db/models").delivery.findOne({
      where: { partnerRef },
    });

    return delivery?.tenantId || null;
  } catch (err) {
    return null;
  }
};

module.exports = {
  shaqWebhookHandler,
};
