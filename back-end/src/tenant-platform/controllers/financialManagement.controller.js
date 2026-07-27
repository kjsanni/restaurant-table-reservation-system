const db = require("../../db/models");
const refundDAO = require("../../DAOs/refund.dao");
const paymentDAO = require("../../DAOs/payment.dao");

const listRefundsHandler = async (req, res) => {
  const { status, tenantId, from, to } = req.query;
  const where = {};
  if (status) where.status = status;
  if (tenantId) where.tenantId = parseInt(tenantId, 10);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[db.Sequelize.Op.gte] = new Date(from);
    if (to) where.createdAt[db.Sequelize.Op.lte] = new Date(to);
  }

  const refunds = await db.refund.findAll({
    where,
    include: [
      { model: db.payment, as: "payment", attributes: ["id", "amount", "method", "reference"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 100,
  });

  res.status(200).json({ success: true, collection: refunds });
};

const updateRefundStatusHandler = async (req, res) => {
  const refund = await db.refund.findByPk(req.params.id);
  if (!refund) {
    return res.status(404).json({ success: false, message: "Refund not found" });
  }
  const { status } = req.body;
  if (!["pending", "succeeded", "failed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  await refund.update({ status });
  res.status(200).json({ success: true, item: refund });
};

const getSubscriptionHealthHandler = async (req, res) => {
  const tenants = await db.tenant.findAll({
    attributes: ["id", "name", "status", "subscriptionStatus", "plan", "currentPeriodEnd", "graceEndsAt", "cancelAtPeriodEnd"],
  });

  const health = tenants.map((t) => {
    const now = new Date();
    const periodEnd = t.currentPeriodEnd ? new Date(t.currentPeriodEnd) : null;
    const graceEnd = t.graceEndsAt ? new Date(t.graceEndsAt) : null;
    const daysToPeriodEnd = periodEnd ? Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)) : null;
    const daysToGraceEnd = graceEnd ? Math.ceil((graceEnd - now) / (1000 * 60 * 60 * 24)) : null;

    let risk = "healthy";
    if (t.status === "suspended" || t.subscriptionStatus === "cancelled") risk = "critical";
    else if (t.status === "past_due" || t.cancelAtPeriodEnd) risk = "warning";
    else if (daysToPeriodEnd !== null && daysToPeriodEnd <= 7) risk = "at_risk";

    return {
      id: t.id,
      name: t.name,
      status: t.status,
      subscriptionStatus: t.subscriptionStatus,
      plan: t.plan,
      daysToPeriodEnd,
      daysToGraceEnd,
      cancelAtPeriodEnd: t.cancelAtPeriodEnd,
      risk,
    };
  });

  const summary = {
    total: health.length,
    healthy: health.filter((h) => h.risk === "healthy").length,
    atRisk: health.filter((h) => h.risk === "at_risk").length,
    warning: health.filter((h) => h.risk === "warning").length,
    critical: health.filter((h) => h.risk === "critical").length,
  };

  res.status(200).json({ success: true, summary, collection: health });
};

const detectFinancialAnomaliesHandler = async (req, res) => {
  const anomalies = [];

  const largeRefunds = await db.refund.findAll({
    where: { status: "succeeded" },
    include: [
      { model: db.payment, as: "payment", attributes: ["id", "amount", "tenantId"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 50,
  });

  for (const refund of largeRefunds) {
    const paymentAmount = parseFloat(refund.payment?.amount || 0);
    const refundAmount = parseFloat(refund.amount || 0);
    if (paymentAmount > 0 && refundAmount / paymentAmount > 0.5) {
      anomalies.push({
        type: "large_refund",
        refundId: refund.id,
        tenantId: refund.tenantId,
        paymentId: refund.paymentId,
        amount: refundAmount,
        ratio: Math.round((refundAmount / paymentAmount) * 100) / 100,
      });
    }
  }

  const highDiscountOrders = await db.order.findAll({
    where: {
      discountType: "percentage",
      discountValue: { [db.Sequelize.Op.gte]: 50 },
    },
    include: [
      { model: db.tenant, as: "tenant", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 20,
  });

  for (const order of highDiscountOrders) {
    anomalies.push({
      type: "high_discount",
      orderId: order.id,
      tenantId: order.tenantId,
      tenantName: order.tenant?.name,
      discountValue: order.discountValue,
      total: order.total,
    });
  }

  const frequentCancellers = await db.reservation.findAll({
    where: {
      resStatus: "cancelled",
      createdAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    include: [
      { model: db.customer, as: "customer", attributes: ["id", "firstName", "lastName", "email", "phone"] },
    ],
    group: ["customerId"],
    attributes: ["customerId", [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "cancellationCount"]],
    having: db.Sequelize.literal("COUNT(id) >= 3"),
    order: [[db.Sequelize.literal("cancellationCount"), "DESC"]],
    limit: 20,
  });

  for (const row of frequentCancellers) {
    anomalies.push({
      type: "frequent_canceller",
      customerId: row.customerId,
      customerName: row.customer ? `${row.customer.firstName} ${row.customer.lastName}` : "Unknown",
      customerEmail: row.customer?.email,
      customerPhone: row.customer?.phone,
      cancellationCount: parseInt(row.cancellationCount, 10),
    });
  }

  const staffVoids = await db.order.findAll({
    where: {
      status: "cancelled",
      createdBy: { [db.Sequelize.Op.ne]: "customer" },
    },
    include: [
      { model: db.tenant, as: "tenant", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 30,
  });

  for (const order of staffVoids) {
    anomalies.push({
      type: "staff_void",
      orderId: order.id,
      tenantId: order.tenantId,
      tenantName: order.tenant?.name,
      createdBy: order.createdBy,
      total: order.total,
      cancelledAt: order.updatedAt,
    });
  }

  const cashPayments = await db.payment.findAll({
    where: { method: "cash" },
    attributes: [
      "tenantId",
      [db.Sequelize.fn("SUM", db.Sequelize.col("amount")), "cashTotal"],
    ],
    group: ["tenantId"],
    raw: true,
  });

  const orderTotals = await db.order.findAll({
    where: { paymentStatus: { [db.Sequelize.Op.ne]: "unpaid" } },
    attributes: [
      "tenantId",
      [db.Sequelize.fn("SUM", db.Sequelize.col("total")), "orderTotal"],
    ],
    group: ["tenantId"],
    raw: true,
  });

  const orderTotalMap = new Map(orderTotals.map((o) => [o.tenantId, parseFloat(o.orderTotal || 0)]));

  for (const cp of cashPayments) {
    const expected = orderTotalMap.get(cp.tenantId) || 0;
    const actual = parseFloat(cp.cashTotal || 0);
    const gap = Math.abs(expected - actual);
    if (expected > 0 && gap / expected > 0.1) {
      anomalies.push({
        type: "cash_reconciliation_gap",
        tenantId: cp.tenantId,
        expected,
        actual,
        gap,
        ratio: Math.round((gap / expected) * 100) / 100,
      });
    }
  }

  const lowStockItems = await db.inventoryItem.findAll({
    where: {
      isActive: true,
      quantity: { [db.Sequelize.Op.lte]: db.Sequelize.col("reorderLevel") },
    },
    include: [
      { model: db.tenant, as: "tenant", attributes: ["id", "name"] },
    ],
    order: [["quantity", "ASC"]],
    limit: 30,
  });

  for (const item of lowStockItems) {
    anomalies.push({
      type: "inventory_shrinkage",
      itemId: item.id,
      tenantId: item.tenantId,
      tenantName: item.tenant?.name,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
    });
  }

  const staffActions = await db.auditLog.findAll({
    where: {
      entityType: "order",
      action: { [db.Sequelize.Op.in]: ["void", "comp", "cancel"] },
      createdAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    include: [
      { model: db.user, as: "user", attributes: ["id", "username", "role"] },
    ],
    group: ["userId"],
    attributes: [
      "userId",
      [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "actionCount"],
      [db.Sequelize.fn("SUM", db.Sequelize.literal("CAST(changes->>'$.amount' AS DECIMAL(10,2))")), "totalAmount"],
    ],
    having: db.Sequelize.literal("COUNT(id) >= 2"),
    order: [[db.Sequelize.literal("actionCount"), "DESC"]],
    limit: 20,
    raw: true,
  });

  for (const row of staffActions) {
    const score = Math.min(100, parseInt(row.actionCount, 10) * 10 + (parseFloat(row.totalAmount || 0) > 500 ? 20 : 0));
    anomalies.push({
      type: "staff_behavior_score",
      userId: row.userId,
      username: row.user?.username || "Unknown",
      role: row.user?.role,
      actionCount: parseInt(row.actionCount, 10),
      totalAmount: parseFloat(row.totalAmount || 0),
      score,
    });
  }

  const longDurationReservations = await db.reservation.findAll({
    where: {
      resStatus: { [db.Sequelize.Op.in]: ["completed", "cancelled"] },
      createdAt: { [db.Sequelize.Op.lte]: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    },
    include: [
      { model: db.customer, as: "customer", attributes: ["id", "firstName", "lastName", "email"] },
      { model: db.tenant, as: "tenant", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "ASC"]],
    limit: 20,
  });

  for (const reservation of longDurationReservations) {
    const durationHours = (new Date(reservation.updatedAt) - new Date(reservation.createdAt)) / (1000 * 60 * 60);
    if (durationHours > 3) {
      anomalies.push({
        type: "long_table_duration",
        reservationId: reservation.id,
        tenantId: reservation.tenantId,
        tenantName: reservation.tenant?.name,
        customerName: reservation.customer ? `${reservation.customer.firstName} ${reservation.customer.lastName}` : "Unknown",
        durationHours: Math.round(durationHours * 100) / 100,
        resStatus: reservation.resStatus,
      });
    }
  }

  const cashConcentration = await db.payment.findAll({
    where: { method: "cash" },
    attributes: [
      "tenantId",
      [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "cashCount"],
      [db.Sequelize.fn("SUM", db.Sequelize.col("amount")), "cashTotal"],
    ],
    group: ["tenantId"],
    having: db.Sequelize.literal("SUM(amount) > 0"),
    order: [[db.Sequelize.literal("cashTotal"), "DESC"]],
    limit: 20,
    raw: true,
  });

  const totalPayments = await db.payment.findAll({
    attributes: [
      "tenantId",
      [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "totalCount"],
      [db.Sequelize.fn("SUM", db.Sequelize.col("amount")), "totalAmount"],
    ],
    group: ["tenantId"],
    having: db.Sequelize.literal("SUM(amount) > 0"),
    raw: true,
  });

  const totalMap = new Map(totalPayments.map((p) => [p.tenantId, { count: parseInt(p.totalCount, 10), total: parseFloat(p.totalAmount || 0) }]));

  for (const cc of cashConcentration) {
    const totals = totalMap.get(cc.tenantId) || { count: 0, total: 0 };
    const cashRatio = totals.total > 0 ? parseFloat(cc.cashTotal || 0) / totals.total : 0;
    if (cashRatio > 0.8) {
      anomalies.push({
        type: "cash_concentration",
        tenantId: cc.tenantId,
        cashCount: parseInt(cc.cashCount, 10),
        cashTotal: parseFloat(cc.cashTotal || 0),
        totalPayments: totals.count,
        totalAmount: totals.total,
        cashRatio: Math.round(cashRatio * 100) / 100,
      });
    }
  }

  if (db.giftCard) {
    const suspiciousGiftCards = await db.giftCard.findAll({
      where: {
        status: "redeemed",
        redeemedAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: [
        { model: db.customer, as: "purchasedBy", attributes: ["id", "firstName", "lastName", "email", "phone"] },
        { model: db.customer, as: "redeemedBy", attributes: ["id", "firstName", "lastName", "email", "phone"] },
      ],
      order: [["redeemedAt", "DESC"]],
      limit: 30,
    });

    for (const card of suspiciousGiftCards) {
      const purchasedAt = new Date(card.createdAt);
      const redeemedAt = new Date(card.redeemedAt);
      const hoursToRedeem = (redeemedAt - purchasedAt) / (1000 * 60 * 60);
      const differentRedeemer = card.purchasedBy && card.redeemedBy && card.purchasedBy.id !== card.redeemedBy.id;

      if (hoursToRedeem < 1 || differentRedeemer) {
        anomalies.push({
          type: "gift_card_fraud",
          giftCardId: card.id,
          tenantId: card.tenantId,
          code: card.code,
          amount: card.amount,
          purchasedBy: card.purchasedBy ? `${card.purchasedBy.firstName} ${card.purchasedBy.lastName}` : "Unknown",
          redeemedBy: card.redeemedBy ? `${card.redeemedBy.firstName} ${card.redeemedBy.lastName}` : "Unknown",
          hoursToRedeem: Math.round(hoursToRedeem * 100) / 100,
          differentRedeemer,
        });
      }
    }
  }

  const tenantAnomalyCounts = new Map();
  for (const anomaly of anomalies) {
    const tid = anomaly.tenantId;
    if (!tid) continue;
    tenantAnomalyCounts.set(tid, (tenantAnomalyCounts.get(tid) || 0) + 1);
  }

  for (const [tenantId, count] of tenantAnomalyCounts.entries()) {
    if (count >= 3) {
      const tenant = await db.tenant.findByPk(tenantId);
      anomalies.push({
        type: "cross_tenant_fraud_pattern",
        tenantId,
        tenantName: tenant?.name || `Tenant #${tenantId}`,
        anomalyCount: count,
      });
    }
  }

  res.status(200).json({ success: true, collection: anomalies.slice(0, 50) });
};

module.exports = {
  listRefundsHandler,
  updateRefundStatusHandler,
  getSubscriptionHealthHandler,
  detectFinancialAnomaliesHandler,
};
