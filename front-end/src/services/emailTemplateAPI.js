import API from "./API";

class EmailTemplateAPI {
  getAll() {
    return API.get("/email-templates");
  }
  getById(id) {
    return API.get("/email-templates/" + id);
  }
  create(data) {
    return API.post("/email-templates", data);
  }
  update(id, data) {
    return API.patch("/email-templates/" + id, data);
  }
  delete(id) {
    return API.delete("/email-templates/" + id);
  }
}

export default new EmailTemplateAPI();
