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

const getAllTemplates = () => {
  return API.get("/rbac/permission-templates");
};

const getTemplate = (id) => {
  return API.get("/rbac/permission-templates/" + id);
};

const createTemplate = (templateData) => {
  return API.post("/rbac/permission-templates", templateData);
};

const updateTemplate = (id, templateData) => {
  return API.patch("/rbac/permission-templates/" + id, templateData);
};

const deleteTemplate = (id) => {
  return API.delete("/rbac/permission-templates/" + id);
};

export default {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
