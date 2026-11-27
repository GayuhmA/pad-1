'use client';

import { useQuery } from '@tanstack/react-query';
import { getActiveLogo } from '@/lib/api/logo';
import { STALE_TIME } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

export const DEFAULT_LOGO_SRC = '/images/logo.png';

export function useActiveLogo() {
  const query = useQuery({
    queryKey: queryKeys.activeLogo,
    queryFn: ({ signal }) => getActiveLogo(signal).then((response) => response.data),
    staleTime: STALE_TIME.STATIC,
  });

  const activeLogo = query.data ?? null;
  return {
    activeLogo,
    logoUrl: activeLogo?.gambar ?? DEFAULT_LOGO_SRC,
    logoAlt: activeLogo?.nama_logo ?? 'Logo',
    isLoading: query.isLoading,
  };
}

