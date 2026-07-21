"use strict";

const { cache } = require("../utils/cache");
const whatsappService = require("./whatsapp.service");
const menuService = require("./menu.service");
const orderService = require("./order.service");
const customerService = require("./customerService");
const { initializeCharge } = require("../tenant-platform/services/paystack.service");
const promotionService = require("./promotion.service");
const geocodingService = require("./geocoding.service");
const reservationService = require("./reservationService");
const messageTemplates = require("./messageTemplates.service");
const { parseDate, parseTime } = require("../utils/whatsappDateParser");
const db = require("../db/models");

const SESSION_PREFIX = "whatsapp:session:";
const CART_PREFIX = "whatsapp:cart:";
const SESSION_TTL = 60 * 60 * 24;

const getSession = async (phone) => {
  const key = SESSION_PREFIX + phone;
  const data = await cache.get(key);
  return data || { state: "idle", tenantId: null };
};

const setSession = async (phone, session) => {
  const key = SESSION_PREFIX + phone;
  await cache.set(key, session, SESSION_TTL);
};

const getCart = async (phone) => {
  const key = CART_PREFIX + phone;
  const data = await cache.get(key);
  return data || { items: [], discountCode: null };
};

const setCart = async (phone, cart) => {
  const key = CART_PREFIX + phone;
  await cache.set(key, cart, SESSION_TTL);
};

const clearCart = async (phone) => {
  const key = CART_PREFIX + phone;
  await cache.del(key);
};

const sendText = async (phone, text, tenantId) => {
  await whatsappService.sendWhatsAppText(phone, text, tenantId);
};

const sendTemplate = async (phone, templateName, variables = {}, tenantId) => {
  const text = await messageTemplates.render(templateName, variables, tenantId);
  await sendText(phone, text, tenantId);
};

const resolveTenant = async () => {
  const tenant = await db.tenant.findOne({ where: { isActive: true } });
  return tenant ? tenant.id : null;
};

const ensureCustomer = async (phone, tenantId) => {
  const normalized = whatsappService.formatPhoneNumber(phone);
  const customers = await customerService.searchCustomers(normalized, tenantId);
  let customer = customers.find((c) => whatsappService.formatPhoneNumber(c.phone) === normalized);
  if (!customer) {
    const syntheticEmail = `wa_${normalized}@rtrs.local`;
    customer = await customerService.findOrCreateCustomer({
      phone: normalized,
      firstName: "WhatsApp",
      lastName: "Customer",
      email: syntheticEmail,
    }, tenantId);
  }
  return customer;
};

const formatMenuCategories = (categories) => {
  if (!categories.length) return "No menu categories available.";
  return categories.map((c, idx) => `${idx + 1}. ${c.name}`).join("\n") + "\n\nReply with the number to browse items.";
};

const formatMenuItems = (items) => {
  if (!items.length) return "No items available in this category.";
  return items
    .map((item, idx) => {
      let line = `${idx + 1}. ${item.name} — GHS ${parseFloat(item.price).toFixed(2)}`;
      if (item.isVegetarian) line += " 🥬";
      if (item.isVegan) line += " 🌱";
      if (item.isSpicy) line += " 🌶️";
      if (item.description) line += `\n   ${item.description}`;
      return line;
    })
    .join("\n") + "\n\nReply with the number to add to cart, or 'back' to categories.";
};

const formatCart = (cart, menuItemsMap) => {
  if (!cart.items.length) return "Your cart is empty.";
  let lines = ["Your cart:"];
  let total = 0;
  for (const entry of cart.items) {
    const menuItem = menuItemsMap[entry.menuItemId];
    const price = menuItem ? parseFloat(menuItem.price) : 0;
    const lineTotal = price * entry.quantity;
    total += lineTotal;
    lines.push(`• ${entry.name} x${entry.quantity} = GHS ${lineTotal.toFixed(2)}`);
  }
  if (cart.discountCode) {
    lines.push(`Discount: ${cart.discountCode}`);
  }
  lines.push(`Total: GHS ${total.toFixed(2)}`);
  lines.push("\nReply 'checkout' to place order, 'cancel' to clear cart.");
  return lines.join("\n");
};

