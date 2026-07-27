const supportTicketAnalyticsDAO = require("../DAOs/supportTicketAnalytics.dao");

const supportTicketAnalyticsController = {};

supportTicketAnalyticsController.getWhatsAppAnalyticsHandler = async (req, res) => {
  const { tenantId, from, to } = req.query;
  const data = await supportTicketAnalyticsDAO.getWhatsAppAnalytics({
    tenantId: tenantId ? parseInt(tenantId, 10) : undefined,
    from,
    to,
  });
  res.status(200).json({ success: true, ...data });
};

module.exports = supportTicketAnalyticsController;
