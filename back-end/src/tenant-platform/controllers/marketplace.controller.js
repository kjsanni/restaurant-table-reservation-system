const marketplaceDAO = require("../DAOs/marketplace.dao");

const marketplaceController = {};

marketplaceController.listListingsHandler = async (req, res) => {
  const data = await marketplaceDAO.listListings({ includeTenant: true });
  res.status(200).json({ success: true, collection: data });
};

marketplaceController.createListingHandler = async (req, res) => {
  const allowed = ["tenantId", "title", "description", "position", "isActive"];
  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }
  const listing = await marketplaceDAO.createListing(data);
  res.status(201).json({ success: true, item: listing });
};

marketplaceController.updateListingHandler = async (req, res) => {
  const allowed = ["tenantId", "title", "description", "position", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  const tenantId = req.tenant?.id;
  const listing = await marketplaceDAO.updateListing(req.params.id, updates, tenantId);
  if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });
  res.status(200).json({ success: true, item: listing });
};

marketplaceController.removeListingHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  const removed = await marketplaceDAO.removeListing(req.params.id, tenantId);
  if (!removed) return res.status(404).json({ success: false, message: "Listing not found" });
  res.status(200).json({ success: true });
};

module.exports = marketplaceController;
