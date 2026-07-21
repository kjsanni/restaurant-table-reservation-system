const shaqExpressService = require("./shaqexpress.service");
const deliveryDAO = require("../DAOs/delivery.dao");
const orderDAO = require("../DAOs/order.dao");
const { cache } = require("../utils/cache");

const createDelivery = async (tenantId, orderId, deliveryAddress) => {
  const order = await orderDAO.getOrderById(orderId, tenantId);
  if (!order) {
    throw { status: 404, message: "Order not found" };
  }

  const partnerRef = `ORD-${order.id}-${Date.now()}`;
  const restaurantAddress = process.env.RESTAURANT_ADDRESS || "Restaurant Location";

  const packageData = {
    partner_ref: partnerRef,
    customer_name: deliveryAddress.customerName || order.customer?.firstName || "Customer",
    customer_phone_1: deliveryAddress.customerPhone || order.customer?.phone || "",
    customer_phone_2: deliveryAddress.customerPhone2 || null,
    source_address_line_1: restaurantAddress,
    destination_region: deliveryAddress.region,
    destination_city: deliveryAddress.city,
    destination_address_line_1: deliveryAddress.address,
    destination_address_line_2: deliveryAddress.address2 || null,
    destination_postal_code: deliveryAddress.postalCode || null,
    latitude: deliveryAddress.latitude || null,
    longitude: deliveryAddress.longitude || null,
    description: `Order #${order.id} - ${order.orderItems?.map((i) => i.menuItem?.name).join(", ") || "Food Order"}`,
    units: order.orderItems?.reduce((sum, i) => sum + i.quantity, 0) || 1,
    type: "box",
    handling: "normal",
    value: parseFloat(order.total),
    amount_to_collect: 0,
    items: order.orderItems?.map((i) => ({ name: i.menuItem?.name || `Item ${i.menuItemId}`, quantity: i.quantity })) || [],
  };

  const result = await shaqExpressService.createPackage(tenantId, packageData);

  const delivery = await deliveryDAO.createDelivery(tenantId, {
    orderId,
    partnerRef,
    trackingNumber: result.data?.trackingNumber || null,
    status: result.data?.status || "pending",
    statusDescription: result.data?.statusDescription || null,
    customerName: packageData.customer_name,
    customerPhone: packageData.customer_phone_1,
    destinationRegion: deliveryAddress.region,
    destinationCity: deliveryAddress.city,
    destinationAddress: deliveryAddress.address,
    destinationPostalCode: deliveryAddress.postalCode || null,
    latitude: deliveryAddress.latitude || null,
    longitude: deliveryAddress.longitude || null,
    packageType: "box",
    handling: "normal",
    value: packageData.value,
    amountToCollect: 0,
    paymentCollector: "partner",
    paymentStatus: "unpaid",
    trackingHistory: result.data?.tracking || [],
  });

  if (result.data?.trackingNumber) {
    await orderDAO.updateOrder(orderId, tenantId, {
      deliveryStatus: "pending",
      trackingNumber: result.data.trackingNumber,
    });
  }

  return delivery;
};

const createFromWhatsApp = async (tenantId, orderId, deliveryLocation, customerName = "WhatsApp Customer", customerPhone = null) => {
  if (!orderId) {
    throw { status: 400, message: "Order ID is required to create a WhatsApp delivery." };
  }
  if (!deliveryLocation) {
    throw { status: 400, message: "Delivery location is required." };
  }

  const deliveryAddress = {
    customerName,
    customerPhone: customerPhone || null,
    region: deliveryLocation.region || null,
    city: deliveryLocation.city || null,
    address: deliveryLocation.address || null,
    latitude: deliveryLocation.latitude || null,
    longitude: deliveryLocation.longitude || null,
  };

  return await createDelivery(tenantId, orderId, deliveryAddress);
};

const getDelivery = async (deliveryId, tenantId) => {
  return await deliveryDAO.getDeliveryById(deliveryId, tenantId);
};

const getDeliveryByTracking = async (trackingNumber, tenantId) => {
  return await deliveryDAO.getDeliveryByTrackingNumber(trackingNumber, tenantId);
};

