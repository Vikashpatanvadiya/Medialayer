import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera } from "lucide-react";
import { apiUrl } from "@/lib/api";

const tabList = ["My account", "Notifications", "Integrations"];

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("My account");
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl("/api/auth/profile"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors";

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-0.5">{user?.name}</p>
        <h1 className="text-[28px] font-bold text-[#333]">Personal Settings</h1>
      </div>

      {/* Tabs — ref: underline style, purple active */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
        {tabList.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? "text-[#333] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "My account" && (
        <div className="space-y-10">

          {/* Name and photos */}
          <section>
            <h2 className="text-[18px] font-bold text-[#333] mb-1">Name and photos</h2>
            <p className="text-sm text-[#6c757d] mb-6">
              Changing your name below will update your name on your profile.
            </p>

            {/* Avatar row — ref: circle avatar + upload circle */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 shrink-0">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <button className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-violet-400 hover:bg-violet-50 transition-colors">
                <Camera className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm text-[#333] mb-1.5">First name</label>
                <input
                  className={inputClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm text-[#333] mb-1.5">Last name</label>
                <input
                  className={inputClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Brief: solid purple primary CTA, 8px radius, white text */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
              <button
                onClick={() => {
                  setFirstName(user?.name?.split(" ")[0] || "");
                  setLastName(user?.name?.split(" ").slice(1).join(" ") || "");
                }}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </section>

          {/* Contact Info */}
          <section>
            <h2 className="text-[18px] font-bold text-[#333] mb-1">Contact Info</h2>
            <p className="text-sm text-[#6c757d] mb-6">
              Your email address is used to sign in and receive notifications.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[#333] mb-1.5">Email</label>
                <input
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  value={user?.email || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-[#333] mb-1.5">Role</label>
                <input
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed capitalize`}
                  value={user?.role || ""}
                  readOnly
                />
              </div>
            </div>
          </section>

          {/* Danger zone */}
          <section className="border border-red-100 rounded-lg p-5 bg-red-50/50">
            <h2 className="text-[15px] font-bold text-red-600 mb-1">Danger Zone</h2>
            <p className="text-sm text-[#6c757d] mb-4">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <button
              onClick={async () => {
                if (!confirm("Delete your account? This cannot be undone.")) return;
                const token = localStorage.getItem("layer_token");
                await fetch(apiUrl("/api/auth/account"), {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });
                localStorage.removeItem("layer_token");
                window.location.href = "/";
              }}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              Delete Account
            </button>
          </section>
        </div>
      )}

      {activeTab === "Notifications" && (
        <div className="text-sm text-[#6c757d]">Notification settings coming soon.</div>
      )}

      {activeTab === "Integrations" && (
        <div className="space-y-4">
          <h2 className="text-[18px] font-bold text-[#333] mb-1">Connected Accounts</h2>
          <p className="text-sm text-[#6c757d] mb-6">Connect external accounts to enhance your workflow.</p>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white shadow-[0px_4px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#333]">Google</p>
                <p className="text-xs text-[#6c757d]">Connect your Google account</p>
              </div>
            </div>
            <button className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
