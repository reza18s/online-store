-- Keep persisted redirects aligned with the public SEO contract.
ALTER TABLE "Redirect"
ADD CONSTRAINT "Redirect_statusCode_check"
CHECK ("statusCode" IN (301, 302, 307, 308));
