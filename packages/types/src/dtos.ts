import { ClassifiedStatus, PostType } from './enums';

// Auth
export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
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
    profile?: { displayName: string; avatarUrl?: string | null } | null;
  };
}

// Posts
export interface CreatePostDto {
  type: PostType;
  content?: string;
  mediaIds?: string[];
  classified?: {
    title: string;
    description: string;
    price?: number;
    isFree?: boolean;
    categoryId?: string;
    city?: string;
  };
}

export interface FeedQueryDto {
  cursor?: string;
  limit?: number;
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
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
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
