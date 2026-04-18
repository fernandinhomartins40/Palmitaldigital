import { IPost, PostType } from '@palmital/types';
import { SocialCard } from './SocialCard';
import { ClassifiedCard } from './ClassifiedCard';
import { BusinessCard } from './BusinessCard';

interface FeedCardProps {
  post: IPost & { author: any; company: any; classified: any; media: any[] };
}

export function FeedCard({ post }: FeedCardProps) {
  if (post.type === PostType.CLASSIFIED) return <ClassifiedCard post={post} />;
  if (post.type === PostType.BUSINESS) return <BusinessCard post={post} />;
  return <SocialCard post={post} />;
}
