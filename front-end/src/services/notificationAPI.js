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
}

export default new NotificationAPI();
