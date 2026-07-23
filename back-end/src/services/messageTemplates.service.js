"use strict";

const authDAO = require("../DAOs/auth.dao");

const DEFAULT_TEMPLATES = {
  welcome:
    "Welcome! What would you like to do?\n\n" +
    "1. Make a reservation\n" +
    "2. Order delivery\n" +
    "3. Check order status\n" +
    "4. Talk to someone\n\n" +
    "Reply with the number or type 'menu' to browse.",
  reservation_start: "Great! Let's book a table.\nWhat date? (e.g. {{today}} or 'tomorrow')",
  reservation_date_invalid: "I couldn't understand that date. Try 'tomorrow' or a date like {{today}}.",
  reservation_date_ok: "Got it: {{resDate}}\nWhat time? (e.g. 7:00 PM or 19:00)",
  reservation_time_invalid: "I couldn't understand that time. Try '7pm' or '19:00'.",
  reservation_time_ok: "Got it: {{resTime}}\nHow many people?",
  reservation_people_invalid: "Please reply with a number (1 or more).",
  reservation_people_ok: "Any special requests or notes? (Type 'skip' if none)",
  reservation_confirm:
    "Here's your reservation summary:\n" +
    "{{resDate}} at {{resTime}}\n" +
    "{{people}} people\n" +
    "{{notes}}Confirm? (yes/no)",
  reservation_confirmed: "Confirmed! Reservation #{{reservationId}}.\nSee you {{resDate}} at {{resTime}}.",
  reservation_failed: "Could not create reservation: {{errorMessage}}\nPlease try again or type 'cancel'.",
  reservation_cancelled: "Reservation cancelled. Type 'hi' to start again.",
  delivery_start:
    "Great! Let's set up your delivery.\nBrowse our menu:\n\n{{menuCategories}}\n\nReply with the number to browse items.",
  delivery_location_prompt:
    "Where should we deliver?\nShare your location (attachment -> Location)\nor type your address.",
  delivery_location_received: "Got it!\n{{address}}\n\nConfirm delivery address? (yes/no)",
  delivery_location_shared: "Got your location!\n{{address}}\n\nConfirm delivery address? (yes/no)",
  delivery_location_retry:
    "I couldn't find that address. Please share your location via the attachment, or try a different address.",
  delivery_order_created:
    "Order #{{orderId}} created!\nPay here: {{paymentLink}}\n\nYou'll receive a tracking number once payment is confirmed.",
  delivery_payment_pending:
    "Your order is awaiting payment. Please complete the payment link sent earlier.\nType 'cancel' to abort.",
  delivery_tracking:
    "Your order is on the way!\nTracking: {{trackingNumber}}\nYou'll receive status updates here.",
  no_orders: "No orders found.",
  order_status: "Order #{{orderId}}: {{status}} | Payment: {{paymentStatus}}",
  order_created: "Order #{{orderId}} created!\nPay here: {{paymentLink}}\n\nYou'll receive confirmation once paid.",
  session_cleared: "Session cleared. Send 'hi' anytime to start again.",
  agent_handoff:
    "A staff member will reach out to you shortly. For urgent matters, please call the restaurant directly.",
  unrecognized: "I didn't understand that. Reply 'hi' for the main menu or 'menu' to browse.",
  service_unavailable: "Sorry, this service is not configured. Please contact the restaurant directly.",
  salon_appointment_reminder:
    "Reminder: {{name}}, you have an appointment at {{salonName}} today at {{time}} for {{duration}} mins ({{service}}).\nReply 'cancel' to cancel.",
};

let templateCache = {};
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60000;

const loadTemplates = async (tenantId) => {
  const now = Date.now();
  const cacheKey = String(tenantId || "global");

  if (templateCache[cacheKey] && now - cacheLoadedAt < CACHE_TTL_MS) {
    return templateCache[cacheKey];
  }

  let customTemplates = {};
  try {
    const stored = await authDAO.getSettingValue("whatsapp_message_templates", null, tenantId);
    if (stored && typeof stored === "object") {
      customTemplates = stored;
    } else if (typeof stored === "string") {
      customTemplates = JSON.parse(stored);
    }
  } catch (err) {
    // fall back to defaults
  }

  const merged = { ...DEFAULT_TEMPLATES, ...customTemplates };
  const safeKey = ["__proto__", "constructor", "prototype"].includes(cacheKey) ? null : cacheKey;
  if (safeKey) {
    templateCache[safeKey] = merged;
  }
  cacheLoadedAt = now;
  return merged;
};

const substitute = (template, variables = {}) => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    result = result.replace(regex, String(value ?? ""));
  }
  result = result.replace(/\{\{\s*\w+\s*\}\}/g, "");
  return result;
};

const render = async (templateName, variables = {}, tenantId = null) => {
  const templates = await loadTemplates(tenantId);
  const template = templates[templateName] || DEFAULT_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown message template: ${templateName}`);
  }
  return substitute(template, variables);
};

const invalidateCache = () => {
  templateCache = {};
  cacheLoadedAt = 0;
};

module.exports = {
  render,
  loadTemplates,
  substitute,
  invalidateCache,
  DEFAULT_TEMPLATES,
};
