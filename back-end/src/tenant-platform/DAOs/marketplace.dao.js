const db = require("../../db/models");

const marketplaceDAO = {};

marketplaceDAO.listListings = async (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.tenantId) where.tenantId = filters.tenantId;

  const listings = await db.marketplaceListing.findAll({
    where,
    include: filters.includeTenant ? [{ model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] }] : [],
    order: [["position", "ASC"]],
  });

  return listings.map((l) => l.toJSON());
};

marketplaceDAO.createListing = async (payload) => {
  const listing = await db.marketplaceListing.create(payload);
  return listing.toJSON();
};

marketplaceDAO.updateListing = async (id, updates) => {
  const listing = await db.marketplaceListing.findByPk(id);
  if (!listing) return null;
  await listing.update(updates);
  return listing.toJSON();
};

marketplaceDAO.removeListing = async (id) => {
  const listing = await db.marketplaceListing.findByPk(id);
  if (!listing) return false;
  await listing.destroy();
  return true;
};

module.exports = marketplaceDAO;
