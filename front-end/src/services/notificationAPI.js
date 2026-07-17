import API from "./API";

class NotificationAPI {
  sendTestEmail(to) {
    return API.post("/notifications/email/test", { to });
  }
  sendEmail(payload) {
    return API.post("/notifications/email", payload);
  }
  sendTemplate(templateType, to, data) {
    return API.post("/notifications/email/template", {
      templateType,
      to,
      data,
    });
  }
  getTemplates() {
    return API.get("/notifications/templates");
  }
  sendTestWhatsApp(to, message) {
    return API.post("/notifications/whatsapp/test", { to, message });
  }
  sendTestEmail(to) {
    return API.post("/notifications/email/test", { to });
  }
  getPaystackWebhookInfo() {
    return API.get("/notifications/paystack/webhook-info");
  }
}

export default new NotificationAPI();
