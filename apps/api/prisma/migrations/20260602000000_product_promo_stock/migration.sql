-- Product promotion & stock fields

CREATE TYPE "ProductType" AS ENUM ('FIXED', 'PROMO');

ALTER TABLE "Product"
  ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'FIXED',
  ADD COLUMN "promoPrice"  DECIMAL(10,2),
  ADD COLUMN "stock"       INTEGER,
  ADD COLUMN "promoEndsAt" TIMESTAMP(3);

CREATE INDEX "Product_companyId_productType_idx" ON "Product"("companyId", "productType");
CREATE INDEX "Product_promoEndsAt_idx"           ON "Product"("promoEndsAt");
