import API from "./API";

const getRegistrationStatus = async () => {
  return await API.get("/auth/register/status");
};

const register = async (username, email, password, cfTurnstileToken) => {
  const payload = { username, email, password };
  if (cfTurnstileToken) {
    payload.cfTurnstileToken = cfTurnstileToken;
  }
  return await API.post("/auth/register", payload);
};

const login = async (email, password, cfTurnstileToken) => {
  const payload = { email, password };
  if (cfTurnstileToken) {
    payload.cfTurnstileToken = cfTurnstileToken;
  }
  return await API.post("/auth/login", payload);
};

const loginWithTOTP = async (tempToken, token) => {
  return await API.post("/auth/login-totp", { tempToken, token });
};

const getMe = async () => {
  return await API.get("/auth/me");
};

const getTenantCapabilities = async () => {
  return await API.get("/auth/tenant/capabilities");
};

const logout = async () => {
  return await API.post("/auth/logout");
};

const getSettings = async () => {
  return await API.get("/auth/settings");
};

const updateSettings = async (key, value) => {
  return await API.put("/auth/settings", { key, value });
};

const refreshToken = async () => {
  return await API.post("/auth/refresh-token");
};

const getStaff = async () => {
  return await API.get("/auth/staff");
};

const createStaff = async (staffData) => {
  return await API.post("/auth/staff", staffData);
};

const updateStaff = async (id, updates) => {
  return await API.patch("/auth/staff/" + id, updates);
};

const deleteStaff = async (id) => {
  return await API.delete("/auth/staff/" + id);
};

const getUsers = async () => {
  return await API.get("/auth/users");
};

const forgotPassword = async (email) => {
  return await API.post("/auth/forgot-password", { email });
};

const resetPassword = async (token, password) => {
  return await API.post("/auth/reset-password", { token, password });
};

const requestEmailVerification = async (email) => {
  return await API.post("/auth/verify-email/request", { email });
};

const verifyEmail = async (token) => {
  return await API.post("/auth/verify-email", { token });
};

const registerCustomer = async (
  email,
  password,
  firstName,
  lastName,
  phone,
  cfTurnstileToken,
  tenantSlug
) => {
  const payload = { email, password, firstName, lastName, phone };
  if (cfTurnstileToken) {
    payload.cfTurnstileToken = cfTurnstileToken;
  }
  if (tenantSlug) {
    payload.tenantSlug = tenantSlug;
  }
  return await API.post("/auth/register/customer", payload);
};

export default {
  getRegistrationStatus,
  register,
  login,
  loginWithTOTP,
  getMe,
  getTenantCapabilities,
  logout,
  getSettings,
  updateSettings,
  refreshToken,
  getStaff,
  getUsers,
  createStaff,
  updateStaff,
  deleteStaff,
  forgotPassword,
  resetPassword,
  requestEmailVerification,
  verifyEmail,
  registerCustomer,
};