const getDeliveriesForOrder = async (orderId, tenantId) => {
  return await deliveryDAO.getDeliveriesByOrderId(orderId, tenantId);
};

const listDeliveries = async (tenantId, filters = {}, pagination = {}) => {
  return await deliveryDAO.getAllDeliveries(tenantId, filters, pagination);
};

const syncDeliveryStatus = async (deliveryId, tenantId) => {
  const delivery = await deliveryDAO.getDeliveryById(deliveryId, tenantId);
  if (!delivery || !delivery.partnerRef) {
    throw { status: 404, message: "Delivery not found or missing partner ref" };
  }

  const result = await shaqExpressService.getPackage(tenantId, delivery.partnerRef);
  const data = result.data || {};

  const updates = {
    trackingNumber: data.trackingNumber || delivery.trackingNumber,
    status: data.status || delivery.status,
    statusDescription: data.statusDescription || delivery.statusDescription,
    customerName: data.customerName || delivery.customerName,
    customerPhone: data.customerPhone1 || delivery.customerPhone,
    destinationRegion: data.destinationRegion || delivery.destinationRegion,
    destinationCity: data.destinationCity || delivery.destinationCity,
    destinationAddress: data.destinationAddressLine1 || delivery.destinationAddress,
    destinationPostalCode: data.destinationPostalCode || delivery.destinationPostalCode,
    latitude: data.latitude || delivery.latitude,
    longitude: data.longitude || delivery.longitude,
    eta: data.eta || delivery.eta,
    maxEta: data.maxEta || delivery.maxEta,
    deliveryAttempts: data.deliveryAttempts ?? delivery.deliveryAttempts,
    trackingHistory: data.trackingHistory || delivery.trackingHistory,
    callLogs: data.callLogs || delivery.callLogs,
    proofPhotoUrl: data.proofPhotoUrl || delivery.proofPhotoUrl,
    shaqShipmentReference: data.shipmentReference || delivery.shaqShipmentReference,
  };

  return await deliveryDAO.updateDelivery(deliveryId, tenantId, updates);
};

const cancelDelivery = async (deliveryId, tenantId) => {
  const delivery = await deliveryDAO.getDeliveryById(deliveryId, tenantId);
  if (!delivery || !delivery.partnerRef) {
    throw { status: 404, message: "Delivery not found or missing partner ref" };
  }

  await shaqExpressService.cancelPackage(tenantId, delivery.partnerRef);
  return await deliveryDAO.updateDelivery(deliveryId, tenantId, { status: "cancelled", statusDescription: "Cancelled via platform" });
};

const handleShaqExpressWebhook = async (payload, tenantId) => {
  const event = payload.event;
  const data = payload.data || {};
  const partnerRef = data.partner_ref;
  const trackingNumber = data.tracking_number;

  if (!partnerRef) {
    return { status: "OK" };
  }

  const delivery = await deliveryDAO.getDeliveryByPartnerRef(partnerRef, tenantId);

  if (!delivery) {
    return { status: "OK" };
  }

  const updates = {
    trackingNumber: trackingNumber || delivery.trackingNumber,
    status: data.status || delivery.status,
    statusDescription: data.description || delivery.statusDescription,
    proofPhotoUrl: data.meta?.proof_url || delivery.proofPhotoUrl,
    trackingHistory: data.trackingHistory || delivery.trackingHistory,
  };

  if (data.meta?.old_amount_to_collect !== undefined && data.meta?.new_amount_to_collect !== undefined) {
    updates.amountToCollect = data.meta.new_amount_to_collect;
  }

  await deliveryDAO.updateDelivery(delivery.id, tenantId, updates);

  if (event === "package.status_updated" && data.status === "delivered") {
    const order = await orderDAO.getOrderById(delivery.orderId, tenantId);
    if (order) {
      await orderDAO.updateOrder(delivery.orderId, tenantId, { deliveryStatus: "delivered" });
    }
  }

  return { status: "OK" };
};

module.exports = {
  createDelivery,
  createFromWhatsApp,
  getDelivery,
  getDeliveryByTracking,
  getDeliveriesForOrder,
  listDeliveries,
  syncDeliveryStatus,
  cancelDelivery,
  handleShaqExpressWebhook,
};
