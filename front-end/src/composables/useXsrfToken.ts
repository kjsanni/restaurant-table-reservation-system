import { getCsrfToken } from "@/utils/csrf";

export async function getXsrfToken(): Promise<string> {
  const token = await getCsrfToken();
  return token || "";
}
