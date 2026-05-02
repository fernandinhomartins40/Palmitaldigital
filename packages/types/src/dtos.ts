import { ClassifiedStatus, PostReactionType, PostType, PromotionKind } from './enums';

// Auth
export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
  username?: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    profile?: {
      displayName: string;
      username: string;
      avatarUrl?: string | null;
      coverUrl?: string | null;
    } | null;
  };
}

// Posts
export interface CreatePostDto {
  type: PostType;
  content?: string;
  mediaIds?: string[];
  companyId?: string;
  classified?: {
    title: string;
    description: string;
    price?: number;
    isFree?: boolean;
    categoryId?: string;
    city?: string;
  };
  promotion?: {
    kind: PromotionKind;
    headline: string;
    subtitle?: string;
    city?: string;
    serviceArea?: string;
    highlights?: string[];
    productIds?: string[];
  };
}

export interface FeedQueryDto {
  cursor?: string;
  limit?: number;
}

export interface ReactToPostDto {
  type?: PostReactionType;
}

export interface CreatePostCommentDto {
  content: string;
}

export interface SharePostDto {
  target?: string;
}

export interface CreateStoryDto {
  mediaId: string;
  caption?: string;
}

// Classifieds
export interface ClassifiedFilters {
  categoryId?: string;
  city?: string;
  status?: ClassifiedStatus;
  cursor?: string;
  limit?: number;
}

export interface UpdateClassifiedStatusDto {
  status: ClassifiedStatus;
}

// Companies
export interface CreateCompanyDto {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  category?: string;
  isActive?: boolean;
}

export interface UpdateCompanyDto extends CreateCompanyDto {
  isActive?: boolean;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
}

// Chat
export interface CreateConversationDto {
  recipientId: string;
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
}

// WS Events
export interface WsJoinConversationDto {
  conversationId: string;
}

export interface WsMarkReadDto {
  conversationId: string;
}
