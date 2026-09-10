-- Make notification producers idempotent across callback and transaction retries.
ALTER TABLE "NotificationJob" ADD COLUMN "dedupeKey" TEXT;

UPDATE "NotificationJob"
SET "dedupeKey" = 'legacy:' || "id"
WHERE "dedupeKey" IS NULL;

ALTER TABLE "NotificationJob" ALTER COLUMN "dedupeKey" SET NOT NULL;

CREATE UNIQUE INDEX "NotificationJob_dedupeKey_key" ON "NotificationJob"("dedupeKey");
