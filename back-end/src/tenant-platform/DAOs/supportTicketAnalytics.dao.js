const db = require("../../db/models");

const supportTicketAnalyticsDAO = {};

supportTicketAnalyticsDAO.getWhatsAppAnalytics = async (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.from) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: new Date(filters.from) };
  if (filters.to) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: new Date(filters.to) };

  const tickets = await db.supportTicket.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    attributes: [
      "id",
      "status",
      "priority",
      "source",
      "csat",
      "createdAt",
      "resolvedAt",
      "firstResponseAt",
    ],
    raw: true,
  });

  const whatsappTickets = tickets.filter((t) => t.source === "whatsapp");
  const total = whatsappTickets.length;
  const open = whatsappTickets.filter((t) => t.status === "open").length;
  const inProgress = whatsappTickets.filter((t) => t.status === "in_progress").length;
  const resolved = whatsappTickets.filter((t) => t.status === "resolved").length;
  const closed = whatsappTickets.filter((t) => t.status === "closed").length;

  let avgResolutionHours = 0;
  let avgFirstResponseHours = 0;
  let avgCsat = 0;

  const resolvedTickets = whatsappTickets.filter((t) => t.resolvedAt);
  if (resolvedTickets.length > 0) {
    const resolutionTimes = resolvedTickets.map((t) => (new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60));
    avgResolutionHours = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
  }

  const firstResponseTickets = whatsappTickets.filter((t) => t.firstResponseAt);
  if (firstResponseTickets.length > 0) {
    const responseTimes = firstResponseTickets.map((t) => (new Date(t.firstResponseAt) - new Date(t.createdAt)) / (1000 * 60 * 60));
    avgFirstResponseHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  const csatTickets = whatsappTickets.filter((t) => t.csat !== null && t.csat !== undefined);
  if (csatTickets.length > 0) {
    avgCsat = csatTickets.reduce((a, t) => a + parseInt(t.csat, 10), 0) / csatTickets.length;
  }

  return {
    total,
    open,
    inProgress,
    resolved,
    closed,
    avgResolutionHours: Math.round(avgResolutionHours * 100) / 100,
    avgFirstResponseHours: Math.round(avgFirstResponseHours * 100) / 100,
    avgCsat: Math.round(avgCsat * 100) / 100,
    csatCount: csatTickets.length,
  };
};

module.exports = supportTicketAnalyticsDAO;
