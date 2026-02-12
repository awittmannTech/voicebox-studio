import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useServerStore } from '@/stores/serverStore';

export function useServerHealth(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) {
  const serverUrl = useServerStore((state) => state.serverUrl);

  return useQuery({
    queryKey: ['server', 'health', serverUrl],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: options?.refetchInterval ?? 30000, // Default 30s
    enabled: options?.enabled ?? true,
    retry: 1,
  });
}
