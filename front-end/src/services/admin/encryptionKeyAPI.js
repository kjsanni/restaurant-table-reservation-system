import API from "../API";

export const listEncryptionKeys = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, value);
    }
  });
  const query = qs.toString();
  return API.get(`/admin/encryption-keys${query ? `?${query}` : ""}`);
};

export const getEncryptionKey = (id) => {
  return API.get(`/admin/encryption-keys/${id}`);
};

export const createEncryptionKey = (data) => {
  return API.post("/admin/encryption-keys", data);
};

export const updateEncryptionKey = (id, data) => {
  return API.patch(`/admin/encryption-keys/${id}`, data);
};

export const rotateEncryptionKey = (id) => {
  return API.post(`/admin/encryption-keys/${id}/rotate`);
};

export const retireEncryptionKey = (id) => {
  return API.post(`/admin/encryption-keys/${id}/retire`);
};

export const deleteEncryptionKey = (id) => {
  return API.delete(`/admin/encryption-keys/${id}`);
};

export default {
  listEncryptionKeys,
  getEncryptionKey,
  createEncryptionKey,
  updateEncryptionKey,
  rotateEncryptionKey,
  retireEncryptionKey,
  deleteEncryptionKey,
};
