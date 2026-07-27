import API from "./API";

class LocaleAPI {
  getLocale() {
    return API.get("/locale");
  }
  updateLocale(locale) {
    return API.put("/locale", { locale });
  }
}

export default new LocaleAPI();
