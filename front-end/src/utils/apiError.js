export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  const data = error?.response?.data;

  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors)
      .flat()
      .filter(Boolean)
      .slice(0, 3)
      .join("; ");
    if (messages) return messages;
  }

  return data?.message || error?.message || fallback;
};

export const getApiErrors = (error) => {
  return error?.response?.data?.errors || null;
};

export const isApiError = (error) => {
  return error?.response && error?.response?.status >= 400;
};
