const authDAO = require("../DAOs/auth.dao");

const formatMoney = async (amount, tenantId) => {
  const config = await authDAO.getSettingValue(
    "currency_locale",
    { currency: "GHS", locale: "en-GH" },
    tenantId
  );
  const currency = config?.currency || "GHS";
  const locale = config?.locale || "en-GH";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

module.exports = {
  formatMoney,
};
