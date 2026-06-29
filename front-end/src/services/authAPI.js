import API from "./API";

const getRegistrationStatus = async () => {
  return await API.get("/auth/register/status");
};

const register = async (username, email, password) => {
  return await API.post("/auth/register", { username, email, password });
};

const login = async (email, password) => {
  return await API.post("/auth/login", { email, password });
};

const getMe = async () => {
  return await API.get("/auth/me");
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

export default {
  getRegistrationStatus,
  register,
  login,
  getMe,
  logout,
  getSettings,
  updateSettings,
  getStaff,
  getUsers,
  createStaff,
  updateStaff,
  deleteStaff,
};