const handleStatusQuery = async (phone, tenantId) => {
  const customer = await ensureCustomer(phone, tenantId);
  const orders = await orderService.getOrders(tenantId, { customerId: customer.id }, { limit: 1 });
  if (!orders.orders.length) {
    await sendTemplate(phone, "no_orders", {}, tenantId);
    return;
  }
  const latest = orders.orders[0];
  await sendTemplate(phone, "order_status", {
    orderId: latest.id,
    status: latest.status.toUpperCase(),
    paymentStatus: latest.paymentStatus.toUpperCase(),
  }, tenantId);
};

const startReservationFlow = async (phone, session, tenantId) => {
  await setSession(phone, { ...session, state: "reservation_date", flow: "reservation", tenantId });
  const today = new Date().toISOString().slice(0, 10);
  await sendTemplate(phone, "reservation_start", { today }, tenantId);
};

const startDeliveryFlow = async (phone, session, tenantId) => {
  const categories = await menuService.getMenuCategories(tenantId);
  await setSession(phone, { ...session, state: "browsing", flow: "delivery", categoryId: null, tenantId });
  const menuCategories = formatMenuCategories(categories);
  await sendTemplate(phone, "delivery_start", { menuCategories }, tenantId);
};

const handleReservationState = async (phone, normalized, rawMessage, session, tenantId) => {
  if (session.state === "reservation_date") {
    const parsed = parseDate(rawMessage);
    if (!parsed) {
      const today = new Date().toISOString().slice(0, 10);
      await sendTemplate(phone, "reservation_date_invalid", { today }, tenantId);
      return;
    }
    session.resDate = parsed;
    await setSession(phone, { ...session, state: "reservation_time" });
    await sendTemplate(phone, "reservation_date_ok", { resDate: parsed }, tenantId);
    return;
  }

  if (session.state === "reservation_time") {
    const parsed = parseTime(rawMessage);
    if (!parsed) {
      await sendTemplate(phone, "reservation_time_invalid", {}, tenantId);
      return;
    }
    session.resTime = parsed;
    await setSession(phone, { ...session, state: "reservation_people" });
    await sendTemplate(phone, "reservation_time_ok", { resTime: parsed }, tenantId);
    return;
  }

  if (session.state === "reservation_people") {
    const num = parseInt(normalized, 10);
    if (isNaN(num) || num < 1) {
      await sendTemplate(phone, "reservation_people_invalid", {}, tenantId);
      return;
    }
    session.people = num;
    await setSession(phone, { ...session, state: "reservation_notes" });
    await sendTemplate(phone, "reservation_people_ok", {}, tenantId);
    return;
  }

  if (session.state === "reservation_notes") {
    const notes = ["skip", "none", "no", "n/a"].includes(normalized) ? null : rawMessage.trim();
    session.notes = notes;
    await setSession(phone, { ...session, state: "reservation_confirm" });
    await sendTemplate(phone, "reservation_confirm", {
      resDate: session.resDate,
      resTime: session.resTime,
      people: session.people,
      notes: notes ? notes + "\n" : "",
    }, tenantId);
    return;
  }

  if (session.state === "reservation_confirm") {
    if (["yes", "y", "confirm", "ok"].includes(normalized)) {
      try {
        const reservation = await reservationService.createFromWhatsApp(tenantId, phone, {
          resDate: session.resDate,
          resTime: session.resTime,
          people: session.people,
          notes: session.notes,
        });
        await sendTemplate(phone, "reservation_confirmed", {
          reservationId: reservation.id,
          resDate: session.resDate,
          resTime: session.resTime,
        }, tenantId);
      } catch (err) {
        const msg = err?.message || "Something went wrong.";
        await sendTemplate(phone, "reservation_failed", { errorMessage: msg }, tenantId);
        await setSession(phone, { ...session, state: "reservation_confirm" });
        return;
      }
      await setSession(phone, { state: "idle", tenantId });
      return;
    }
    if (["no", "n", "cancel"].includes(normalized)) {
      await sendTemplate(phone, "reservation_cancelled", {}, tenantId);
      await setSession(phone, { state: "idle", tenantId });
      return;
    }
    await sendText(phone, "Please reply 'yes' to confirm or 'no' to cancel.", tenantId);
    return;
  }
};

