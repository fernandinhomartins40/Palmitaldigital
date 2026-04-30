import { IPost, PostType } from '@palmital/types';
import { SocialCard } from './SocialCard';
import { ClassifiedCard } from './ClassifiedCard';
import { BusinessCard } from './BusinessCard';
import { PromotionCard } from './PromotionCard';

interface FeedCardProps {
  post: IPost & { author: any; company: any; classified: any; media: any[] };
}

export function FeedCard({ post }: FeedCardProps) {
  if (post.type === PostType.CLASSIFIED) return <ClassifiedCard post={post} />;
  if (post.type === PostType.BUSINESS) return <BusinessCard post={post} />;
  if (post.type === PostType.PROMOTION) return <PromotionCard post={post} />;
  return <SocialCard post={post} />;
}
