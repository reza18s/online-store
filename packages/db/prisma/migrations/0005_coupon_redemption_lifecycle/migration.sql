-- CreateEnum
CREATE TYPE "PromotionRedemptionStatus" AS ENUM ('RESERVED', 'COMMITTED', 'RELEASED');

-- Add coupon configuration and optimistic-touch metadata.
ALTER TABLE "Coupon" ADD COLUMN "minimumOrderToman" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Coupon" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Coupon" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Coupon" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "Coupon" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Existing rows represent historical redemptions and must not become active reservations.
ALTER TABLE "PromotionRedemption"
  ADD COLUMN "status" "PromotionRedemptionStatus" NOT NULL DEFAULT 'COMMITTED',
  ADD COLUMN "reservedUntil" TIMESTAMP(3),
  ADD COLUMN "committedAt" TIMESTAMP(3),
  ADD COLUMN "releasedAt" TIMESTAMP(3);
ALTER TABLE "PromotionRedemption" ALTER COLUMN "status" SET DEFAULT 'RESERVED';
ALTER TABLE "PromotionRedemption" ALTER COLUMN "promotionId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PromotionRedemption_couponId_status_createdAt_idx"
  ON "PromotionRedemption"("couponId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PromotionRedemption_couponId_userId_status_idx"
  ON "PromotionRedemption"("couponId", "userId", "status");
