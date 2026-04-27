import { Spinner } from '@palmital/ui';
import { useFeed } from '../../hooks/useFeed';
import { FeedCard } from '../../components/feed/FeedCard';
import { InfiniteList } from '../../components/shared/InfiniteList';

export function FeedPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <InfiniteList
      items={posts}
      renderItem={(post) => <FeedCard post={post as any} />}
      hasNextPage={!!hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      emptyMessage="Nenhuma publicação ainda. Seja o primeiro!"
    />
  );
}
