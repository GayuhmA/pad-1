import { apiFormRequest, apiRequest } from '@/lib/api/client';
import type {
  ActiveLogoResponse,
  LogoListResponse,
  LogoMutationResponse,
  LogoStatus,
} from '@/types/logo';

export function getActiveLogo(signal?: AbortSignal) {
  return apiRequest<ActiveLogoResponse>('/api/logo-aktif', { signal });
}

export function getManagementLogos(
  options?: { search?: string; status?: LogoStatus },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set('search', options.search.trim());
  if (options?.status) params.set('status', options.status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<LogoListResponse>(`/api/dashboard/logo${query}`, { signal });
}

export function createManagementLogo(formData: FormData) {
  return apiFormRequest<LogoMutationResponse>('/api/dashboard/logo', formData, {
    method: 'POST',
  });
}

export function updateManagementLogo(idLogo: number, formData: FormData) {
  return apiFormRequest<LogoMutationResponse>(
    `/api/dashboard/logo/${encodeURIComponent(idLogo)}`,
    formData,
    { method: 'POST' },
  );
}

export function activateManagementLogo(idLogo: number) {
  return apiRequest<LogoMutationResponse>(
    `/api/dashboard/logo/${encodeURIComponent(idLogo)}/aktif`,
    { method: 'PATCH' },
  );
}

export function deleteManagementLogo(idLogo: number) {
  return apiRequest<LogoMutationResponse>(
    `/api/dashboard/logo/${encodeURIComponent(idLogo)}`,
    { method: 'DELETE' },
  );
}

