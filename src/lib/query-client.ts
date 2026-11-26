import { QueryClient } from '@tanstack/react-query';
import { ApiRequestError } from '@/lib/api/client';

export const STALE_TIME = {
  /** Dynamic operational data (iuran, pendaftaran, pesan, notifikasi, dashboard). */
  DYNAMIC: 30_000,
  /** Moderate data (beranda, lomba, warga, akun). */
  MODERATE: 60_000,
  /** Rarely changing data (histori, album, pengaturan pembayaran). */
  STATIC: 5 * 60_000,
} as const;

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.MODERATE,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 1;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return createAppQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createAppQueryClient();
  }
  return browserQueryClient;
}

