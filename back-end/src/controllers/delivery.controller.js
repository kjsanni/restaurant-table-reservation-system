const deliveryService = require("../services/delivery.service");
const shaqExpressService = require("../services/shaqexpress.service");

const createDeliveryHandler = async (req, res) => {
  try {
    const delivery = await deliveryService.createDelivery(req.tenant?.id, req.body.orderId, req.body.deliveryAddress || req.body);
    return res.status(201).json({ success: true, delivery });
  } catch (err) {
    const status = err?.status || 400;
    return res.status(status).json({ success: false, message: err?.message || "Failed to create delivery" });
  }
};

const getDeliveryHandler = async (req, res) => {
  const delivery = await deliveryService.getDelivery(req.params.deliveryId, req.tenant?.id);
  if (!delivery) {
    return res.status(404).json({ success: false, message: "Delivery not found" });
  }
  return res.status(200).json({ success: true, delivery });
};

const getDeliveriesForOrderHandler = async (req, res) => {
  const deliveries = await deliveryService.getDeliveriesForOrder(req.params.orderId, req.tenant?.id);
  return res.status(200).json({ success: true, deliveries });
};

const getDeliveriesHandler = async (req, res) => {
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
  if (req.query.orderId) filters.orderId = req.query.orderId;
  if (req.query.trackingNumber) filters.trackingNumber = req.query.trackingNumber;
  if (req.query.customerPhone) filters.customerPhone = req.query.customerPhone;

  const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
  const pagination = {};
  if (page && pageSize) {
    pagination.limit = pageSize;
    pagination.offset = (page - 1) * pageSize;
  }

  const result = await deliveryService.listDeliveries(req.tenant?.id, filters, pagination);
  const response = { success: true };
  if (pagination.limit) {
    response.collection = result.deliveries;
    response.total = result.total;
    response.page = page;
    response.pageSize = pageSize;
  } else {
    response.collection = result.deliveries;
  }
  return res.status(200).json(response);
};

const syncDeliveryHandler = async (req, res) => {
  try {
    const delivery = await deliveryService.syncDeliveryStatus(req.params.deliveryId, req.tenant?.id);
    return res.status(200).json({ success: true, delivery });
  } catch (err) {
    const status = err?.status || 400;
    return res.status(status).json({ success: false, message: err?.message || "Failed to sync delivery" });
  }
};

const cancelDeliveryHandler = async (req, res) => {
  try {
    const delivery = await deliveryService.cancelDelivery(req.params.deliveryId, req.tenant?.id);
    return res.status(200).json({ success: true, delivery });
  } catch (err) {
    const status = err?.status || 400;
    return res.status(status).json({ success: false, message: err?.message || "Failed to cancel delivery" });
  }
};

const trackDeliveryHandler = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const delivery = await deliveryDAO.getDeliveryByTrackingNumber(trackingNumber);
    if (!delivery) {
      return res.status(404).json({ success: false, message: "Tracking number not found" });
    }
    const tracking = await shaqExpressService.trackPackage(delivery.tenantId, trackingNumber);
    return res.status(200).json({ success: true, tracking: tracking.data });
  } catch (err) {
    const status = err?.status || 400;
    return res.status(status).json({ success: false, message: err?.message || "Failed to track delivery" });
  }
};

const getRegionsHandler = async (req, res) => {
  try {
    const regions = await shaqExpressService.getRegions(req.tenant?.id);
    return res.status(200).json({ success: true, regions: regions.data });
  } catch (err) {
    const status = err?.status || 400;
    return res.status(status).json({ success: false, message: err?.message || "Failed to load regions" });
  }
};

module.exports = {
  createDeliveryHandler,
  getDeliveryHandler,
  getDeliveriesForOrderHandler,
  getDeliveriesHandler,
  syncDeliveryHandler,
  cancelDeliveryHandler,
  trackDeliveryHandler,
  getRegionsHandler,
};
