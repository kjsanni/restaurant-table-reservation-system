const DEFAULT_DATE_LOCALE = "en-US";

export const formatDate = (date: unknown): string => {
  if (!date) return "—";
  const d = new Date(date as string | number | Date);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleDateString(DEFAULT_DATE_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

export const formatDateTime = (date: unknown): string => {
  if (!date) return "—";
  const d = new Date(date as string | number | Date);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString(DEFAULT_DATE_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString().replace("T", " ").slice(0, 19);
  }
};

export const formatTime = (date: unknown): string => {
  if (!date) return "—";
  const d = new Date(date as string | number | Date);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleTimeString(DEFAULT_DATE_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString().slice(11, 16);
  }
};
