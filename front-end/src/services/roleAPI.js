import API from "./API";

const getAllRoles = () => {
  return API.get("/rbac/roles");
};

const getRole = (id) => {
  return API.get("/rbac/roles/" + id);
};

const createRole = (roleData) => {
  return API.post("/rbac/roles", roleData);
};

const updateRole = (id, roleData) => {
  return API.patch("/rbac/roles/" + id, roleData);
};

const deleteRole = (id) => {
  return API.delete("/rbac/roles/" + id);
};

export default {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
