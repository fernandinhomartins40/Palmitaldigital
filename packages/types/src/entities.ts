import { ClassifiedStatus, MediaType, MessageStatus, PostType, PromotionKind, UserRole } from './enums';

export interface IUser {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: IProfile | null;
}

export interface IProfile {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompany {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  category?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPost {
  id: string;
  authorId: string;
  companyId?: string | null;
  type: PostType;
  content?: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: IUser;
  company?: ICompany | null;
  classified?: IClassified | null;
  promotion?: IPromotion | null;
  media?: IMedia[];
}

export interface IClassified {
  id: string;
  postId: string;
  authorId: string;
  title: string;
  description: string;
  price?: number | null;
  isFree: boolean;
  status: ClassifiedStatus;
  categoryId?: string | null;
  city?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPromotion {
  id: string;
  postId: string;
  kind: PromotionKind;
  headline: string;
  subtitle?: string | null;
  city?: string | null;
  serviceArea?: string | null;
  highlights: string[];
  createdAt: Date;
  updatedAt: Date;
  products?: IPromotionProduct[];
}

export interface IPromotionProduct {
  promotionId: string;
  productId: string;
  sortOrder: number;
  product?: IProduct;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  iconName?: string | null;
  parentId?: string | null;
}

export interface IMedia {
  id: string;
  postId?: string | null;
  uploaderId: string;
  url: string;
  type: MediaType;
  mimeType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  createdAt: Date;
}

export interface IConversation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants?: IConversationParticipant[];
  messages?: IMessage[];
}

export interface IConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt?: Date | null;
  user?: IUser;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  sender?: IUser;
}
