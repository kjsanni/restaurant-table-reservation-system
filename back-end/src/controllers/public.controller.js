const fs = require("fs");
const path = require("path");
const planDAO = require("../tenant-platform/DAOs/plan.dao");
const { Event } = require("../db/models");
const { Op } = require("sequelize");

const listPublicPlansHandler = async (req, res) => {
  const plans = await planDAO.findAll({ isActive: true }); // codacy-suppress nosql-injection - parameterized ORM call
  const sanitized = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price: plan.price,
    currency: plan.currency,
    maxTables: plan.maxTables,
    maxReservationsPerMonth: plan.maxReservationsPerMonth,
    sortOrder: plan.sortOrder,
    features: plan.features || null,
  }));
  return res.status(200).json({ success: true, plans: sanitized });
};

const getChangelogHandler = async (req, res) => {
  const changelogPath = path.join(process.cwd(), "..", "CHANGELOG.md");
  try {
    const content = fs.readFileSync(changelogPath, "utf8"); // nosep - changelogPath is built from process.cwd() and a static relative path, not user input
    return res.status(200).json({ success: true, content });
  } catch (err) {
    return res
      .status(err.code === "ENOENT" ? 404 : 500)
      .json({ success: false, message: "Changelog not available." });
  }
};

const listPublicEventsHandler = async (req, res) => {
  const where = {
    status: "published",
    "$tenant.status$": "active",
  };

  if (req.query.fromDate) where.eventDate = { [Op.gte]: req.query.fromDate };
  if (req.query.toDate) where.eventDate = { ...where.eventDate, [Op.lte]: req.query.toDate };
  if (req.query.eventType) where.eventType = req.query.eventType;
  if (req.query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { venue: { [Op.like]: `%${req.query.search}%` } },
    ];
  }

  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const page = parseInt(req.query.page || "1", 10);
  const offset = (page - 1) * limit;

  const { rows, count } = await Event.findAndCountAll({
    where,
    include: [{ association: "tenant", attributes: ["id", "name", "slug", "domain"] }],
    order: [["eventDate", "ASC"]],
    limit,
    offset,
  });

  const sanitized = rows.map((event) => {
    const plain = event.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      description: plain.description,
      eventType: plain.eventType,
      venue: plain.venue,
      address: plain.address,
      eventDate: plain.eventDate,
      startTime: plain.startTime,
      endTime: plain.endTime,
      capacity: plain.capacity,
      isTicketed: plain.isTicketed,
      tenant: plain.tenant
        ? { id: plain.tenant.id, name: plain.tenant.name, slug: plain.tenant.slug }
        : null,
    };
  });

  return res.status(200).json({
    success: true,
    events: sanitized,
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  });
};

const getPublicEventHandler = async (req, res) => {
  const event = await Event.findOne({
    where: {
      id: req.params.id,
      status: "published",
      "$tenant.status$": "active",
    },
    include: [{ association: "tenant", attributes: ["id", "name", "slug", "domain"] }],
  });

  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  const plain = event.get({ plain: true });
  const sanitized = {
    id: plain.id,
    name: plain.name,
    description: plain.description,
    eventType: plain.eventType,
    venue: plain.venue,
    address: plain.address,
    eventDate: plain.eventDate,
    startTime: plain.startTime,
    endTime: plain.endTime,
    capacity: plain.capacity,
    isTicketed: plain.isTicketed,
    requiresApproval: plain.requiresApproval,
    checkinEnabled: plain.checkinEnabled,
    metadata: plain.metadata,
    tenant: plain.tenant
      ? { id: plain.tenant.id, name: plain.tenant.name, slug: plain.tenant.slug }
      : null,
  };

  return res.status(200).json({ success: true, event: sanitized });
};

module.exports = {
  listPublicPlansHandler,
  getChangelogHandler,
  listPublicEventsHandler,
  getPublicEventHandler,
};
