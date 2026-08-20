const crossTenantSearchDAO = require("../DAOs/crossTenantSearch.dao");

const crossTenantSearchController = {};

crossTenantSearchController.searchHandler = async (req, res) => {
  const { q } = req.query;
  const tenantId = req.params.tenantId || req.query.tenantId;
  if (!q || typeof q !== "string" || !q.trim()) {
    return res.status(400).json({ success: false, message: "Query parameter q is required" });
  }
  if (!tenantId) {
    return res.status(400).json({ success: false, message: "tenantId is required" });
  }

  const data = await crossTenantSearchDAO.search(q.trim(), {
    tenantId: parseInt(tenantId, 10),
  });

  res.status(200).json({
    success: true,
    ...data,
  });
};

module.exports = crossTenantSearchController;
