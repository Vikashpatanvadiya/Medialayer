import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-2">Data Deletion Instructions</h1>
        <p className="text-muted-foreground mb-10">Effective Date: August 21, 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <p>MediaLayer gives you three ways to remove your data, depending on how much you want deleted. All of them are free, and none of them require you to contact support first.</p>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">Option 1 — Disconnect a connected account</h2>
            <p className="mb-3">This removes everything we hold for one integration (Instagram or YouTube) while keeping your MediaLayer account.</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Sign in to MediaLayer at <a href="https://medialayer.app" className="text-primary underline">medialayer.app</a></li>
                <li>Go to <strong>Dashboard → Profile</strong></li>
              <li>Find the connected account under <strong>Integrations</strong></li>
              <li>Click <strong>Disconnect</strong></li>
            </ol>
            <p className="mt-3">The moment you disconnect, we permanently delete the stored access token, the account id, the username, the account type and the profile picture URL for that integration. The deletion is immediate — nothing is kept in a soft-deleted or archived state.</p>
            <p className="mt-3">Posts already published to Instagram or YouTube stay on those platforms. MediaLayer cannot delete them for you — delete them from the Instagram or YouTube app directly.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">Option 2 — Revoke access from Instagram or Google</h2>
            <p className="mb-3">You can also cut off MediaLayer's access from the platform's own settings:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Instagram</strong> — open the Instagram app, then <strong>Settings and privacy → Website permissions → Apps and websites</strong>, and remove <strong>MediaLayer</strong>.</li>
              <li><strong>Google / YouTube</strong> — visit <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-primary underline">Google Account permissions</a> and remove <strong>MediaLayer</strong>.</li>
            </ul>
            <p className="mt-3">Revoking there stops all future API access immediately. To also erase the account record we hold, use Option 1 or Option 3.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">Option 3 — Delete your entire MediaLayer account</h2>
            <p className="mb-3">To erase everything — your account, your videos, your connected integrations and your publish history — email us from the address registered on your account:</p>
            <p className="mb-3 font-medium text-foreground">medialayer.app@gmail.com</p>
            <p className="mb-3">Use the subject line <strong>"Delete my account"</strong> and include your MediaLayer email address and, if relevant, your Instagram username. We verify that the request comes from the account owner, then:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We confirm receipt within <strong>3 business days</strong></li>
              <li>We complete the deletion within <strong>30 days</strong></li>
              <li>We email you when the deletion is done</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">What gets deleted</h2>
            <p className="mb-3">A full account deletion removes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your name and email address</li>
              <li>Your Instagram connection — access token, Instagram user id, username, account type, profile picture URL and granted permissions</li>
              <li>Your Google/YouTube connection — OAuth tokens and channel identifiers</li>
              <li>Uploaded video files and thumbnails stored on Cloudinary</li>
              <li>Video metadata, approval history and workflow notes</li>
              <li>Instagram and YouTube publish records, including permalinks</li>
              <li>Creator–editor links and notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">What we may keep</h2>
            <p>We may retain minimal security and transaction logs where we are legally required to, or where they are needed to resolve a dispute or prevent abuse. These logs do not contain access tokens or video content, and they are deleted on our normal log retention schedule.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">Questions</h2>
            <p>If any of these steps do not work for you, email <strong className="text-foreground">medialayer.app@gmail.com</strong> and we will handle the deletion manually.</p>
            <p className="mt-3">See also our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link> and <Link href="/terms" className="text-primary underline">Terms of Service</Link>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
