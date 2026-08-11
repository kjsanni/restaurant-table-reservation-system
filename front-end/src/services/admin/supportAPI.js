import API from "../API";

export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

export const listSupportTickets = (params = {}) => {
  return API.get(`/admin/support-tickets${buildQueryString(params)}`);
};

export const getSupportTicket = (id) => {
  return API.get(`/admin/support-tickets/${id}`);
};

export const createSupportTicket = (data) => {
  return API.post("/admin/support-tickets", data);
};

export const updateSupportTicket = (id, data) => {
  return API.patch(`/admin/support-tickets/${id}`, data);
};

export const deleteSupportTicket = (id) => {
  return API.delete(`/admin/support-tickets/${id}`);
};

export const listTicketMessages = (ticketId) => {
  return API.get(`/admin/support-tickets/${ticketId}/messages`);
};

export const sendTicketMessage = (ticketId, body) => {
  return API.post(`/admin/support-tickets/${ticketId}/messages`, { body });
};

export const autoAssignTicket = (ticketId) => {
  return API.post(`/admin/support-tickets/${ticketId}/auto-assign`);
};

export const listFailedPaymentAlerts = (params = {}) => {
  return API.get(`/admin/payment-alerts${buildQueryString(params)}`);
};

export const retryFailedPayment = (id) => {
  return API.post(`/admin/payment-alerts/${id}/retry`);
};

export const resolveFailedPayment = (id) => {
  return API.post(`/admin/payment-alerts/${id}/resolve`);
};

export const listSupportNotes = (conversationId, ticketId) => {
  const qs = [];
  if (conversationId) qs.push(`conversationId=${conversationId}`);
  if (ticketId) qs.push(`ticketId=${ticketId}`);
  return API.get(`/admin/support-notes${qs.length ? `?${qs.join("&")}` : ""}`);
};

export const createSupportNote = (data) => {
  return API.post("/admin/support-notes", data);
};

export const deleteSupportNote = (id) => {
  return API.delete(`/admin/support-notes/${id}`);
};

export const listSupportAttachments = (conversationId, ticketId) => {
  const qs = [];
  if (conversationId) qs.push(`conversationId=${conversationId}`);
  if (ticketId) qs.push(`ticketId=${ticketId}`);
  return API.get(
    `/admin/support-attachments${qs.length ? `?${qs.join("&")}` : ""}`
  );
};

export const createSupportAttachment = (data) => {
  return API.post("/admin/support-attachments", data);
};

export const deleteSupportAttachment = (id) => {
  return API.delete(`/admin/support-attachments/${id}`);
};

export const listSupportTemplates = () => {
  return API.get("/admin/support-templates");
};

export const createSupportTemplate = (data) => {
  return API.post("/admin/support-templates", data);
};

export const updateSupportTemplate = (id, data) => {
  return API.patch(`/admin/support-templates/${id}`, data);
};

export const deleteSupportTemplate = (id) => {
  return API.delete(`/admin/support-templates/${id}`);
};

export const getWhatsAppSupportTicketAnalytics = (params = {}) => {
  return API.get("/admin/support-tickets/whatsapp/analytics", { params });
};
