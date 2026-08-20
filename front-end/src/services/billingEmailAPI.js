import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/billing-emails`);

export const sendPaymentReminder = (tenantIds) =>
  client.post("/payment-reminder", { tenantIds });
export const sendSuspensionNotice = (tenantIds) =>
  client.post("/suspension-notice", { tenantIds });
export const sendTrialExpiry = (tenantIds) =>
  client.post("/trial-expiry", { tenantIds });

export default { sendPaymentReminder, sendSuspensionNotice, sendTrialExpiry };
