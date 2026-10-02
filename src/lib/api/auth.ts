import type { LoginRequest, LoginResponse, LogoutResponse, MeResponse } from '@/types/auth';
import { apiRequest } from './client';

/**
 * POST /api/auth/login
 */
export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

/**
 * POST /api/auth/logout
 */
export function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/api/auth/logout', {
    method: 'POST',
    authenticated: true,
  });
}

/**
 * GET /api/auth/me
 */
export function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/api/auth/me', {
    method: 'GET',
    authenticated: true,
  });
}
