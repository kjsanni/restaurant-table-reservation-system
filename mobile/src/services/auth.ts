import api from './api';

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    role: string;
    name?: string;
    permissions?: Record<string, boolean>;
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function logout() {
  const res = await api.post('/auth/logout');
  return res.data;
}
