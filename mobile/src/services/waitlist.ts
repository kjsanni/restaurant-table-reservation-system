import api from './api';

export interface WaitlistEntry {
  id: number;
  customerName: string;
  phone?: string;
  partySize: number;
  status: string;
  estimatedWaitMins?: number;
  createdAt: string;
}

export async function getWaitlist() {
  const res = await api.get('/waitlist');
  return res.data;
}

export async function offerTable(waitlistId: number, tableId: number) {
  const res = await api.post(`/waitlist/${waitlistId}/offer`, { tableId });
  return res.data;
}

export async function updateWaitlistStatus(id: number, status: string) {
  const res = await api.patch(`/waitlist/${id}`, { status });
  return res.data;
}
