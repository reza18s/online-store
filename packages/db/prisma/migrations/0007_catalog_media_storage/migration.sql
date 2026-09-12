-- Preserve existing URL-backed media as LEGACY while adding the minimum
-- metadata needed to keep private originals separate from READY derivatives.
CREATE TYPE "ProductMediaStorageStatus" AS ENUM ('LEGACY', 'READY', 'QUARANTINED');

ALTER TABLE "ProductMedia"
ADD COLUMN "storageStatus" "ProductMediaStorageStatus" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN "originalKey" TEXT,
ADD COLUMN "derivativeKey" TEXT,
ADD COLUMN "contentType" TEXT,
ADD COLUMN "sizeBytes" INTEGER;

CREATE UNIQUE INDEX "ProductMedia_originalKey_key" ON "ProductMedia"("originalKey");
CREATE UNIQUE INDEX "ProductMedia_derivativeKey_key" ON "ProductMedia"("derivativeKey");
CREATE INDEX "ProductMedia_productId_storageStatus_sortOrder_idx"
ON "ProductMedia"("productId", "storageStatus", "sortOrder");
