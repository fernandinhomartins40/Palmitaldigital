import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useUserFeed(userId?: string) {
  return useInfiniteQuery({
    queryKey: ['user-feed', userId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, any> = { limit: 20 };
      if (pageParam) params.cursor = pageParam;
      const { data } = await api.get(`/posts/user/${userId}`, { params });
      return data as { posts: any[]; nextCursor: string | null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!userId,
  });
}
