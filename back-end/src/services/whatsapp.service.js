const axios = require("axios");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_BASE_URL = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`;

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
  console.warn("WhatsApp credentials not configured. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID.");
}

const sendWhatsAppMessage = async (to, templateName, languageCode = "en_US", components = []) => {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp is not configured.");
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formatPhoneNumber(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  try {
    const response = await axios.post(
      `${WHATSAPP_BASE_URL}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    throw new Error(`WhatsApp send failed: ${message}`);
  }
};

const sendWhatsAppText = async (to, text) => {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp is not configured.");
  }

  const payload = {
    messaging_product: "whatsapp",
    to: formatPhoneNumber(to),
    type: "text",
    text: { body: text },
  };

  try {
    const response = await axios.post(
      `${WHATSAPP_BASE_URL}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    throw new Error(`WhatsApp send failed: ${message}`);
  }
};

const formatPhoneNumber = (phone) => {
  if (!phone && phone !== "") return null;
  let cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith("233") && cleaned.length === 9) {
    cleaned = "233" + cleaned;
  }
  return cleaned || null;
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppText,
  formatPhoneNumber,
};
