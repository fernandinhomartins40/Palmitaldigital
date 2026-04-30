export enum UserRole {
  USER = 'USER',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  ADMIN = 'ADMIN',
}

export enum PostType {
  SOCIAL = 'SOCIAL',
  CLASSIFIED = 'CLASSIFIED',
  BUSINESS = 'BUSINESS',
  PROMOTION = 'PROMOTION',
}

export enum PromotionKind {
  PROFESSIONAL = 'PROFESSIONAL',
  COMPANY_PROFILE = 'COMPANY_PROFILE',
  COMPANY_PRODUCTS = 'COMPANY_PRODUCTS',
}

export enum ClassifiedStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}
