const marketplaceDAO = require("../DAOs/marketplace.dao");

const marketplaceController = {};

marketplaceController.listListingsHandler = async (req, res) => {
  const data = await marketplaceDAO.listListings({ includeTenant: true });
  res.status(200).json({ success: true, collection: data });
};

marketplaceController.createListingHandler = async (req, res) => {
  const listing = await marketplaceDAO.createListing(req.body);
  res.status(201).json({ success: true, item: listing });
};

marketplaceController.updateListingHandler = async (req, res) => {
  const listing = await marketplaceDAO.updateListing(req.params.id, req.body);
  if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });
  res.status(200).json({ success: true, item: listing });
};

marketplaceController.removeListingHandler = async (req, res) => {
  const removed = await marketplaceDAO.removeListing(req.params.id);
  if (!removed) return res.status(404).json({ success: false, message: "Listing not found" });
  res.status(200).json({ success: true });
};

module.exports = marketplaceController;
