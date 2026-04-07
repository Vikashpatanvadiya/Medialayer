import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { X, Copy, Check, Trash2, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteModalProps {
  onClose: () => void;
}

export function InviteModal({ onClose }: InviteModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("Join my workspace on MediaLayer so we can easily review and publish videos together!");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("layer_token");
    fetch(apiUrl("/api/users/invite-code"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setInviteCode(d.inviteCode))
      .catch(() => {});
  }, []);

  const addEmail = (val: string) => {
    const trimmed = val.trim().replace(/,/g, "");
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid email", description: trimmed, variant: "destructive" });
      return;
    }
    if (!emails.includes(trimmed)) setEmails((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") { e.preventDefault(); addEmail(inputValue); }
    if (e.key === "Backspace" && !inputValue && emails.length > 0) setEmails((prev) => prev.slice(0, -1));
  };

  const copyLink = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?code=${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: "Share it with your editors." });
  };

  const sendInvites = async () => {
    if (emails.length === 0) { toast({ title: "Add at least one email", variant: "destructive" }); return; }
    setIsSending(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl("/api/users/invite"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emails, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invites");
      toast({ title: "Invites sent!", description: `Sent to ${emails.length} editor${emails.length > 1 ? "s" : ""}.` });
      setEmails([]);
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-[var(--radius-6)] shadow-[var(--shadow-4)] w-full max-w-[480px] p-7 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-[var(--radius-4)] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-[17px] font-bold text-foreground mb-5 pr-6">
          Make work more fun by inviting editors to join MediaLayer.
        </h2>

        <div className="mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invite your editors</p>
          <div
            className="flex flex-wrap gap-1.5 items-center min-h-[42px] px-3 py-2 border border-input bg-input/30 rounded-4xl cursor-text focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 transition-all"
            onClick={() => inputRef.current?.focus()}
          >
            {emails.map((email) => (
              <span key={email} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-[var(--radius-3)]">
                {email}
                <button onClick={() => setEmails((p) => p.filter((e) => e !== email))} className="hover:text-primary/70">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => addEmail(inputValue)}
              placeholder={emails.length === 0 ? "Separate emails with a space or Enter" : "Add more..."}
              className="flex-1 min-w-[140px] text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
            />
          </div>
        </div>

        {emails.length > 0 && (
          <div className="mb-5">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-input bg-input/30 rounded-[var(--radius-5)] text-foreground resize-none focus:outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50 transition-all"
            />
          </div>
        )}

        <Button onClick={sendInvites} disabled={isSending || emails.length === 0} className="w-full mb-6">
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send invite"}
        </Button>

        <div className="border-t border-border pt-5">
          <p className="text-sm font-semibold text-foreground mb-1">
            Invite link for <span className="text-primary">Editor</span>
          </p>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Anyone signing up with this link will join your workspace as an Editor. Expires after 7 days.
          </p>
          {inviteCode ? (
            <div className="flex items-center gap-2">
              <Input readOnly value={`${window.location.origin}/register?code=${inviteCode}`} className="flex-1 text-xs font-mono text-muted-foreground" />
              <Button onClick={copyLink} size="sm" className="shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading invite link...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
