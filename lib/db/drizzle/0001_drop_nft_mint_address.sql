-- Remove NFT certificate column (feature removed)
ALTER TABLE "videos" DROP COLUMN IF EXISTS "nft_mint_address";
