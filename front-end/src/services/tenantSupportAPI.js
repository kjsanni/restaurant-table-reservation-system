import API from "./API";

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

export const listMyTickets = (params = {}) => {
  return API.get(
    `/admin/support-tickets/tenant/tickets${buildQueryString(params)}`
  );
};

export const getMyTicket = (id) => {
  return API.get(`/admin/support-tickets/tenant/tickets/${id}`);
};

export const createTicket = (data) => {
  return API.post("/admin/support-tickets/tenant/tickets", data);
};

export const updateMyTicket = (id, data) => {
  return API.patch(`/admin/support-tickets/tenant/tickets/${id}`, data);
};

export const listTicketMessages = (ticketId) => {
  return API.get(`/admin/support-tickets/tenant/tickets/${ticketId}/messages`);
};

export const sendTicketMessage = (ticketId, body) => {
  return API.post(
    `/admin/support-tickets/tenant/tickets/${ticketId}/messages`,
    { body }
  );
};

export const listSupportAttachments = (ticketId) => {
  return API.get(
    `/admin/support-tickets/tenant/attachments${ticketId ? `?ticketId=${ticketId}` : ""}`
  );
};

export const createSupportAttachment = (data) => {
  return API.post("/admin/support-tickets/tenant/attachments", data);
};

export const deleteSupportAttachment = (id) => {
  return API.delete(`/admin/support-tickets/tenant/attachments/${id}`);
};

export default {
  listMyTickets,
  getMyTicket,
  createTicket,
  updateMyTicket,
  listTicketMessages,
  sendTicketMessage,
  listSupportAttachments,
  createSupportAttachment,
  deleteSupportAttachment,
};
