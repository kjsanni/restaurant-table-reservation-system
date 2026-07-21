import api from './api';

export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: string;
  isBlocked?: boolean;
  users?: Array<{ id: number; name: string }>;
  reservationId?: number | null;
}

export async function getTables(): Promise<{ success: boolean; tables?: Table[] }> {
  const res = await api.get('/tables');
  return res.data;
}

export async function getTableStaff() {
  const res = await api.get('/tables/staff');
  return res.data;
}

export async function freeTable(tableId: number) {
  const res = await api.post(`/tables/${tableId}/free`);
  return res.data;
}

export async function blockTable(tableId: number) {
  const res = await api.patch(`/tables/${tableId}/block`);
  return res.data;
}

export async function unblockTable(tableId: number) {
  const res = await api.patch(`/tables/${tableId}/unblock`);
  return res.data;
}
