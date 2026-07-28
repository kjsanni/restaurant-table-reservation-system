import API from "./API";

class LocaleAPI {
  getLocale() {
    return API.get("/auth/locale");
  }
  updateLocale(locale) {
    return API.put("/auth/locale", { locale });
  }
}

export default new LocaleAPI();
