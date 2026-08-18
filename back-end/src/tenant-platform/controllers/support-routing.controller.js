const SupportRouting = require("../services/support-routing.service");

const routeTicketHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { category, priority } = req.body;
    const result = await SupportRouting.routeTicket({ ticketId, tenantId: req.tenant?.id, category, priority });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getTicketQueueHandler = async (req, res) => {
  try {
    const { teamId } = req.params;
    const queue = await SupportRouting.getTicketQueue(parseInt(teamId));
    res.status(200).json({ success: true, data: queue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  routeTicketHandler,
  getTicketQueueHandler,
};
