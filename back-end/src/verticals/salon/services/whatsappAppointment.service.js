"use strict";
const appointmentSchedulingService = require("./appointmentScheduling.service");
const appointmentDao = require("../DAOs/appointment.dao");
const { initializeCharge } = require("../../tenant-platform/services/paystack.service");
const salonModels = require("../models");
const { cache } = require("../../utils/cache");
const whatsappService = require("../../services/whatsapp.service");
const customerService = require("../../services/customerService");
const messageTemplates = require("../../services/messageTemplates.service");

const SESSION_PREFIX = "whatsapp:salon:session:";
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

const sendText = async (phone, text, tenantId) => {
  await whatsappService.sendWhatsAppText(phone, text, tenantId);
};

const ensureCustomer = async (phone, tenantId) => {
  const normalized = whatsappService.formatPhoneNumber(phone);
  const customers = await customerService.searchCustomers(normalized, tenantId);
  let customer = customers.find((c) => whatsappService.formatPhoneNumber(c.phone) === normalized);
  if (!customer) {
    const syntheticEmail = `wa_${normalized}@salon.local`;
    customer = await customerService.findOrCreateCustomer({
      phone: normalized,
      firstName: "WhatsApp",
      lastName: "Customer",
      email: syntheticEmail,
    }, tenantId);
  }
  return customer;
};

const formatServices = async (tenantId) => {
  const { data } = await appointmentDao.findAllForTenant(tenantId, { limit: 20 });
  const services = await Promise.all(
    (data || []).map(async (apt) => {
      const service = apt.service || await salonModels.sequelize.models.service.findByPk(apt.serviceId);
      return { id: apt.serviceId, name: service?.name || `Service ${apt.serviceId}`, durationMinutes: service?.durationMinutes || 30 };
    })
  );
  return [...new Map(services.map((s) => [s.id, s])).values()];
};

const formatStylists = async (tenantId, serviceId) => {
  const stylists = await salonModels.sequelize.models.user.findAll({
    where: { tenantId, role: "staff" },
    attributes: ["id", "name"],
    limit: 20,
  });
  return stylists.map((s) => ({ id: s.id, name: s.name || `Stylist ${s.id}` }));
};

const startSalonAppointmentFlow = async (phone, tenantId) => {
  const services = await formatServices(tenantId);
  if (!services.length) {
    await sendText(phone, "No services available right now. Please call the salon.", tenantId);
    return;
  }
  const session = {
    state: "salon_service",
    flow: "salon_appointment",
    tenantId,
    services,
    selectedServiceId: null,
    selectedDate: null,
    selectedSlot: null,
    selectedStylistId: null,
    customerName: null,
    customerEmail: null,
    customerPhone: null,
    paymentReference: null,
    appointmentId: null,
  };
  await setSession(phone, session);
  const menu = services.map((s, idx) => `${idx + 1}. ${s.name} (${s.durationMinutes}m)`).join("\n");
  await sendText(phone, `Welcome to our salon booking! Please select a service:\n\n${menu}\n\nReply with the number.`, tenantId);
};

