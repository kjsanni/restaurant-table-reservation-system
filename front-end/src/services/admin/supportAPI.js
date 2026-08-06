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

export const listFailedPaymentAlerts = (params = {}) => {
  return API.get(`/admin/payment-alerts${buildQueryString(params)}`);
};

export const retryFailedPayment = (id) => {
  return API.post(`/admin/payment-alerts/${id}/retry`);
};

export const resolveFailedPayment = (id) => {
  return API.post(`/admin/payment-alerts/${id}/resolve`);
};

export const listSupportConversations = (params = {}) => {
  return API.get(
    `/admin/support-chat/conversations${buildQueryString(params)}`
  );
};

export const getSupportConversation = (id) => {
  return API.get(`/admin/support-chat/conversations/${id}`);
};

export const createSupportConversation = (data) => {
  return API.post("/admin/support-chat/conversations", data);
};

export const updateSupportConversation = (id, data) => {
  return API.patch(`/admin/support-chat/conversations/${id}`, data);
};

export const listSupportMessages = (conversationId) => {
  return API.get(
    `/admin/support-chat/conversations/${conversationId}/messages`
  );
};

export const sendSupportMessage = (conversationId, body) => {
  return API.post(
    `/admin/support-chat/conversations/${conversationId}/messages`,
    { body }
  );
};

export const deleteSupportConversation = (id) => {
  return API.delete(`/admin/support-chat/conversations/${id}`);
};

export const autoAssignConversation = (id) => {
  return API.post(`/admin/support-chat/conversations/${id}/auto-assign`);
};

export const submitCsat = (id, data) => {
  return API.post(`/admin/support-chat/conversations/${id}/csat`, data);
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