const handleDeliveryState = async (phone, normalized, rawMessage, session, cart, tenantId) => {
  if (session.state === "delivery_confirm_items") {
    if (["yes", "y", "confirm", "ok"].includes(normalized)) {
      await setSession(phone, { ...session, state: "delivery_location" });
      await sendText(
        phone,
        "Where should we deliver?\n📍 Share your location (attachment → Location)\nor type your address.",
        tenantId
      );
      return;
    }
    if (["no", "n", "cancel", "back"].includes(normalized)) {
      await setSession(phone, { ...session, state: "browsing", flow: "delivery", categoryId: null });
      await sendText(phone, "OK, keep browsing. Reply 'checkout' when ready.", tenantId);
      return;
    }
    await sendText(phone, "Please reply 'yes' to confirm your order or 'no' to go back.", tenantId);
    return;
  }

  if (session.state === "delivery_location") {
    const geocoded = await geocodingService.geocodeAddress(rawMessage.trim());
    if (!geocoded) {
      await sendTemplate(phone, "delivery_location_retry", {}, tenantId);
      return;
    }
    session.deliveryLocation = {
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      address: geocoded.address,
      region: geocoded.region,
    };
    await setSession(phone, { ...session, state: "delivery_confirm_location" });
    await sendTemplate(phone, "delivery_location_received", { address: geocoded.address }, tenantId);
    return;
  }

  if (session.state === "delivery_confirm_location") {
    if (["yes", "y", "confirm", "ok"].includes(normalized)) {
      const customer = await ensureCustomer(phone, tenantId);
      const orderPayload = {
        customerId: customer.id,
        items: cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        status: "pending",
        paymentStatus: "unpaid",
      };
      let discountAmount = 0;
      if (cart.discountCode) {
        const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const promo = await promotionService.validatePromotionCode(cart.discountCode, total, tenantId);
        if (promo.valid) {
          discountAmount = promo.discountAmount;
          await promotionService.applyPromotion(cart.discountCode, total, tenantId);
        }
      }
      const order = await orderService.createOrder(tenantId, orderPayload);
      const chargeAmount = parseFloat(order.total) - discountAmount;
      const paystackResponse = await initializeCharge({
        amount: chargeAmount,
        email: customer.email || "customer@example.com",
        phone: phone,
        metadata: {
          orderId: order.id,
          tenantId,
          deliveryLocation: session.deliveryLocation || null,
          customerPhone: phone,
          discountAmount,
        },
      });
      const paymentLink = paystackResponse.authorization_url;
      await setSession(phone, {
        ...session,
        state: "delivery_payment",
        orderId: order.id,
        tenantId,
      });
      await clearCart(phone);
      await sendTemplate(phone, "delivery_order_created", {
        orderId: order.id,
        paymentLink,
      }, tenantId);
      return;
    }
    if (["no", "n", "cancel"].includes(normalized)) {
      await setSession(phone, { ...session, state: "delivery_location" });
      await sendTemplate(phone, "delivery_location_prompt", {}, tenantId);
      return;
    }
    await sendText(phone, "Please reply 'yes' to confirm the address or 'no' to re-enter.", tenantId);
    return;
  }

  if (session.state === "delivery_payment") {
    await sendTemplate(phone, "delivery_payment_pending", {}, tenantId);
    return;
  }
};

