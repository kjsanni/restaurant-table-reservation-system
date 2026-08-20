import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

// Current versions of each legal document. Bump a value here when that
// document's content changes so tenants are re-required to accept it.
export const LEGAL_DOCUMENT_VERSIONS = {
  tenant: "2026-07-20",
  dpa: "2026-07-20",
  privacy: "2026-07-20",
  terms: "2026-07-20",
  "payment-refund": "2026-07-20",
  customer: "2026-07-20",
  cookies: "2026-07-20",
  gdpr: "2026-07-20",
  accessibility: "2026-07-20",
};

export const getAcceptances = (tenantId) =>
  client.get(`/${tenantId}/legal-acceptances`);

export const acceptDocument = (tenantId, slug) =>
  client.post(`/${tenantId}/legal-acceptances`, { slug });

export default { getAcceptances, acceptDocument, LEGAL_DOCUMENT_VERSIONS };
