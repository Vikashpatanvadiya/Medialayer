import { useEffect, useMemo, useState } from "react";
import { useSearch, Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle, ExternalLink, Loader2, RefreshCw, LogIn, UserPlus } from "lucide-react";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider, WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import "@solana/wallet-adapter-react-ui/styles.css";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const RECEIVER = "9oBgTB8ZQ5qkeEbUP65QWaVKG2BfcY8iUUcgPWAov5W";

// localStorage key to persist pending payment across login/register
const PENDING_PAYMENT_KEY = "layer_pending_payment";

const PLANS = {
  starter: { name: "Starter", price: "$50", sol: "0.5", features: ["1 creator account", "Up to 3 editors", "Unlimited video reviews", "Direct YouTube publishing", "Lifetime access"] },
  pro: { name: "Pro", price: "$100", sol: "1.0", features: ["Unlimited creator accounts", "Unlimited editors", "Unlimited video reviews", "Priority support", "Audit logs & analytics", "Lifetime access"] },
} as const;

function ChangeWalletButton() {
  const { setVisible } = useWalletModal();
  return (
    <button onClick={() => setVisible(true)}
      className="flex items-center gap-1.5 text-xs text-primary font-medium transition-colors hover:opacity-80">
      <RefreshCw className="w-3 h-3" /> Change wallet
    </button>
  );
}

