const orderDAO = require("../DAOs/order.dao");
const menuDAO = require("../DAOs/menu.dao");
const paymentDAO = require("../DAOs/payment.dao");

const createOrder = async (tenantId, payload) => {
  const { items = [], reservationId } = payload;

  if (items.length === 0) {
    throw { status: 400, message: "Order must contain at least one item." };
  }

  for (const item of items) {
    const menuItem = await menuDAO.getMenuItemById(item.menuItemId, tenantId);
    if (!menuItem) {
      throw { status: 404, message: `Menu item ${item.menuItemId} not found.` };
    }
    if (!menuItem.isAvailable) {
      throw { status: 400, message: `Menu item "${menuItem.name}" is not available.` };
    }
    item.unitPrice = parseFloat(menuItem.price);
  }

  if (reservationId) {
    const reservation = await require("../db/models").reservation.findByPk(reservationId);
    if (!reservation) {
      throw { status: 404, message: "Linked reservation not found." };
    }
  }

  return await orderDAO.createOrder(tenantId, payload);
};

const getOrder = async (orderId, tenantId) => {
  return await orderDAO.getOrderById(orderId, tenantId);
};

const listOrders = async (tenantId, filters = {}, pagination = {}) => {
  return await orderDAO.getOrders(tenantId, filters, pagination);
};

const searchOrders = async (tenantId, query, limit = 50) => {
  return await orderDAO.searchOrders(tenantId, query, limit);
};

const getCustomerOrders = async (customerId, tenantId, limit = 50) => {
  return await orderDAO.getCustomerOrders(customerId, tenantId, limit);
};

const getReservationOrders = async (reservationId, tenantId) => {
  return await orderDAO.getReservationOrders(reservationId, tenantId);
};

const applyDiscount = async (orderId, tenantId, discountType, discountValue, discountCode) => {
  const updates = {
    discountType: discountType || null,
    discountValue: discountValue || 0,
    discountCode: discountCode || null,
  };
  return await orderDAO.updateOrder(orderId, tenantId, updates);
};

const addOrderPayment = async (orderId, tenantId, paymentData) => {
  return await orderDAO.addOrderPayment(orderId, tenantId, paymentData);
};

const getOrderPayments = async (orderId, tenantId) => {
  return await orderDAO.getOrderPayments(orderId, tenantId);
};

const getOrderStats = async (tenantId, filters = {}) => {
  return await orderDAO.getOrderStats(tenantId, filters);
};

const updateOrderStatus = async (orderId, tenantId, status) => {
  return await orderDAO.updateOrder(orderId, tenantId, { status });
};

const updateOrderPayment = async (orderId, tenantId, paymentStatus) => {
  return await orderDAO.updateOrder(orderId, tenantId, { paymentStatus });
};

const cancelOrder = async (orderId, tenantId) => {
  return await orderDAO.cancelOrder(orderId, tenantId);
};

module.exports = {
  createOrder,
  getOrder,
  listOrders,
  searchOrders,
  getCustomerOrders,
  getReservationOrders,
  applyDiscount,
  addOrderPayment,
  getOrderPayments,
  getOrderStats,
  updateOrderStatus,
  updateOrderPayment,
  cancelOrder,
};
