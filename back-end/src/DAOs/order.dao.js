const db = require("../db/models");
const { Op } = db.Sequelize;
const Order = db.order;
const OrderItem = db.orderItem;
const MenuItem = db.menuItem;
const Customer = db.customer;
const Reservation = db.reservation;
const Payment = db.payment;

const withTenant = (where = {}, tenantId) =>
  tenantId ? { ...where, tenantId } : where;

const calculateDiscount = (total, discountType, discountValue) => {
  if (!discountType || discountValue == null || parseFloat(discountValue) <= 0) {
    return 0;
  }
  const value = parseFloat(discountValue);
  if (discountType === "percentage") {
    return (total * value) / 100;
  }
  return Math.min(value, total);
};

const createOrder = async (tenantId, data) => {
  const { items = [], customerId, reservationId, notes, createdBy, discountType, discountValue, discountCode } = data;

  return await db.sequelize.transaction(async (t) => {
    const order = await Order.create(
      {
        ...withTenant({}, tenantId),
        customerId: customerId || null,
        reservationId: reservationId || null,
        notes: notes || null,
        createdBy: createdBy || "customer",
        status: "submitted",
        paymentStatus: "unpaid",
        total: 0,
        orderedAt: new Date(),
        discountType: discountType || null,
        discountValue: discountValue || 0,
        discountCode: discountCode || null,
      },
      { transaction: t }
    );

    let subtotal = 0;
    for (const item of items) {
      const optionsTotal = (item.selectedOptions || []).reduce((s, o) => s + parseFloat(o.priceAdjustment || 0), 0);
      const lineTotal = (parseFloat(item.unitPrice || 0) + optionsTotal) * parseInt(item.quantity || 1, 10);
      subtotal += lineTotal;
      await OrderItem.create(
        {
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity || 1,
          unitPrice: parseFloat(item.unitPrice || 0),
          selectedOptions: item.selectedOptions || null,
          itemNotes: item.itemNotes || null,
          lineTotal,
        },
        { transaction: t }
      );
    }

    const discountAmount = calculateDiscount(subtotal, discountType, discountValue);
    order.total = (subtotal - discountAmount).toFixed(2);
    await order.save({ transaction: t });

    return order;
  });
};

const updateOrder = async (id, tenantId, data) => {
  const order = await Order.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!order) return null;

  if (data.status === "completed" && !order.completedAt) {
    data.completedAt = new Date();
  }

  if (data.discountType || data.discountValue != null) {
    const items = await OrderItem.findAll({ where: { orderId: id } });
    const subtotal = items.reduce((s, i) => s + parseFloat(i.lineTotal || 0), 0);
    const discountAmount = calculateDiscount(subtotal, data.discountType || order.discountType, data.discountValue || order.discountValue || 0);
    data.total = (subtotal - discountAmount).toFixed(2);
  }

  return await order.update(data);
};

const getOrderById = async (id, tenantId) => {
  return await Order.findOne({
    where: withTenant({ id }, tenantId),
    include: [
      {
        model: Customer,
        attributes: ["id", "firstName", "lastName", "email", "phone"],
      },
      {
        model: Reservation,
        attributes: ["id", "resDate", "resTime", "resStatus"],
      },
      {
        model: OrderItem,
        include: [
          {
            model: MenuItem,
            attributes: ["id", "name", "description", "price"],
          },
        ],
      },
    ],
  });
};

const getOrders = async (tenantId, filters = {}, pagination = {}) => {
  const where = withTenant({}, tenantId);
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.reservationId) where.reservationId = filters.reservationId;
  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.discountCode) where.discountCode = filters.discountCode;
  if (filters.from || filters.to) {
    where.orderedAt = {};
    if (filters.from) where.orderedAt[Op.gte] = new Date(filters.from);
    if (filters.to) where.orderedAt[Op.lte] = new Date(filters.to);
  }

  const opts = {
    where,
    include: [
      {
        model: Customer,
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: Reservation,
        attributes: ["id", "resDate", "resTime"],
      },
    ],
    order: [["orderedAt", "DESC"]],
  };

  if (pagination.limit) opts.limit = pagination.limit;
  if (pagination.offset !== undefined) opts.offset = pagination.offset;

  const { rows, count } = await Order.findAndCountAll(opts);
  return { orders: rows, total: count };
};