const processMessage = async (phone, message, tenantId) => {
  const normalized = message.trim().toLowerCase();
  let session = await getSession(phone);
  const cart = await getCart(phone);

  if (!tenantId) {
    tenantId = await resolveTenant();
    if (!tenantId) {
      try {
        await sendTemplate(phone, "service_unavailable", {}, null);
      } catch (e) {
        // WhatsApp not configured, nothing we can do
      }
      return;
    }
  }

  if (session.tenantId && session.tenantId !== tenantId) {
    await sendText(phone, "Session expired. Please start again.", tenantId);
    await setSession(phone, { state: "idle", tenantId });
    await clearCart(phone);
    return;
  }

  session.tenantId = tenantId;

  if (["cancel", "stop", "reset", "exit"].includes(normalized)) {
    await setSession(phone, { state: "idle", tenantId });
    await clearCart(phone);
    await sendTemplate(phone, "session_cleared", {}, tenantId);
    return;
  }

  if (["help", "?"].includes(normalized)) {
    await sendText(phone, "Commands:\n• hi — main menu\n• menu — browse menu\n• cart — view cart\n• checkout — place order\n• cancel — clear cart\n• status — check latest order", tenantId);
    return;
  }

  if (["hi", "hello", "hey", "start", "begin"].includes(normalized)) {
    await sendTemplate(phone, "welcome", {}, tenantId);
    await setSession(phone, { state: "welcome", tenantId });
    return;
  }

  if (session.state === "welcome") {
    if (["1", "reservation", "book", "reserve"].includes(normalized)) {
      await startReservationFlow(phone, session, tenantId);
      return;
    }
    if (["2", "delivery", "order", "deliver"].includes(normalized)) {
      await startDeliveryFlow(phone, session, tenantId);
      return;
    }
    if (["3", "status", "track"].includes(normalized)) {
      await handleStatusQuery(phone, tenantId);
      return;
    }
    if (["4", "talk", "agent", "human"].includes(normalized)) {
      await sendTemplate(phone, "agent_handoff", {}, tenantId);
      return;
    }
  }

  if (["status", "track"].includes(normalized) && session.state !== "reservation_notes" && session.state !== "delivery_location") {
    await handleStatusQuery(phone, tenantId);
    return;
  }

  if (normalized === "cart") {
    const items = await menuService.getMenuItems(tenantId, { isAvailable: true });
    const map = Object.fromEntries(items.map((i) => [i.id, i]));
    await sendText(phone, formatCart(cart, map), tenantId);
    return;
  }

  if (normalized === "checkout") {
    if (!cart.items.length) {
      await sendText(phone, "Your cart is empty. Send 'menu' to start.", tenantId);
      return;
    }
    const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountMsg = cart.discountCode ? `\nDiscount: ${cart.discountCode}` : "";
    if (session.flow === "delivery") {
      const menuItems = await menuService.getMenuItems(tenantId, { isAvailable: true });
      const menuMap = Object.fromEntries((menuItems || []).map((i) => [i.id, i]));
      const cartSummary = cart.items.map((i) => `• ${i.name} x${i.quantity} = GHS ${(i.price * i.quantity).toFixed(2)}`).join("\n");
      await setSession(phone, { ...session, state: "delivery_confirm_items" });
      await sendText(phone, `Your cart:\n${cartSummary}\nTotal: GHS ${total.toFixed(2)}${discountMsg}\nDelivery fee: calculated after location.\n\nConfirm order? (yes/no)`, tenantId);
      return;
    }
    await setSession(phone, { ...session, state: "checkout" });
    await sendText(phone, `Order summary:\nTotal: GHS ${total.toFixed(2)}${discountMsg}\n\nReply 'pay' to proceed to payment, or 'cancel' to clear.`, tenantId);
    return;
  }

  if (session.state === "idle" || normalized === "menu") {
    const categories = await menuService.getMenuCategories(tenantId);
    await sendText(phone, "Welcome! Browse our menu:\n\n" + formatMenuCategories(categories), tenantId);
    await setSession(phone, { ...session, state: "browsing", flow: session.flow || "order", categoryIndex: null, tenantId });
    return;
  }

  if (session.state === "welcome" && !["1", "2", "3", "4"].includes(normalized) && normalized !== "menu") {
    const categories = await menuService.getMenuCategories(tenantId);
    await sendText(phone, "Browse our menu:\n\n" + formatMenuCategories(categories), tenantId);
    await setSession(phone, { ...session, state: "browsing", flow: "order", categoryId: null, tenantId });
    return;
  }

  if (session.state === "browsing") {
    const num = parseInt(normalized, 10);
    if (isNaN(num)) {
      await sendText(phone, "Please reply with a category number or 'menu' to start over.", tenantId);
      return;
    }
    const categories = await menuService.getMenuCategories(tenantId);
    if (num < 1 || num > categories.length) {
      await sendText(phone, "Invalid category. Reply with a valid number.", tenantId);
      return;
    }
    const category = categories[num - 1];
    const items = await menuService.getMenuItems(tenantId, { categoryId: category.id, isAvailable: true });
    session.categoryId = category.id;
    await setSession(phone, { ...session, state: "items", categoryId: category.id });
    await sendText(phone, `${category.name}:\n\n${formatMenuItems(items)}`, tenantId);
    return;
  }

  if (session.state === "items") {
    if (normalized === "back") {
      const categories = await menuService.getMenuCategories(tenantId);
      await setSession(phone, { ...session, state: "browsing", categoryId: null });
      await sendText(phone, "Categories:\n\n" + formatMenuCategories(categories), tenantId);
      return;
    }
    const num = parseInt(normalized, 10);
    if (isNaN(num)) {
      await sendText(phone, "Reply with an item number to add to cart, or 'back' to categories.", tenantId);
      return;
    }
    const items = await menuService.getMenuItems(tenantId, { categoryId: session.categoryId, isAvailable: true });
    if (num < 1 || num > items.length) {
      await sendText(phone, "Invalid item. Reply with a valid number.", tenantId);
      return;
    }
    const item = items[num - 1];
    cart.items.push({
      menuItemId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1,
    });
    await setCart(phone, cart);
    await setSession(phone, { ...session, state: "browsing" });
    await sendText(phone, `Added ${item.name} to cart.\n\n${formatCart(cart, { [item.id]: item })}`, tenantId);
    return;
  }

  if (session.state === "checkout" && normalized === "pay") {
    const customer = await ensureCustomer(phone, tenantId);
    const orderPayload = {
      customerId: customer.id,
      items: cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      status: "pending",
      paymentStatus: "unpaid",
    };
    let discountAmount = 0;
    if (cart.discountCode) {
      const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const promo = await promotionService.validatePromotionCode(cart.discountCode, total, tenantId);
      if (promo.valid) {
        discountAmount = promo.discountAmount;
        await promotionService.applyPromotion(cart.discountCode, total, tenantId);
      }
    }
    const order = await orderService.createOrder(tenantId, orderPayload);
    const chargeAmount = parseFloat(order.total) - discountAmount;
    const paystackResponse = await initializeCharge({
      amount: chargeAmount,
      email: customer.email || "customer@example.com",
      phone: phone,
      metadata: {
        orderId: order.id,
        tenantId,
        customerPhone: phone,
        discountAmount,
      },
    });
    const paymentLink = paystackResponse.authorization_url;
    await sendTemplate(phone, "order_created", { orderId: order.id, paymentLink }, tenantId);
    await setSession(phone, { state: "awaiting_payment", orderId: order.id, tenantId });
    await clearCart(phone);
    return;
  }

  if (
    session.state === "reservation_date" ||
    session.state === "reservation_time" ||
    session.state === "reservation_people" ||
    session.state === "reservation_notes" ||
    session.state === "reservation_confirm"
  ) {
    await handleReservationState(phone, normalized, message, session, tenantId);
    return;
  }

  if (
    session.state === "delivery_confirm_items" ||
    session.state === "delivery_location" ||
    session.state === "delivery_confirm_location" ||
    session.state === "delivery_payment"
  ) {
    await handleDeliveryState(phone, normalized, message, session, cart, tenantId);
    return;
  }

  await sendTemplate(phone, "unrecognized", {}, tenantId);
};

