import { apiRequest } from '@/lib/api/client';
import type {
  DeleteMessageResponse,
  MessageListResponse,
  MessageMutationResponse,
  MessageStatus,
  SaveMessageInput,
} from '@/types/management-pesan';

export function getManagementMessages(
  options?: { status?: string; search?: string },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (options?.status && options.status !== 'all') params.set('status', options.status);
  if (options?.search?.trim()) params.set('search', options.search.trim());
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<MessageListResponse>(`/api/dashboard/pesan${query}`, { signal });
}

export function getManagementMessageDetail(id: string, signal?: AbortSignal) {
  return apiRequest<MessageMutationResponse>(
    `/api/dashboard/pesan/${encodeURIComponent(id)}`,
    { signal },
  );
}

export function createManagementMessage(
  input: SaveMessageInput & { status?: MessageStatus },
) {
  return apiRequest<MessageMutationResponse>('/api/dashboard/pesan', {
    method: 'POST',
    body: input,
  });
}

export function updateManagementMessage(id: string, input: SaveMessageInput) {
  return apiRequest<MessageMutationResponse>(
    `/api/dashboard/pesan/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: input,
    },
  );
}

export function deleteManagementMessage(id: string) {
  return apiRequest<DeleteMessageResponse>(
    `/api/dashboard/pesan/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );
}

export function sendManagementMessage(id: string) {
  return apiRequest<MessageMutationResponse>(
    `/api/dashboard/pesan/${encodeURIComponent(id)}/kirim`,
    {
      method: 'PATCH',
    },
  );
}

