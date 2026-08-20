import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

export const listNotes = (tenantId) => client.get(`/${tenantId}/notes`);
export const createNote = (tenantId, note) =>
  client.post(`/${tenantId}/notes`, { note });
export const deleteNote = (tenantId, noteId) =>
  client.delete(`/${tenantId}/notes/${noteId}`);

export default { listNotes, createNote, deleteNote };
