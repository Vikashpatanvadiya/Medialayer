import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { X, Copy, Check, Trash2, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

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
    fetch(apiUrl("/api/users/invite-code"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setInviteCode(d.inviteCode))
      .catch(() => {});
  }, []);

  const addEmail = (val: string) => {
    const trimmed = val.trim().replace(/,/g, "");
    if (!trimmed) return;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!valid) { toast({ title: "Invalid email", description: trimmed, variant: "destructive" }); return; }
    if (!emails.includes(trimmed)) setEmails((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      addEmail(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      setEmails((prev) => prev.slice(0, -1));
    }
  };

  const copyLink = () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/register?code=${inviteCode}`;
    navigator.clipboard.writeText(link);
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — ref: white, rounded-2xl, ~480px wide */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] p-7 z-10">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <h2 className="text-[17px] font-bold text-gray-900 mb-5 pr-6">
          Make work more fun by inviting editors to join MediaLayer.
        </h2>

        {/* Email invite section */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invite your editors</p>

          {/* Email tag input — ref: tags inside input field */}
          <div
            className="flex flex-wrap gap-1.5 items-center min-h-[42px] px-3 py-2 border border-gray-200 rounded-lg bg-white cursor-text focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-colors"
            onClick={() => inputRef.current?.focus()}
          >
            {emails.map((email) => (
              <span key={email} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md">
                {email}
                <button onClick={() => setEmails((p) => p.filter((e) => e !== email))} className="hover:text-indigo-900">
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
              className="flex-1 min-w-[140px] text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Message field — ref: textarea with placeholder message */}
        {emails.length > 0 && (
          <div className="mb-5">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-700 resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          </div>
        )}

        {/* Send button */}
        <button
          onClick={sendInvites}
          disabled={isSending || emails.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm mb-6"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send invite"}
        </button>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">
              Invite link for <span className="text-indigo-600">Editor</span>
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Anyone signing up with this link will join your workspace as an Editor. This link will expire after 7 days.
          </p>

          {inviteCode ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 font-mono truncate">
                {window.location.origin}/register?code={inviteCode}
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading invite link...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
