import API from "./API";

class WebhookAPI {
  list() {
    return API.get("/webhooks");
  }
  update(subscriptions) {
    return API.put("/webhooks", { subscriptions });
  }
  test(payload) {
    return API.post("/webhooks/test", payload);
  }
}

export default new WebhookAPI();
