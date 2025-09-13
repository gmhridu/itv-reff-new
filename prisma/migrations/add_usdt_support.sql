-- Add USDT_TRC20 to BankType enum
ALTER TYPE "BankType" ADD VALUE 'USDT_TRC20';

-- Add new columns to admin_wallets table
ALTER TABLE "admin_wallets"
ADD COLUMN "usdtWalletAddress" TEXT,
ADD COLUMN "qrCodeUrl" TEXT;

-- Make walletNumber nullable for USDT wallets
ALTER TABLE "admin_wallets"
ALTER COLUMN "walletNumber" DROP NOT NULL;

-- Add USDT to PKR rate setting if it doesn't exist
INSERT INTO "settings" ("id", "key", "value", "createdAt", "updatedAt")
VALUES (
  'usdt_rate_' || generate_random_uuid(),
  'usdt_to_pkr_rate',
  '295',
  NOW(),
  NOW()
) ON CONFLICT ("key") DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_admin_wallets_wallet_type" ON "admin_wallets"("walletType");
CREATE INDEX IF NOT EXISTS "idx_admin_wallets_usdt_address" ON "admin_wallets"("usdtWalletAddress");
CREATE INDEX IF NOT EXISTS "idx_settings_key" ON "settings"("key");