function PaymentForm({ plan, planKey }: { plan: typeof PLANS[keyof typeof PLANS]; planKey: string }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [amount] = useState<string>(plan.sol);
  const [status, setStatus] = useState<"idle" | "loading" | "verifying" | "success" | "error">("idle");
  const [txSig, setTxSig] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // On mount: if user just logged in and there's a pending payment, auto-activate it
  useEffect(() => {
    if (!user) return;
    const pending = localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!pending) return;
    try {
      const { txSignature, plan: pendingPlan, walletAddress } = JSON.parse(pending);
      if (!txSignature || !pendingPlan) return;
      localStorage.removeItem(PENDING_PAYMENT_KEY);
      setTxSig(txSignature);
      setStatus("verifying");
      const token = localStorage.getItem("layer_token");
      fetch(apiUrl("/api/payments/verify-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ txSignature, plan: pendingPlan, walletAddress }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            setStatus("success");
          } else {
            setErrorMsg(data.error || "Plan activation failed");
            setStatus("error");
          }
        })
        .catch(() => { setErrorMsg("Plan activation failed"); setStatus("error"); });
    } catch {}
  }, [user]);

  const handlePay = async () => {
    if (!publicKey || !amount) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(RECEIVER),
          lamports: Math.round(parseFloat(amount) * LAMPORTS_PER_SOL),
        })
      );

      // skipPreflight=true + maxRetries=5 ensures tx actually lands on Devnet
      const sig = await sendTransaction(tx, connection, {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        maxRetries: 5,
      });
      setTxSig(sig);

      // Poll up to 90s — Devnet can be slow
      let confirmed = false;
      for (let i = 0; i < 45; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const sigStatus = await connection.getSignatureStatus(sig, { searchTransactionHistory: true });
          const conf = sigStatus?.value?.confirmationStatus;
          if (conf === "confirmed" || conf === "finalized") { confirmed = true; break; }
          if (sigStatus?.value?.err) throw new Error("Transaction failed on-chain: " + JSON.stringify(sigStatus.value.err));
        } catch (pollErr: any) {
          if (pollErr.message?.includes("failed on-chain")) throw pollErr;
        }
      }
      if (!confirmed) throw new Error("Transaction not confirmed after 90s — check Solana Explorer.");

      setStatus("verifying");

      const token = localStorage.getItem("layer_token");

      if (token) {
        const verifyRes = await fetch(apiUrl("/api/payments/verify-plan"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ txSignature: sig, plan: planKey, walletAddress: publicKey.toString() }),
        });
        const data = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok) throw new Error(data?.error || "Plan activation failed");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setStatus("success");
      } else {
        localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({
          txSignature: sig,
          plan: planKey,
          walletAddress: publicKey.toString(),
        }));
        setStatus("success");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Transaction failed");
      setStatus("error");
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === "success") {
    const isLoggedIn = !!localStorage.getItem("layer_token");
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--green-1)] flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-[var(--green-4)]" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">Payment confirmed!</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoggedIn
              ? `Your ${plan.name} plan is now active.`
              : "Payment received! Create your account to activate your plan."}
          </p>
        </div>
        {txSig && (
          <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ExternalLink className="w-3.5 h-3.5" /> View on Solana Explorer
          </a>
        )}
        {isLoggedIn ? (
          <Link href="/dashboard/creator"
            className="mt-2 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            Go to Dashboard →
          </Link>
        ) : (
          <div className="w-full space-y-2 mt-2">
            <p className="text-xs text-muted-foreground">Your payment is saved. Create an account or log in to activate your plan.</p>
            <Link href={`/register?plan=${planKey}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              <UserPlus className="w-4 h-4" /> Create account & activate plan
            </Link>
            <Link href={`/login?plan=${planKey}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-muted transition-colors">
              <LogIn className="w-4 h-4" /> Already have an account? Log in
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ── No wallet connected ────────────────────────────────────────────────────
  if (!publicKey) return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-sm text-muted-foreground text-center">Connect your Solana wallet to pay</p>
      <WalletMultiButton style={{ background: "#4f46e5", borderRadius: "9999px", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "14px" }} />
    </div>
  );

  // ── Payment form ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Auth status banner */}
      {!user && (
        <div className="flex items-center gap-2 p-3 rounded-[var(--radius-4)] bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <span>⚠️</span>
          <span>You're not logged in. After paying, you'll be asked to create an account to activate your plan.</span>
        </div>
      )}
      {user && (
        <div className="flex items-center gap-2 p-3 rounded-[var(--radius-4)] bg-[var(--green-1)] border border-[var(--green-2)] text-xs text-[var(--green-4)]">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Logged in as <strong>{user.name}</strong> — plan will activate immediately after payment.</span>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your wallet</p>
          <ChangeWalletButton />
        </div>
        <p className="text-xs font-mono bg-muted/50 border border-border rounded-[var(--radius-4)] px-3 py-2 break-all text-foreground">{publicKey.toBase58()}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sending to</p>
        <p className="text-xs font-mono bg-muted/50 border border-border rounded-[var(--radius-4)] px-3 py-2 break-all text-foreground">{RECEIVER}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount (SOL)</p>
        <p className="text-sm font-bold text-foreground px-4 py-2.5 rounded-[var(--radius-5)] border border-border bg-muted/30">{amount} SOL ≈ {plan.price}</p>
      </div>
      <button
        onClick={handlePay}
        disabled={status === "loading" || status === "verifying"}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-5)] bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Confirming on Solana…</>
        ) : status === "verifying" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Activating plan…</>
        ) : (
          `Pay ${amount} SOL`
        )}
      </button>
      {status === "error" && (
        <div className="space-y-1">
          <p className="text-xs text-[var(--red-4)] text-center">{errorMsg}</p>
          {txSig && (
            <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="w-3 h-3" /> Check tx on Explorer
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const planKey = (params.get("plan") || "starter") as keyof typeof PLANS;
  const plan = PLANS[planKey] || PLANS.starter;

  useEffect(() => {
    localStorage.removeItem("walletName");
  }, []);

  const endpoint = useMemo(() => {
    // Use env var if set (e.g. Helius/QuickNode), fallback to public devnet
    return (import.meta as any).env?.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  }, []);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{ background: "linear-gradient(160deg, #eeeaf8 0%, #e8e4f5 40%, #ddd8f0 100%)" }}>

            <div className="w-full max-w-md mb-6 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
              <img src="/Medialayer-Indigo.svg" alt="MediaLayer" className="h-6" />
              <div className="w-12" />
            </div>

            <div className="w-full max-w-md space-y-4">
              {/* Plan card */}
              <div className="bg-white rounded-[var(--radius-6)] p-6 border border-border shadow-[0px_4px_16px_rgba(0,0,0,0.06)]">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">Plan</p>
                    <p className="text-xl font-bold text-[#1a1f3c] mt-1">{plan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{plan.price}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">one-time · ≈ {plan.sol} SOL</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment card */}
              <div className="bg-white rounded-[var(--radius-6)] p-6 border border-border shadow-[0px_4px_16px_rgba(0,0,0,0.06)]">
                <h2 className="text-sm font-bold text-foreground mb-4">Pay with Solana</h2>
                <PaymentForm plan={plan} planKey={planKey} />
              </div>

              <p className="text-center text-xs text-muted-foreground/70">
                Payments processed on Solana blockchain. No refunds after confirmation.
              </p>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
