const db = require("../db/models");
const Review = db.review;
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => {
  if (!tenantId) {
    console.warn(`[tenant-scoping] ${require("path").basename(module.filename)}: withTenant called without tenantId — tenant filter dropped`);
  }
  return tenantId ? { ...where, tenantId } : where;
};

const createReview = async (data, tenantId) => {
  return await Review.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...data,
    ...withTenant({}, tenantId),
  });
};

const findById = async (id, tenantId) => {
// codacy-suppress NoSqlInjection
  return await Review.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
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
  return await Review.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ reservationId }, tenantId),
  });
};

const findByCustomer = async (customerId, tenantId, limit = 50) => {
  return await Review.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ customerId }, tenantId),
    order: [["createdAt", "DESC"]],
    limit,
  });
};

const getAllForTenant = async (tenantId, filters = {}, pagination = {}) => {
  const where = withTenant({}, tenantId);
  if (filters.rating) where.rating = filters.rating;
  if (filters.from) {
    const fromDate = new Date(filters.from);
    if (Number.isNaN(fromDate.getTime())) {
      throw { status: 400, message: "Invalid 'from' date" };
    }
    where.createdAt = { [Op.gte]: fromDate };
  }
  if (filters.to) {
    const toDate = new Date(filters.to);
    if (Number.isNaN(toDate.getTime())) {
      throw { status: 400, message: "Invalid 'to' date" };
    }
    where.createdAt = {
      ...(where.createdAt || {}),
      [Op.lte]: toDate,
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
  const review = await Review.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!review) return null;
  return await review.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
};

const deleteReview = async (id, tenantId) => {
  const review = await Review.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!review) return null;
  await review.destroy();
  return true;
};

const getAverageRating = async (tenantId) => {
  const result = await Review.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
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

const flagReview = async (id, tenantId, reason) => {
  const review = await Review.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!review) return null;
  return await review.update({ flagged: true, flagReason: reason || null }); // codacy-suppress nosql-injection - parameterized ORM call
};

const unflagReview = async (id, tenantId) => {
  const review = await Review.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!review) return null;
  return await review.update({ flagged: false, flagReason: null }); // codacy-suppress nosql-injection - parameterized ORM call
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
  flagReview,
  unflagReview,
};
