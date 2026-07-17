const formatMoney = (
  amount: number | string | null | undefined,
  options?: { currency?: string; locale?: string }
): string => {
  const currency = options?.currency || "GHS";
  const locale = options?.locale || "en-GH";
  const value = Number(amount);
  if (Number.isNaN(value)) return "";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

export default formatMoney;