const handleSalonAppointmentState = async (phone, normalized, rawMessage, session, tenantId) => {
  if (session.state === "salon_service") {
    const idx = parseInt(normalized, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= session.services.length) {
      await sendText(phone, "Invalid choice. Please reply with the service number.", tenantId);
      return;
    }
    const service = session.services[idx];
    session.selectedServiceId = service.id;
    await setSession(phone, { ...session, state: "salon_date" });
    const today = new Date().toISOString().slice(0, 10);
    await sendText(phone, `You selected: ${service.name} (${service.durationMinutes}m)\n\nWhat date would you like? (YYYY-MM-DD)\nExample: ${today}`, tenantId);
    return;
  }

  if (session.state === "salon_date") {
    const parsed = rawMessage.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(parsed)) {
      await sendText(phone, "Please send the date in YYYY-MM-DD format. Example: 2026-08-01", tenantId);
      return;
    }
    const slots = await appointmentSchedulingService.findAvailableSlots(tenantId, session.selectedServiceId, parsed);
    if (!slots.length) {
      await sendText(phone, "No available slots for this date. Please try another date.", tenantId);
      return;
    }
    session.selectedDate = parsed;
    session.slots = slots.slice(0, 10);
    await setSession(phone, { ...session, state: "salon_time" });
    const slotList = session.slots.map((s, i) => `${i + 1}. ${new Date(s.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`).join("\n");
    await sendText(phone, `Available slots for ${parsed}:\n\n${slotList}\n\nReply with the slot number.`, tenantId);
    return;
  }

  if (session.state === "salon_time") {
    const idx = parseInt(normalized, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= session.slots.length) {
      await sendText(phone, "Invalid slot. Please reply with the slot number.", tenantId);
      return;
    }
    const slot = session.slots[idx];
    session.selectedSlot = slot;
    const stylists = await formatStylists(tenantId, session.selectedServiceId);
    session.stylists = stylists;
    await setSession(phone, { ...session, state: "salon_stylist" });
    const stylistList = stylists.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
    await sendText(phone, `Selected time: ${new Date(slot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n\nChoose a stylist:\n\n${stylistList}\n\nReply with the number or "any" for the first available.`, tenantId);
    return;
  }

  if (session.state === "salon_stylist") {
    let stylistId = null;
    if (!["any", "0", "none"].includes(normalized)) {
      const idx = parseInt(normalized, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= session.stylists.length) {
        await sendText(phone, "Invalid stylist. Reply with the number or 'any'.", tenantId);
        return;
      }
      stylistId = session.stylists[idx].id;
    } else {
      stylistId = session.stylists[0]?.id || null;
    }
    session.selectedStylistId = stylistId;
    await setSession(phone, { ...session, state: "salon_customer_details" });
    await sendText(phone, "Please share your full name.", tenantId);
    return;
  }

  if (session.state === "salon_customer_details") {
    const parts = rawMessage.trim().split(" ");
    session.customerName = rawMessage.trim();
    session.customerPhone = phone;
    await setSession(phone, { ...session, state: "salon_confirm" });
    const service = session.services.find((s) => s.id === session.selectedServiceId);
    const stylist = session.stylists.find((s) => s.id === session.selectedStylistId);
    await sendText(
      phone,
      `Please confirm your booking:\n\nService: ${service?.name || "Unknown"}\nDate: ${session.selectedDate}\nTime: ${new Date(session.selectedSlot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\nStylist: ${stylist?.name || "Any"}\nName: ${session.customerName}\n\nReply 'yes' to confirm or 'no' to cancel.`,
      tenantId
    );
    return;
  }

  if (session.state === "salon_confirm") {
    if (["yes", "y", "confirm", "ok"].includes(normalized)) {
      try {
        const service = session.services.find((s) => s.id === session.selectedServiceId);
        const customer = await ensureCustomer(phone, tenantId);
        const appointment = await appointmentDao.create({
          tenantId,
          customerId: customer.id,
          serviceId: session.selectedServiceId,
          stylistId: session.selectedStylistId,
          start: new Date(session.selectedSlot.start).toISOString(),
          end: new Date(session.selectedSlot.end).toISOString(),
          durationMinutes: service?.durationMinutes || 30,
          status: "confirmed",
          paymentStatus: "unpaid",
          depositAmount: 0,
          source: "whatsapp",
        });
        session.appointmentId = appointment.id;
        await setSession(phone, { ...session, state: "salon_payment" });
        const amount = (service?.price || 50) * 100;
        const payment = await initializeCharge(
          { email: customer.email || `wa_${phone}@salon.local`, amount, metadata: { appointmentId: appointment.id, service: service?.name } },
          { paystackSecretKey: process.env.PAYSTACK_SECRET_KEY }
        );
        session.paymentReference = payment.reference;
        await sendText(phone, `Booking confirmed! 🎉\nAppointment ID: #${appointment.id}\n\nPay now to secure your slot:\n${payment.authorization_url}\n\nReference: ${payment.reference}`, tenantId);
      } catch (err) {
        const msg = err?.message || "Something went wrong.";
        await sendText(phone, `Booking failed: ${msg}\nPlease try again later.`, tenantId);
        await setSession(phone, { state: "idle", tenantId });
      }
      return;
    }
    if (["no", "n", "cancel"].includes(normalized)) {
      await sendText(phone, "Booking cancelled. Reply anytime to book again.", tenantId);
      await setSession(phone, { state: "idle", tenantId });
      return;
    }
    await sendText(phone, "Please reply 'yes' to confirm or 'no' to cancel.", tenantId);
    return;
  }

  if (session.state === "salon_payment") {
    await sendText(phone, "We will confirm your payment shortly. Reply 'status' to check.", tenantId);
    return;
  }

  if (session.state === "idle") {
    await startSalonAppointmentFlow(phone, tenantId);
    return;
  }
};

module.exports = {
  startSalonAppointmentFlow,
  handleSalonAppointmentState,
};
