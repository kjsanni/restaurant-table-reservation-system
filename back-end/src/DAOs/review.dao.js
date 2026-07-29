const db = require("../db/models");
const Review = db.review;
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const createReview = async (data, tenantId) => {
  return await Review.create({
    ...data,
    ...withTenant({}, tenantId),
  });
};

const findById = async (id, tenantId) => {
  return await Review.findOne({
    where: withTenant({ id }, tenantId),
    include: [
      {
        model: db.customer,
        as: "customer",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });
};

const findByReservation = async (reservationId, tenantId) => {
  return await Review.findOne({
    where: withTenant({ reservationId }, tenantId),
  });
};

const findByCustomer = async (customerId, tenantId, limit = 50) => {
  return await Review.findAll({
    where: withTenant({ customerId }, tenantId),
    order: [["createdAt", "DESC"]],
    limit,
  });
};

const getAllForTenant = async (tenantId, filters = {}, pagination = {}) => {
  const where = withTenant({}, tenantId);
  if (filters.rating) where.rating = filters.rating;
  if (filters.from) where.createdAt = { [Op.gte]: new Date(filters.from) };
  if (filters.to) {
    where.createdAt = {
      ...(where.createdAt || {}),
      [Op.lte]: new Date(filters.to),
    };
  }

  const opts = {
    where,
    order: [["createdAt", "DESC"]],
  };

  if (pagination.limit) opts.limit = pagination.limit;
  if (pagination.offset !== undefined) opts.offset = pagination.offset;

  const { rows, count } = await Review.findAndCountAll(opts);
  return { reviews: rows, total: count };
};

const updateReview = async (id, updates, tenantId) => {
  const review = await Review.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!review) return null;
  return await review.update(updates);
};

const deleteReview = async (id, tenantId) => {
  const review = await Review.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!review) return null;
  await review.destroy();
  return true;
};

const getAverageRating = async (tenantId) => {
  const result = await Review.findOne({
    where: withTenant({}, tenantId),
    attributes: [
      [db.Sequelize.fn("AVG", db.Sequelize.col("rating")), "avgRating"],
      [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
    ],
    raw: true,
  });
  return {
    average: result?.avgRating ? parseFloat(result.avgRating) : 0,
    count: parseInt(result?.count || 0, 10),
  };
};

module.exports = {
  createReview,
  findById,
  findByReservation,
  findByCustomer,
  getAllForTenant,
  updateReview,
  deleteReview,
  getAverageRating,
};
