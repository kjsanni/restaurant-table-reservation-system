const db = require("../db/models");
const { Op } = db.Sequelize;

const DATA_SOURCES = {
  reservations: {
    model: db.reservation,
    fields: [
      { key: "id", label: "ID", type: "number" },
      { key: "resDate", label: "Date", type: "date" },
      { key: "resTime", label: "Time", type: "time" },
      { key: "people", label: "Party Size", type: "number" },
      { key: "resStatus", label: "Status", type: "string" },
      { key: "paymentStatus", label: "Payment Status", type: "string" },
      { key: "occasion", label: "Occasion", type: "string" },
      { key: "notes", label: "Notes", type: "text" },
      { key: "createdAt", label: "Created At", type: "datetime" },
    ],
    filters: [
      { key: "from", label: "From Date", type: "date" },
      { key: "to", label: "To Date", type: "date" },
      { key: "resStatus", label: "Status", type: "select", options: ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"] },
      { key: "paymentStatus", label: "Payment Status", type: "select", options: ["pending", "paid", "failed", "refunded"] },
    ],
    groupBy: ["resDate", "resStatus", "paymentStatus", "occasion"],
    aggregates: [
      { key: "count", label: "Count", fn: "COUNT" },
      { key: "sum_people", label: "Total Guests", fn: "SUM", field: "people" },
      { key: "avg_people", label: "Avg Party Size", fn: "AVG", field: "people" },
    ],
  },
  orders: {
    model: db.order,
    fields: [
      { key: "id", label: "ID", type: "number" },
      { key: "orderDate", label: "Date", type: "date" },
      { key: "totalAmount", label: "Total", type: "number" },
      { key: "status", label: "Status", type: "string" },
      { key: "paymentStatus", label: "Payment Status", type: "string" },
      { key: "createdAt", label: "Created At", type: "datetime" },
    ],
    filters: [
      { key: "from", label: "From Date", type: "date" },
      { key: "to", label: "To Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["pending", "preparing", "ready", "served", "cancelled"] },
      { key: "paymentStatus", label: "Payment Status", type: "select", options: ["pending", "paid", "failed", "refunded"] },
    ],
    groupBy: ["orderDate", "status", "paymentStatus"],
    aggregates: [
      { key: "count", label: "Count", fn: "COUNT" },
      { key: "sum_total", label: "Total Revenue", fn: "SUM", field: "totalAmount" },
      { key: "avg_total", label: "Avg Order Value", fn: "AVG", field: "totalAmount" },
    ],
  },
  customers: {
    model: db.customer,
    fields: [
      { key: "id", label: "ID", type: "number" },
      { key: "firstName", label: "First Name", type: "string" },
      { key: "lastName", label: "Last Name", type: "string" },
      { key: "email", label: "Email", type: "string" },
      { key: "phone", label: "Phone", type: "string" },
      { key: "visitCount", label: "Visits", type: "number" },
      { key: "points", label: "Loyalty Points", type: "number" },
      { key: "lastVisitDate", label: "Last Visit", type: "date" },
      { key: "createdAt", label: "Created At", type: "datetime" },
    ],
    filters: [
      { key: "from", label: "Created After", type: "date" },
      { key: "to", label: "Created Before", type: "date" },
      { key: "minVisits", label: "Min Visits", type: "number" },
      { key: "minPoints", label: "Min Points", type: "number" },
    ],
    groupBy: [],
    aggregates: [
      { key: "count", label: "Count", fn: "COUNT" },
      { key: "sum_visits", label: "Total Visits", fn: "SUM", field: "visitCount" },
      { key: "avg_points", label: "Avg Points", fn: "AVG", field: "points" },
    ],
  },
  payments: {
    model: db.payment,
    fields: [
      { key: "id", label: "ID", type: "number" },
      { key: "amount", label: "Amount", type: "number" },
      { key: "currency", label: "Currency", type: "string" },
      { key: "status", label: "Status", type: "string" },
      { key: "paymentMethod", label: "Method", type: "string" },
      { key: "paidAt", label: "Paid At", type: "datetime" },
      { key: "createdAt", label: "Created At", type: "datetime" },
    ],
    filters: [
      { key: "from", label: "From Date", type: "date" },
      { key: "to", label: "To Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["pending", "completed", "failed", "refunded"] },
      { key: "paymentMethod", label: "Method", type: "select", options: ["cash", "card", "mobile_money", "bank_transfer"] },
    ],
    groupBy: ["status", "paymentMethod", "currency"],
    aggregates: [
      { key: "count", label: "Count", fn: "COUNT" },
      { key: "sum_amount", label: "Total Amount", fn: "SUM", field: "amount" },
      { key: "avg_amount", label: "Avg Amount", fn: "AVG", field: "amount" },
    ],
  },
  reviews: {
    model: db.review,
    fields: [
      { key: "id", label: "ID", type: "number" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "comment", label: "Comment", type: "text" },
      { key: "channel", label: "Channel", type: "string" },
      { key: "response", label: "Response", type: "text" },
      { key: "createdAt", label: "Created At", type: "datetime" },
    ],
    filters: [
      { key: "from", label: "From Date", type: "date" },
      { key: "to", label: "To Date", type: "date" },
      { key: "rating", label: "Rating", type: "select", options: ["1", "2", "3", "4", "5"] },
      { key: "channel", label: "Channel", type: "select", options: ["web", "email", "sms", "whatsapp"] },
    ],
    groupBy: ["rating", "channel"],
    aggregates: [
      { key: "count", label: "Count", fn: "COUNT" },
      { key: "avg_rating", label: "Avg Rating", fn: "AVG", field: "rating" },
    ],
  },
};

const buildCustomReport = async (config, tenantId) => {
  const source = DATA_SOURCES[config.source];
  if (!source) {
    throw { status: 400, message: "Invalid report source" };
  }

  const where = {};
  if (tenantId) where.tenantId = tenantId;

  if (config.filters) {
    for (const [key, value] of Object.entries(config.filters)) {
      if (value === undefined || value === null || value === "") continue;
      if (key === "from") {
        where.createdAt = { ...where.createdAt, [Op.gte]: value };
      } else if (key === "to") {
        where.createdAt = { ...where.createdAt, [Op.lte]: value };
      } else if (key === "minVisits") {
        where.visitCount = { ...where.visitCount, [Op.gte]: parseInt(value, 10) };
      } else if (key === "minPoints") {
        where.points = { ...where.points, [Op.gte]: parseInt(value, 10) };
      } else {
        where[key] = value;
      }
    }
  }

  const attributes = config.fields && config.fields.length > 0
    ? config.fields
    : source.fields.map((f) => f.key);

  const include = [];
  if (config.source === "reviews") {
    include.push({
      model: db.customer,
      as: "customer",
      attributes: ["firstName", "lastName", "email"],
      required: false,
    });
  }

  const order = [];
  if (config.sortBy) {
    order.push([config.sortBy, config.sortOrder === "desc" ? "DESC" : "ASC"]);
  }

  const limit = config.limit || 100;
  const offset = config.offset || 0;

  const query = {
    where,
    attributes,
    include,
    order,
    limit,
    offset,
  };

  if (config.groupBy && config.aggregate) {
    query.attributes = [
      ...config.groupBy.map((field) => field),
      [
        db.Sequelize.fn(config.aggregate.fn, db.Sequelize.col(config.aggregate.field || "*")),
        config.aggregate.key,
      ],
    ];
    query.group = config.groupBy;
    delete query.limit;
    delete query.offset;
  }

  const { rows, count } = await source.model.findAndCountAll(query);
  return { data: rows, total: count };
};

const getAvailableSources = () => {
  return Object.entries(DATA_SOURCES).map(([key, source]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    fields: source.fields,
    filters: source.filters,
    groupBy: source.groupBy,
    aggregates: source.aggregates,
  }));
};

module.exports = {
  buildCustomReport,
  getAvailableSources,
  DATA_SOURCES,
};
