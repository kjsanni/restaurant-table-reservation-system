export const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const getApiErrors = (error) => {
  return error?.response?.data?.errors || null;
};

export const isApiError = (error) => {
  return error?.response && error?.response?.status >= 400;
};
