import api from './api';

export interface Reservation {
  id: number;
  customerName: string;
  phone?: string;
  date: string;
  time: string;
  people: number;
  status: string;
  paymentStatus?: string;
  tableId?: number | null;
  notes?: string;
}

export async function getReservations(params?: Record<string, string | number>) {
  const res = await api.get('/reservations', { params });
  return res.data;
}

export async function updateReservationStatus(id: number, status: string) {
  const res = await api.patch(`/reservations/${id}/status`, { status });
  return res.data;
}
