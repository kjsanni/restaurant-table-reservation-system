const db = require("../../db/models");

const shaqExpressConversionDAO = {};

shaqExpressConversionDAO.getOrderConversionFunnel = async (filters = {}) => {
  const deliveryWhere = {};
  if (filters.tenantId) deliveryWhere.tenantId = filters.tenantId;
  if (filters.from) deliveryWhere.createdAt = { ...deliveryWhere.createdAt, [db.Sequelize.Op.gte]: new Date(filters.from) };
  if (filters.to) deliveryWhere.createdAt = { ...deliveryWhere.createdAt, [db.Sequelize.Op.lte]: new Date(filters.to) };
  deliveryWhere.whatsappSessionId = { [db.Sequelize.Op.ne]: null };

  const deliveries = await db.delivery.findAll({
    where: deliveryWhere,
    attributes: [
      "id",
      "orderId",
      "tenantId",
      "status",
      "deliveryAttempts",
      "destinationCity",
      "destinationRegion",
      "createdAt",
    ],
    raw: true,
  });

  const orderIds = [...new Set(deliveries.map((d) => d.orderId).filter(Boolean))];

  const orders = await db.order.findAll({
    where: { id: { [db.Sequelize.Op.in]: orderIds } },
    attributes: ["id", "status", "paymentStatus", "total", "createdAt", "completedAt"],
    raw: true,
  });

  const orderMap = {};
  for (const order of orders) {
    orderMap[order.id] = order;
  }

  const funnel = {
    totalOrders: orders.length,
    whatsappOrders: deliveries.length,
    withDelivery: deliveries.length,
    deliveryCompleted: 0,
    deliveryFailed: 0,
    totalRevenue: 0,
    deliveredRevenue: 0,
  };

  const breakdown = {};

  for (const delivery of deliveries) {
    const order = orderMap[delivery.orderId];
    const revenue = parseFloat(order?.total || 0);
    funnel.totalRevenue += revenue;

    if (delivery.status === "delivered") {
      funnel.deliveryCompleted += 1;
      funnel.deliveredRevenue += revenue;
    } else if (delivery.status === "failed") {
      funnel.deliveryFailed += 1;
    }

    const region = delivery.destinationRegion || "unknown";
    if (!breakdown[region]) {
      breakdown[region] = {
        region,
        orders: 0,
        deliveries: 0,
        completed: 0,
        failed: 0,
        revenue: 0,
      };
    }
    breakdown[region].deliveries += 1;
    if (delivery.status === "delivered") breakdown[region].completed += 1;
    if (delivery.status === "failed") breakdown[region].failed += 1;
    breakdown[region].revenue += revenue;
  }

  return {
    funnel,
    breakdown: Object.values(breakdown),
  };
};

module.exports = shaqExpressConversionDAO;

