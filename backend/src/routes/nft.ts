import { Router } from "express";
import { db, videosTable, usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logAction } from "../lib/logger.js";

const router = Router();

/**
 * POST /api/nft/mint-certificate/:videoId
 *
 * Mints a Metaplex Core NFT as a proof-of-delivery certificate.
 * Called internally from the YouTube upload background job after a successful upload.
 * Can also be called manually by the creator from the video detail page.
 */
router.post("/mint-certificate/:videoId", requireAuth, async (req, res) => {
  const { videoId } = req.params as { videoId: string };

  const [video] = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.id, videoId))
    .limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }
  if (video.status !== "uploaded" || !video.youtubeUrl) {
    res.status(400).json({ error: "Video must be uploaded to YouTube before minting a certificate" });
    return;
  }
  if (video.creatorId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (video.nftMintAddress) {
    res.json({ success: true, mintAddress: video.nftMintAddress, alreadyMinted: true });
    return;
  }

  const [creator] = await db
    .select({ id: usersTable.id, name: usersTable.name, solanaWalletAddress: usersTable.solanaWalletAddress })
    .from(usersTable)
    .where(eq(usersTable.id, video.creatorId))
    .limit(1);

  const [editor] = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, video.editorId))
    .limit(1);

  const keypairBase58 = process.env.PLATFORM_SOLANA_KEYPAIR;
  if (!keypairBase58) {
    res.status(500).json({ error: "Platform Solana keypair not configured (PLATFORM_SOLANA_KEYPAIR)" });
    return;
  }

  // Respond immediately — minting runs in background
  res.json({ success: true, status: "minting", message: "NFT certificate minting started" });

  // Background mint
  (async () => {
    try {
      const { createUmi } = await import("@metaplex-foundation/umi-bundle-defaults");
      const { mplCore, createV1, fetchAsset } = await import("@metaplex-foundation/mpl-core");
      const { keypairIdentity, generateSigner, publicKey: umiPublicKey } = await import("@metaplex-foundation/umi");
      const bs58 = await import("bs58");

      const network = (process.env.SOLANA_NETWORK || "devnet") as string;
      const rpcUrl = process.env.SOLANA_RPC_URL || `https://api.${network}.solana.com`;

      const umi = createUmi(rpcUrl).use(mplCore());

      // Load platform keypair
      const secretKeyBytes = bs58.default.decode(keypairBase58);
      const platformKeypair = umi.eddsa.createKeypairFromSecretKey(secretKeyBytes);
      umi.use(keypairIdentity(platformKeypair));

      // Generate a new signer for the NFT asset
      const assetSigner = generateSigner(umi);

      // Determine owner — use creator's Solana wallet if available, else platform wallet
      const ownerAddress = creator?.solanaWalletAddress
        ? umiPublicKey(creator.solanaWalletAddress)
        : platformKeypair.publicKey;

      const deliveredAt = new Date().toISOString();

      await createV1(umi, {
        asset: assetSigner,
        name: `MediaLayer Delivery: ${video.title}`,
        uri: JSON.stringify({
          name: `MediaLayer Delivery: ${video.title}`,
          description: `Proof-of-delivery certificate for "${video.title}" — delivered by ${editor?.name || "editor"}, published by ${creator?.name || "creator"}.`,
          image: video.thumbnailUrl || "https://medialayer.app/Medialayer-Indigo.svg",
          attributes: [
            { trait_type: "videoId", value: video.id },
            { trait_type: "creatorId", value: video.creatorId },
            { trait_type: "editorId", value: video.editorId },
            { trait_type: "youtubeUrl", value: video.youtubeUrl },
            { trait_type: "deliveredAt", value: deliveredAt },
            { trait_type: "platform", value: "MediaLayer" },
          ],
        }),
        owner: ownerAddress,
      }).sendAndConfirm(umi);

      const mintAddress = assetSigner.publicKey.toString();

      // Save mint address to DB
      await db
        .update(videosTable)
        .set({ nftMintAddress: mintAddress, updatedAt: new Date() })
        .where(eq(videosTable.id, videoId));

      const explorerUrl = `https://explorer.solana.com/address/${mintAddress}?cluster=${network}`;

      // Notify both creator and editor
      await db.insert(notificationsTable).values([
        {
          userId: video.creatorId,
          title: "Delivery certificate minted!",
          message: `NFT certificate for "${video.title}" minted on Solana. View: ${explorerUrl}`,
          type: "nft_minted",
          videoId: video.id,
        },
        {
          userId: video.editorId,
          title: "Delivery certificate minted!",
          message: `NFT certificate for "${video.title}" minted on Solana. View: ${explorerUrl}`,
          type: "nft_minted",
          videoId: video.id,
        },
      ]);

      await logAction(video.creatorId, "nft_minted", videoId, { mintAddress, explorerUrl });

      console.log(`[nft] Certificate minted: ${mintAddress}`);
    } catch (err: any) {
      console.error("[nft] Mint failed:", err?.message || err);
      await logAction(video.creatorId, "nft_mint_failed", videoId, { error: err?.message }).catch(() => {});
    }
  })();
});

// GET /api/nft/certificate/:videoId — returns NFT info for a video
router.get("/certificate/:videoId", requireAuth, async (req, res) => {
  const { videoId } = req.params as { videoId: string };

  const [video] = await db
    .select({
      id: videosTable.id,
      nftMintAddress: videosTable.nftMintAddress,
      status: videosTable.status,
      creatorId: videosTable.creatorId,
      editorId: videosTable.editorId,
    })
    .from(videosTable)
    .where(eq(videosTable.id, videoId))
    .limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  const user = req.user!;
  if (video.creatorId !== user.userId && video.editorId !== user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const network = process.env.SOLANA_NETWORK || "devnet";
  const explorerUrl = video.nftMintAddress
    ? `https://explorer.solana.com/address/${video.nftMintAddress}?cluster=${network}`
    : null;

  res.json({
    nftMintAddress: video.nftMintAddress ?? null,
    explorerUrl,
    minted: !!video.nftMintAddress,
  });
});

export default router;
