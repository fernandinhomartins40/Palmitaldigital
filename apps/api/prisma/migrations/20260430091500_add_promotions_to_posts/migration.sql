ALTER TYPE "PostType" ADD VALUE 'PROMOTION';

CREATE TYPE "PromotionKind" AS ENUM ('PROFESSIONAL', 'COMPANY_PROFILE', 'COMPANY_PRODUCTS');

CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "kind" "PromotionKind" NOT NULL,
    "headline" TEXT NOT NULL,
    "subtitle" TEXT,
    "city" TEXT,
    "serviceArea" TEXT,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromotionProduct" (
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PromotionProduct_pkey" PRIMARY KEY ("promotionId","productId")
);

CREATE UNIQUE INDEX "Promotion_postId_key" ON "Promotion"("postId");
CREATE INDEX "Promotion_kind_idx" ON "Promotion"("kind");
CREATE INDEX "PromotionProduct_productId_idx" ON "PromotionProduct"("productId");

ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
