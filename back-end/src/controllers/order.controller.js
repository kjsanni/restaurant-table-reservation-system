const orderService = require("../services/order.service");
const orderDAO = require("../DAOs/order.dao");
const { initializeCharge, verifyPayment } = require("../tenant-platform/services/paystack.service");

const createOrderHandler = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.tenant?.id, req.body);
    return res.status(201).json({ success: true, order });
  } catch (err) {
    const status = err?.status || 400;
    return res.status(status).json({ success: false, message: err?.message || "Failed to create order" });
  }
};

const getOrderHandler = async (req, res) => {
  const order = await orderService.getOrder(req.params.orderId, req.tenant?.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  return res.status(200).json({ success: true, order });
};

const getOrdersHandler = async (req, res) => {
  const filters = {};
  if (req.query.customerId) filters.customerId = req.query.customerId;
  if (req.query.reservationId) filters.reservationId = req.query.reservationId;
  if (req.query.status) filters.status = req.query.status;
  if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
  if (req.query.discountCode) filters.discountCode = req.query.discountCode;
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;

  const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
  const pagination = {};
  if (page && pageSize) {
    pagination.limit = pageSize;
    pagination.offset = (page - 1) * pageSize;
  }

  const result = await orderService.listOrders(req.tenant?.id, filters, pagination);
  const response = { success: true };
  if (pagination.limit) {
    response.collection = result.orders;
    response.total = result.total;
    response.page = page;
    response.pageSize = pageSize;
  } else {
    response.collection = result.orders;
  }
  return res.status(200).json(response);
};

const searchOrdersHandler = async (req, res) => {
  const query = req.query.q || "";
  const results = await orderService.searchOrders(req.tenant?.id, query);
  return res.status(200).json({ success: true, results });
};

const getCustomerOrdersHandler = async (req, res) => {
  const customerId = req.user?.customerId || req.query.customerId;
  if (!customerId) {
    return res.status(400).json({ success: false, message: "customerId is required" });
  }
  const orders = await orderService.getCustomerOrders(customerId, req.tenant?.id);
  return res.status(200).json({ success: true, orders });
};

const getReservationOrdersHandler = async (req, res) => {
  const orders = await orderService.getReservationOrders(req.params.reservationId, req.tenant?.id);
  return res.status(200).json({ success: true, orders });
};

const initializeOrderPaymentHandler = async (req, res) => {
  const { orderId } = req.params;
  const { email, amount } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ success: false, message: "Email and amount are required" });
  }

  const db = require("../db/models");
  const tenant = await db.tenant.findByPk(req.tenant?.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const order = await orderDAO.getOrderById(orderId, req.tenant?.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  try {
    const result = await initializeCharge({
      email,
      amount: parseFloat(amount),
      metadata: {
        tenantId: tenant.id,
        orderId,
        tenantSlug: tenant.slug,
      },
    });

    return res.status(200).json({
      success: true,
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      reference: result.reference,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Payment initialization failed" });
  }
};

const getOrderPaymentsHandler = async (req, res) => {
  const payments = await orderService.getOrderPayments(req.params.orderId, req.tenant?.id);
  return res.status(200).json({ success: true, payments });
};

const addOrderPaymentHandler = async (req, res) => {
  const payment = await orderService.addOrderPayment(req.params.orderId, req.tenant?.id, req.body);
  return res.status(201).json({
    success: true,
    payment: payment.payment,
    totalPaid: payment.totalPaid,
    order: payment.order,
  });
};

const applyDiscountHandler = async (req, res) => {
  const { discountType, discountValue, discountCode } = req.body;
  const order = await orderService.applyDiscount(req.params.orderId, req.tenant?.id, discountType, discountValue, discountCode);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  return res.status(200).json({ success: true, order });
};

const getOrderStatsHandler = async (req, res) => {
  const filters = {};
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;

  const stats = await orderService.getOrderStats(req.tenant?.id, filters);
  return res.status(200).json({ success: true, stats });
};

const updateOrderHandler = async (req, res) => {
  const allowed = ["status", "paymentStatus", "notes"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const order = await orderService.getOrder(req.params.orderId, req.tenant?.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const updated = await orderService.getOrder(req.params.orderId, req.tenant?.id);
  if (updates.status) {
    updated.status = updates.status;
  }
  if (updates.paymentStatus) {
    updated.paymentStatus = updates.paymentStatus;
  }
  if (updates.notes) {
    updated.notes = updates.notes;
  }

  const saved = await orderDAO.updateOrder(req.params.orderId, req.tenant?.id, updated);
  return res.status(200).json({ success: true, order: saved });
};

const cancelOrderHandler = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.params.orderId, req.tenant?.id);
    return res.status(200).json({ success: true, order });
  } catch (err) {
    const status = err?.status || 400;
    return res.status(status).json({ success: false, message: err?.message || "Failed to cancel order" });
  }
};

const trackOrderHandler = async (req, res) => {
  try {
    const order = await orderService.getOrder(req.params.orderId, req.tenant?.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const publicOrder = {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      items: (order.orderItems || []).map((item) => ({
        name: item.menuItem?.name || item.menuItemId,
        quantity: item.quantity,
      })),
      reservationId: order.reservationId,
    };

    return res.status(200).json({ success: true, order: publicOrder });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to track order" });
  }
};

module.exports = {
  createOrderHandler,
  getOrderHandler,
  getOrdersHandler,
  searchOrdersHandler,
  getCustomerOrdersHandler,
  getReservationOrdersHandler,
  initializeOrderPaymentHandler,
  getOrderPaymentsHandler,
  addOrderPaymentHandler,
  applyDiscountHandler,
  getOrderStatsHandler,
  updateOrderHandler,
  cancelOrderHandler,
  trackOrderHandler,
};
