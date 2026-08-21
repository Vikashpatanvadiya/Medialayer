import { useEffect, useState } from "react";
import { Instagram, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  readConnectOutcome,
  useConnectInstagram,
  useDisconnectInstagram,
  useInstagramAccounts,
} from "@/hooks/use-instagram";

/** Instagram section for Settings → Integrations. Creators only. */
export function InstagramConnectCard({ isCreator }: { isCreator: boolean }) {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useInstagramAccounts(isCreator);
  const { connect, isConnecting } = useConnectInstagram();
  const disconnect = useDisconnectInstagram();

  const accounts = data?.accounts ?? [];
  const configured = data?.configured ?? true;

  // Instagram sends the creator back here with ?instagram=connected|error.
  useEffect(() => {
    const outcome = readConnectOutcome();
    if (!outcome) return;
    toast(
      outcome.status === "connected"
        ? { title: "Instagram connected", description: outcome.message }
        : { title: "Instagram not connected", description: outcome.message, variant: "destructive" },
    );
    if (outcome.status === "connected") refetch();
  }, [toast, refetch]);

  const [redirecting, setRedirecting] = useState(false);

  const handleConnect = async () => {
    setRedirecting(true);
    const result = await connect();
    if (!result.ok) {
      setRedirecting(false);
      toast({
        title: "Could not start Instagram login",
        description: result.detail,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (id: string, username: string) => {
    try {
      await disconnect.mutateAsync(id);
      toast({ title: "Instagram disconnected", description: `@${username} was removed.` });
    } catch (err: any) {
      toast({
        title: "Could not disconnect",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const busy = isConnecting || redirecting;

  return (
    <div className="p-4 border border-border rounded-[var(--radius-5)] bg-card shadow-[var(--shadow-1)] space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-4)] bg-muted flex items-center justify-center">
            <Instagram className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Instagram</p>
            <p className="text-xs text-muted-foreground">
              {isCreator
                ? "Connect your Instagram Professional account and publish directly from MediaLayer."
                : "Only creators can connect publishing accounts"}
            </p>
          </div>
        </div>

        {isCreator && configured && (
          <Button variant="outline" size="sm" onClick={handleConnect} disabled={busy}>
            {busy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : accounts.length > 0 ? (
              "Connect another"
            ) : (
              "Connect Instagram"
            )}
          </Button>
        )}
      </div>

      {!isCreator ? null : !configured ? (
        <p className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-[var(--radius-4)] px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
          Instagram publishing isn't configured on this server yet.
        </p>
      ) : isLoading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Checking connection…
        </p>
      ) : accounts.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          You'll sign in on Instagram and authorize MediaLayer. Requires a{" "}
          <span className="font-medium text-foreground">Professional</span> account (Business or
          Creator) — no Facebook Page needed.
        </p>
      ) : (
        <ul className="space-y-2">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-4)] border border-border bg-muted/30 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {account.profilePictureUrl ? (
                  <img
                    src={account.profilePictureUrl}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                    <Instagram className="size-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                    <CheckCircle2 className="size-3.5 shrink-0 text-[var(--green-4)]" />@
                    {account.username}
                  </p>
                  {account.accountType && (
                    <p className="truncate text-xs capitalize text-muted-foreground">
                      {account.accountType.toLowerCase().replace("_", " ")} account
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDisconnect(account.id, account.username)}
                disabled={disconnect.isPending}
                className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-[var(--red-4)] disabled:opacity-60"
              >
                Disconnect
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
