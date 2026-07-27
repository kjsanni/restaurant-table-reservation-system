const platformPaymentDAO = require("../DAOs/platformPayment.dao");

const platformPaymentController = {};

platformPaymentController.getSummary = async (req, res) => {
  const { from, to, plan, status } = req.query;

  const data = await platformPaymentDAO.getSummary({
    from,
    to,
    plan,
    status,
  });

  res.status(200).json({
    success: true,
    totals: data.totals,
    tenants: data.tenants,
    recentPayments: data.recentPayments,
  });
};

module.exports = {
  getSummary: platformPaymentController.getSummary,
};