const searchOrders = async (tenantId, query, limit = 50) => {
  const escapedQuery = query.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  const like = `%${escapedQuery}%`;

  return await Order.findAll({
    where: withTenant(
      {
        [Op.or]: [
          { "$Customer.firstName$": { [Op.like]: like } },
          { "$Customer.lastName$": { [Op.like]: like } },
          { "$Customer.email$": { [Op.like]: like } },
          { notes: { [Op.like]: like } },
          { discountCode: { [Op.like]: like } },
        ],
      },
      tenantId
    ),
    include: [
      {
        model: Customer,
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: OrderItem,
        include: [
          {
            model: MenuItem,
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [["orderedAt", "DESC"]],
    limit,
  });
};

const getCustomerOrders = async (customerId, tenantId, limit = 50) => {
  return await Order.findAll({
    where: withTenant({ customerId }, tenantId),
    include: [
      {
        model: OrderItem,
        include: [
          {
            model: MenuItem,
            attributes: ["id", "name", "price"],
          },
        ],
      },
    ],
    order: [["orderedAt", "DESC"]],
    limit,
  });
};

const getReservationOrders = async (reservationId, tenantId) => {
  return await Order.findAll({
    where: withTenant({ reservationId }, tenantId),
    include: [
      {
        model: OrderItem,
        include: [
          {
            model: MenuItem,
            attributes: ["id", "name", "price"],
          },
        ],
      },
    ],
    order: [["orderedAt", "ASC"]],
  });
};

const getOrderPayments = async (orderId, tenantId) => {
  return await Payment.findAll({
    where: withTenant({ orderId }, tenantId),
    order: [["paidAt", "DESC"]],
  });
};

const addOrderPayment = async (orderId, tenantId, data) => {
  const payment = await Payment.create({
    ...data,
    orderId,
    ...withTenant({}, tenantId),
  });

  const payments = await Payment.findAll({
    where: withTenant({ orderId }, tenantId),
  });
  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const order = await Order.findOne({
    where: withTenant({ id: orderId }, tenantId),
  });

  let updatedOrder = null;
  if (order) {
    const newStatus = totalPaid >= parseFloat(order.total || 0) ? "paid" : totalPaid > 0 ? "partial" : "unpaid";
    if (order.paymentStatus !== newStatus) {
      await order.update({ paymentStatus: newStatus });
      updatedOrder = order;
    }
  }

  return { payment, totalPaid, order: updatedOrder };
};

const recalculateOrderTotal = async (orderId, tenantId) => {
  const order = await Order.findOne({
    where: withTenant({ id: orderId }, tenantId),
  });
  if (!order) return null;

  const items = await OrderItem.findAll({
    where: { orderId },
  });

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.lineTotal || 0), 0);
  const discountAmount = calculateDiscount(subtotal, order.discountType, order.discountValue || 0);
  order.total = (subtotal - discountAmount).toFixed(2);
  await order.save();

  return order;
};

const cancelOrder = async (id, tenantId) => {
  const order = await Order.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!order) return null;
  if (order.status === "cancelled" || order.status === "completed") {
    throw { status: 400, message: "Order cannot be cancelled in its current state." };
  }
  order.status = "cancelled";
  await order.save();
  return order;
};

const getOrderStats = async (tenantId, filters = {}) => {
  const where = withTenant({}, tenantId);
  if (filters.from) where.orderedAt = { ...where.orderedAt, [Op.gte]: new Date(filters.from) };
  if (filters.to) where.orderedAt = { ...where.orderedAt, [Op.lte]: new Date(filters.to) };

  const result = await Order.findOne({
    attributes: [
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalOrders"],
      [db.sequelize.fn("SUM", db.sequelize.col("total")), "totalRevenue"],
      [db.sequelize.fn("AVG", db.sequelize.col("total")), "avgOrderValue"],
    ],
    where,
    raw: true,
  });

  const statusBreakdown = await Order.findAll({
    attributes: ["status", [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"]],
    where,
    group: ["status"],
    raw: true,
  });

  return {
    totalOrders: parseInt(result?.totalOrders || 0),
    totalRevenue: parseFloat(result?.totalRevenue || 0),
    avgOrderValue: parseFloat(result?.avgOrderValue || 0),
    statusBreakdown: statusBreakdown.map((r) => ({ status: r.status, count: parseInt(r.count) })),
  };
};

module.exports = {
  createOrder,
  updateOrder,
  getOrderById,
  getOrders,
  searchOrders,
  getCustomerOrders,
  getReservationOrders,
  getOrderPayments,
  addOrderPayment,
  recalculateOrderTotal,
  cancelOrder,
  getOrderStats,
};
