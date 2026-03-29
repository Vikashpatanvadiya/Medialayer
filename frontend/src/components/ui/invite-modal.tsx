import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { X, Copy, Check, Loader2, Link2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface InviteModalProps {
  onClose: () => void;
}

export function InviteModal({ onClose }: InviteModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("layer_token");
    fetch(apiUrl("/api/users/invite-code"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setInviteCode(d.inviteCode))
      .catch(() => {});
  }, []);

  const inviteLink = inviteCode
    ? `${window.location.origin}/register?role=editor&code=${inviteCode}`
    : null;

  const addEmail = (val: string) => {
    const trimmed = val.trim().replace(/,/g, "");
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid email", description: trimmed, variant: "destructive" });
      return;
    }
    if (!emails.includes(trimmed)) setEmails((p) => [...p, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", " ", ","].includes(e.key)) { e.preventDefault(); addEmail(inputValue); }
    if (e.key === "Backspace" && !inputValue && emails.length > 0) setEmails((p) => p.slice(0, -1));
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
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
        body: JSON.stringify({ emails, message: `You've been invited to join MediaLayer. Use this link to sign up as an editor: ${inviteLink}` }),
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/10 w-full max-w-[460px] z-10 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-gray-900 pr-6">Invite editors to your workspace</h2>
          <p className="text-sm text-gray-500 mt-1">They'll be able to upload videos for your review.</p>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Email input */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Invite by email
            </label>
            <div
              className="flex flex-wrap gap-1.5 items-center min-h-[44px] px-3 py-2 border border-gray-200 rounded-xl bg-white cursor-text focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
              onClick={() => inputRef.current?.focus()}
            >
              {emails.map((email) => (
                <span key={email} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100">
                  {email}
                  <button onClick={() => setEmails((p) => p.filter((e) => e !== email))} className="hover:text-indigo-900 ml-0.5">
                    <X className="w-3 h-3" />
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
                placeholder={emails.length === 0 ? "name@email.com — press Enter to add" : "Add more..."}
                className="flex-1 min-w-[160px] text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent py-0.5"
              />
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={sendInvites}
            disabled={isSending || emails.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 shadow-sm shadow-indigo-200"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send invite"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or share a link</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Invite link */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <Link2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Editor invite link</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Anyone who signs up with this link will automatically join your workspace as an editor.
                </p>
              </div>
            </div>

            {inviteLink ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 font-mono truncate">
                  {inviteLink}
                </div>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating link...
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
