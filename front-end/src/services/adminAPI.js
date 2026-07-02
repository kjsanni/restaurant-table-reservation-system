import API from "./API";

const emailLogs = () => {
  return API.post("/admin/logs/email");
};

export default {
  emailLogs,
};
