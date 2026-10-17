-- Per-cafe customer numbers (#1, #2, #3 ...) shown to admins instead of the wallet's browser UUID.
-- A trigger assigns the number on insert, so every code path (and older deployments) gets one.
-- `prisma db push` does not manage triggers: run this once per database (safe to re-run).
BEGIN;

ALTER TABLE "LoyaltyWallet" ADD COLUMN IF NOT EXISTS "customerNumber" INTEGER NOT NULL DEFAULT 0;

-- Number existing wallets per cafe in join order, continuing after any numbers already given
WITH ranked AS (
  SELECT w.id,
         (SELECT COALESCE(MAX(x."customerNumber"), 0) FROM "LoyaltyWallet" x WHERE x."restaurantId" = w."restaurantId")
           + ROW_NUMBER() OVER (PARTITION BY w."restaurantId" ORDER BY w."createdAt", w.id) AS n
  FROM "LoyaltyWallet" w
  WHERE w."customerNumber" <= 0
)
UPDATE "LoyaltyWallet" w SET "customerNumber" = ranked.n FROM ranked WHERE w.id = ranked.id;

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyWallet_restaurantId_customerNumber_key"
  ON "LoyaltyWallet" ("restaurantId", "customerNumber");

CREATE OR REPLACE FUNCTION assign_customer_number() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW."customerNumber" IS NULL OR NEW."customerNumber" <= 0 THEN
    -- Lock the cafe row so two first-time guests at the same moment can't get the same number
    PERFORM 1 FROM "Restaurant" WHERE id = NEW."restaurantId" FOR NO KEY UPDATE;
    SELECT COALESCE(MAX("customerNumber"), 0) + 1 INTO NEW."customerNumber"
      FROM "LoyaltyWallet" WHERE "restaurantId" = NEW."restaurantId";
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loyalty_wallet_customer_number ON "LoyaltyWallet";
CREATE TRIGGER loyalty_wallet_customer_number BEFORE INSERT ON "LoyaltyWallet"
  FOR EACH ROW EXECUTE FUNCTION assign_customer_number();

COMMIT;
