const crossTenantSearchDAO = require("../DAOs/crossTenantSearch.dao");

const crossTenantSearchController = {};

crossTenantSearchController.searchHandler = async (req, res) => {
  const { q, tenantId } = req.query;
  if (!q || typeof q !== "string" || !q.trim()) {
    return res.status(400).json({ success: false, message: "Query parameter q is required" });
  }

  const data = await crossTenantSearchDAO.search(q.trim(), {
    tenantId: tenantId ? parseInt(tenantId, 10) : undefined,
  });

  res.status(200).json({
    success: true,
    ...data,
  });
};

module.exports = crossTenantSearchController;
