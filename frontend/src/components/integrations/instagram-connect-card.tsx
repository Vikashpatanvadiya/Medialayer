import { Instagram, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useConnectInstagram,
  useDisconnectInstagram,
  useInstagramAccounts,
} from "@/hooks/use-instagram";

/** Instagram section for Settings → Integrations. Creators only. */
export function InstagramConnectCard({ isCreator }: { isCreator: boolean }) {
  const { toast } = useToast();
  const { data, isLoading } = useInstagramAccounts(isCreator);
  const { connect, isConnecting } = useConnectInstagram();
  const disconnect = useDisconnectInstagram();

  const accounts = data?.accounts ?? [];
  const configured = data?.configured ?? true;

  const handleConnect = async () => {
    const result = await connect();
    toast(
      result.ok
        ? { title: "Instagram connected", description: result.detail }
        : { title: "Instagram not connected", description: result.detail, variant: "destructive" },
    );
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
                ? "Publish approved videos as Reels or feed posts"
                : "Only creators can connect publishing accounts"}
            </p>
          </div>
        </div>

        {isCreator && configured && (
          <Button variant="outline" size="sm" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : accounts.length > 0 ? (
              "Connect another"
            ) : (
              "Connect"
            )}
          </Button>
        )}
      </div>

      {!isCreator ? null : !configured ? (
        <p className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-[var(--radius-4)] px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
          Instagram publishing isn't configured on this server yet. Add the Meta app credentials to
          enable it.
        </p>
      ) : isLoading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Checking connection…
        </p>
      ) : accounts.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Connect an Instagram <span className="font-medium text-foreground">Business</span> or{" "}
          <span className="font-medium text-foreground">Creator</span> account that is linked to a
          Facebook Page.
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
                  <p className="truncate text-sm font-medium text-foreground">
                    @{account.username}
                  </p>
                  {account.fbPageName && (
                    <p className="truncate text-xs text-muted-foreground">{account.fbPageName}</p>
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
