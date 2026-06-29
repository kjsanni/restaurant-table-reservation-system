import API from "./API";

const getAllGroups = () => {
  return API.get("/rbac/groups");
};

const getGroup = (id) => {
  return API.get("/rbac/groups/" + id);
};

const getGroupByName = (name) => {
  return API.get("/rbac/groups/name/" + encodeURIComponent(name));
};

const createGroup = (groupData) => {
  return API.post("/rbac/groups", groupData);
};

const updateGroup = (id, groupData) => {
  return API.patch("/rbac/groups/" + id, groupData);
};

const deleteGroup = (id) => {
  return API.delete("/rbac/groups/" + id);
};

const addUserToGroup = (groupId, userId) => {
  return API.post("/rbac/groups/" + groupId + "/users", { userId });
};

const removeUserFromGroup = (groupId, userId) => {
  return API.delete("/rbac/groups/" + groupId + "/users/" + userId);
};

export default {
  getAllGroups,
  getGroup,
  getGroupByName,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
};
