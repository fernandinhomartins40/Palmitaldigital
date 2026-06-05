import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@palmital/ui';
import { FeedCard } from '../../components/feed/FeedCard';
import { NewsArticleCard } from '../../components/feed/NewsArticleCard';
import { InfiniteList } from '../../components/shared/InfiniteList';
import { StoriesTray } from '../../components/stories/StoriesTray';
import { useFeed } from '../../hooks/useFeed';
import { newsApi, type Article } from '../../services/newsApi';

function useLatestArticles() {
  return useQuery({
    queryKey: ['feed-articles'],
    queryFn: () => newsApi.listFeedArticles(6).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

type FeedItem =
  | { id: string; type: 'post'; data: any }
  | { id: string; type: 'article'; data: Article };

// Intercala artigos de notícia entre posts a cada 4 itens
function buildMixedFeed(posts: any[], articles: Article[]): FeedItem[] {
  const result: FeedItem[] = [];
  let aIdx = 0;
  for (let i = 0; i < posts.length; i++) {
    result.push({ id: posts[i].id, type: 'post', data: posts[i] });
    if ((i + 1) % 4 === 0 && aIdx < articles.length) {
      result.push({ id: `article-${articles[aIdx].id}`, type: 'article', data: articles[aIdx++] });
    }
  }
  return result;
}

export function FeedPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
  const { data: articles = [] } = useLatestArticles();

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const mixed = buildMixedFeed(posts, articles);

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
        items={mixed}
        renderItem={(item) =>
          item.type === 'article'
            ? <NewsArticleCard article={item.data} />
            : <FeedCard post={item.data as any} />
        }
        hasNextPage={!!hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        emptyMessage="Nenhuma publicacao ainda. Seja o primeiro!"
      />
    </div>
  );
}
