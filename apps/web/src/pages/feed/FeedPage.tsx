import { Spinner } from '@palmital/ui';
import { FeedCard } from '../../components/feed/FeedCard';
import { InfiniteList } from '../../components/shared/InfiniteList';
import { StoriesTray } from '../../components/stories/StoriesTray';
import { useFeed } from '../../hooks/useFeed';

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
    <div className="space-y-5">
      <StoriesTray />
      <InfiniteList
        items={posts}
        renderItem={(post) => <FeedCard post={post as any} />}
        hasNextPage={!!hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        emptyMessage="Nenhuma publicacao ainda. Seja o primeiro!"
      />
    </div>
  );
}
