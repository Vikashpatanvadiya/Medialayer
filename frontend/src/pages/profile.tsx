import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Wallet } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstagramConnectCard } from "@/components/integrations/instagram-connect-card";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";

const tabList = ["My account", "Integrations"];

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState("My account");
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");
  const [walletInput, setWalletInput] = useState(user?.solanaWalletAddress || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl("/api/auth/profile"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await refetchUser();
      toast({ title: "Profile updated", description: "Your name has been saved." });
    } catch {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWallet = async () => {
    if (!publicKey) return;
    setIsSavingWallet(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl("/api/users/wallet"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ walletAddress: publicKey.toString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Server error ${res.status}`);
      await refetchUser();
      toast({ title: "Wallet saved", description: "Your Solana wallet address has been saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not save wallet address.", variant: "destructive" });
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleSaveManualWallet = async () => {
    const addr = walletInput.trim();
    if (!addr) {
      toast({ title: "Invalid wallet", description: "Enter a Solana wallet address.", variant: "destructive" });
      return;
    }
    try {
      // Validate base58 and 32-byte key.
      new PublicKey(addr);
    } catch {
      toast({ title: "Invalid wallet", description: "Please enter a valid Solana wallet address.", variant: "destructive" });
      return;
    }

    setIsSavingWallet(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl("/api/users/wallet"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ walletAddress: addr }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Server error ${res.status}`);
      await refetchUser();
      setWalletInput(addr);
      toast({ title: "Wallet saved", description: "Your Solana wallet address has been saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not save wallet address.", variant: "destructive" });
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleRemoveWallet = async () => {
    if (!confirm("Remove your Solana wallet address? You won't be able to receive payments.")) return;
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl("/api/users/wallet"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Server error ${res.status}`);
      await refetchUser();
      toast({ title: "Wallet removed", description: "Your Solana wallet address has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not remove wallet address.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-0.5">{user?.name}</p>
        <h1 className="text-[28px] font-bold text-foreground">Personal Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border mb-8">
        {tabList.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "My account" && (
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-1">Name and photos</h2>
            <p className="text-sm text-muted-foreground mb-6">Changing your name below will update your name on your profile.</p>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <button className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-accent transition-colors">
                <Camera className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => {
                setFirstName(user?.name?.split(" ")[0] || "");
                setLastName(user?.name?.split(" ").slice(1).join(" ") || "");
              }}>
                Cancel
              </Button>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-1">Contact Info</h2>
            <p className="text-sm text-muted-foreground mb-6">Your email address is used to sign in and receive notifications.</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user?.email || ""} readOnly className="opacity-60 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input value={user?.role || ""} readOnly className="opacity-60 cursor-not-allowed capitalize" />
              </div>
            </div>
            {/* Plan status */}
            <div className="mt-4 p-4 rounded-[var(--radius-5)] border border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {user?.plan && user.plan !== "free"
                      ? `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan`
                      : "Free Plan"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user?.plan && user.plan !== "free"
                      ? `Active since ${user.planActivatedAt ? new Date(user.planActivatedAt).toLocaleDateString() : "recently"} · Lifetime access`
                      : "3 video uploads per month"}
                  </p>
                </div>
                {(!user?.plan || user.plan === "free") && (
                  <a href="/checkout?plan=starter"
                    className="px-4 py-2 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                    Upgrade
                  </a>
                )}
                {user?.plan && user.plan !== "free" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "var(--purple-1)", color: "var(--purple-4)" }}>
                    ✦ Active
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="border border-destructive/20 rounded-[var(--radius-5)] p-5 bg-destructive/5">
            <h2 className="text-sm font-bold text-destructive mb-1">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!confirm("Delete your account? This cannot be undone.")) return;
                const token = localStorage.getItem("layer_token");
                await fetch(apiUrl("/api/auth/account"), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                localStorage.removeItem("layer_token");
                window.location.href = "/";
              }}
            >
              Delete Account
            </Button>
          </section>
        </div>
      )}

      {activeTab === "Integrations" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground mb-1">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground mb-6">Connect external accounts to enhance your workflow.</p>

          {/* Google */}
          <div className="flex items-center justify-between p-4 border border-border rounded-[var(--radius-5)] bg-card shadow-[var(--shadow-1)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-4)] bg-muted flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Google</p>
                <p className="text-xs text-muted-foreground">Connect your Google account</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>

          {/* Instagram — publishing target for approved videos */}
          <InstagramConnectCard isCreator={user?.role === "creator"} />

          {/* Solana Wallet — for receiving editor payments */}
          <div className="p-4 border border-border rounded-[var(--radius-5)] bg-card shadow-[var(--shadow-1)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-4)] bg-muted flex items-center justify-center">
                <Wallet className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Solana Wallet</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === "editor"
                    ? "Required to receive payments from creators"
                    : "Required to pay editors and activate plans"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {user?.solanaWalletAddress && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Saved address</p>
                  <p className="text-xs font-mono bg-muted/50 border border-border rounded-[var(--radius-4)] px-3 py-2 break-all text-foreground">
                    {user.solanaWalletAddress}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Connect wallet (optional)</p>
                {!connected ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">Connect Phantom or Solflare, then save the connected address.</p>
                    <WalletMultiButton style={{ background: "#4f46e5", borderRadius: "8px", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", height: "36px" }} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-mono bg-muted/50 border border-border rounded-[var(--radius-4)] px-3 py-2 break-all text-foreground">
                      {publicKey?.toString()}
                    </p>
                    <Button size="sm" onClick={handleSaveWallet} disabled={isSavingWallet}>
                      {isSavingWallet ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save connected wallet"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Or enter wallet manually</p>
                <Input
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  placeholder="Paste Solana wallet address"
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSaveManualWallet} disabled={isSavingWallet || !walletInput.trim()}>
                    {isSavingWallet ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save entered wallet"}
                  </Button>
                  {user?.solanaWalletAddress && (
                    <Button variant="outline" size="sm" onClick={handleRemoveWallet}
                      className="border-[var(--red-2)] text-[var(--red-4)] hover:bg-[var(--red-1)]">
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
