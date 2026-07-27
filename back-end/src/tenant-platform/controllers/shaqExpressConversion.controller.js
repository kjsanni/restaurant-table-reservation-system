const shaqExpressConversionDAO = require("../DAOs/shaqExpressConversion.dao");

const shaqExpressConversionController = {};

shaqExpressConversionController.getOrderConversionFunnelHandler = async (req, res) => {
  const { tenantId, from, to } = req.query;
  const data = await shaqExpressConversionDAO.getOrderConversionFunnel({
    tenantId: tenantId ? parseInt(tenantId, 10) : undefined,
    from,
    to,
  });
  res.status(200).json({ success: true, ...data });
};

module.exports = shaqExpressConversionController;
