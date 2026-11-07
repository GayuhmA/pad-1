import type { LoginRequest, LogoutResponse, SessionResponse } from '@/types/auth';
import { apiRequest } from './client';

export function login(credentials: LoginRequest): Promise<SessionResponse> {
  return apiRequest('/api/auth/login', { method: 'POST', body: credentials });
}

export function logout(): Promise<LogoutResponse> {
  return apiRequest('/api/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<SessionResponse> {
  return apiRequest('/api/auth/me');
}