const processLocationMessage = async (phone, location, tenantId) => {
  let session = await getSession(phone);

  if (session.tenantId && session.tenantId !== tenantId) {
    await setSession(phone, { state: "idle", tenantId });
    session = { state: "idle", tenantId };
  }
  session.tenantId = tenantId;

  const { latitude, longitude, address } = location;
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  let region = geocodingService.resolveRegionFromCoords(lat, lng);
  let resolvedAddress = address || null;
  let city = null;

  if (!resolvedAddress || !region) {
    try {
      const geocoded = await geocodingService.reverseGeocode(lat, lng);
      resolvedAddress = resolvedAddress || geocoded.address;
      region = region || geocoded.region;
      city = geocoded.city;
    } catch (err) {
      // fall back to coords-only
    }
  }

  session.deliveryLocation = {
    latitude: lat,
    longitude: lng,
    address: resolvedAddress,
    region,
    city,
  };

  if (session.state === "delivery_location" || session.state === "delivery_confirm_location") {
    await setSession(phone, { ...session, state: "delivery_confirm_location" });
    const display = resolvedAddress || `${lat}, ${lng}`;
    await sendTemplate(phone, "delivery_location_shared", { address: display }, tenantId);
  } else {
    await setSession(phone, session);
    const display = resolvedAddress || `${lat}, ${lng}`;
    await sendText(phone, `Location received: ${display}`, tenantId);
  }
};

module.exports = {
  processMessage,
  processLocationMessage,
  getSession,
  setSession,
  getCart,
  setCart,
  clearCart,
};
