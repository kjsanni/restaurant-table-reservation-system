const tipDAO = require("../../DAOs/whistleblowerTip.dao");

const createTipHandler = async (req, res) => {
  const { category, description, severity, contactInfo } = req.body;
  if (!category || !description) {
    return res.status(400).json({ success: false, message: "Category and description are required" });
  }

  const tip = await tipDAO.createTip(req.user?.tenantId || null, {
    category,
    description,
    severity: severity || "medium",
    contactInfo: contactInfo || null,
  });

  res.status(201).json({ success: true, item: tip });
};

const listTipsHandler = async (req, res) => {
  const { category, status, severity, from, to, limit = 50, offset = 0 } = req.query;
  const { tips, total } = await tipDAO.getTips(req.user?.tenantId || null, {
    category,
    status,
    severity,
    from,
    to,
  }, { limit: parseInt(limit, 10), offset: parseInt(offset, 10) });

  res.status(200).json({ success: true, collection: tips, total });
};

const getTipHandler = async (req, res) => {
  const tip = await tipDAO.getTipById(req.params.id, req.user?.tenantId || null);
  if (!tip) {
    return res.status(404).json({ success: false, message: "Tip not found" });
  }
  res.status(200).json({ success: true, item: tip });
};

const updateTipHandler = async (req, res) => {
  const tip = await tipDAO.updateTipStatus(req.params.id, req.user?.tenantId || null, req.body);
  if (!tip) {
    return res.status(404).json({ success: false, message: "Tip not found" });
  }
  res.status(200).json({ success: true, item: tip });
};

const getTipStatsHandler = async (req, res) => {
  const stats = await tipDAO.getTipStats(req.user?.tenantId || null);
  res.status(200).json({ success: true, ...stats });
};

module.exports = {
  createTipHandler,
  listTipsHandler,
  getTipHandler,
  updateTipHandler,
  getTipStatsHandler,
};
