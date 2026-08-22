import axios from "axios";

let csrfToken: string | null = null;
let fetchPromise: Promise<string> | null = null;

export const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;
  if (fetchPromise) return fetchPromise;

  fetchPromise = axios
    .get("/api/v1/csrf-token", { withCredentials: true })
    .then((response) => {
      csrfToken = response.data?.token || null;
      return csrfToken;
    })
    .catch((error) => {
      fetchPromise = null;
      throw error;
    });

  return fetchPromise;
};

export const resetCsrfToken = () => {
  csrfToken = null;
  fetchPromise = null;
};
