const db = require("../../db/models");

const marketplaceDAO = {};

marketplaceDAO.listListings = async (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.tenantId) where.tenantId = filters.tenantId;

  const listings = await db.marketplaceListing.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: filters.includeTenant ? [{ model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] }] : [],
    order: [["position", "ASC"]],
  });

  return listings.map((l) => l.toJSON());
};

marketplaceDAO.createListing = async (payload) => {
  const listing = await db.marketplaceListing.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
  return listing.toJSON();
};

marketplaceDAO.updateListing = async (id, updates, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  const listing = await db.marketplaceListing.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!listing) return null;
  await listing.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return listing.toJSON();
};

marketplaceDAO.removeListing = async (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  const listing = await db.marketplaceListing.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!listing) return false;
  await listing.destroy();
  return true;
};

module.exports = marketplaceDAO;
