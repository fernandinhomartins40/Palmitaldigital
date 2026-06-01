-- Company storefront: sell modes, product categories/featured, and company orders

-- CreateEnum
CREATE TYPE "StoreSellMode" AS ENUM ('CONTACT', 'CART', 'BOTH');
CREATE TYPE "CompanyOrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- AlterTable: Company storefront fields
ALTER TABLE "Company" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Company" ADD COLUMN "sellMode" "StoreSellMode" NOT NULL DEFAULT 'CONTACT';
ALTER TABLE "Company" ADD COLUMN "pixKey" TEXT;
ALTER TABLE "Company" ADD COLUMN "pixKeyType" TEXT;

-- AlterTable: Product storefront fields
ALTER TABLE "Product" ADD COLUMN "category" TEXT;
ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: CompanyOrder
CREATE TABLE "CompanyOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "CompanyOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "notes" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'PIX_MANUAL',
    "cancelReason" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CompanyOrderItem
CREATE TABLE "CompanyOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "CompanyOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_companyId_category_idx" ON "Product"("companyId", "category");
CREATE INDEX "CompanyOrder_companyId_status_idx" ON "CompanyOrder"("companyId", "status");
CREATE INDEX "CompanyOrder_customerId_idx" ON "CompanyOrder"("customerId");
CREATE INDEX "CompanyOrder_createdAt_idx" ON "CompanyOrder"("createdAt" DESC);
CREATE INDEX "CompanyOrderItem_orderId_idx" ON "CompanyOrderItem"("orderId");

-- AddForeignKey
ALTER TABLE "CompanyOrder" ADD CONSTRAINT "CompanyOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompanyOrder" ADD CONSTRAINT "CompanyOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompanyOrderItem" ADD CONSTRAINT "CompanyOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CompanyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyOrderItem" ADD CONSTRAINT "CompanyOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
