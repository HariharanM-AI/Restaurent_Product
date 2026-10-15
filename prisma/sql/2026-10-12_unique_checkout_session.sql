-- One stamp per single-use checkout QR (defense-in-depth for the claim race).
-- Equivalent to `npx prisma db push` for the @unique added to
-- LoyaltyStampTransaction.checkoutSessionId. Verified 2026-10-12: no duplicate rows exist.
CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyStampTransaction_checkoutSessionId_key"
  ON "LoyaltyStampTransaction" ("checkoutSessionId");
