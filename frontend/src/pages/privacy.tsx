import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 25, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Overview</h2>
            <p>MediaLayer ("we", "our", or "us") is a video collaboration platform that connects YouTube creators and video editors. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform at <strong>medialayer.vercel.app</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following information when you register and use MediaLayer:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account information:</strong> Your name, email address, and password (stored as a secure hash).</li>
              <li><strong>Video content:</strong> Video files you upload, along with titles, descriptions, and tags you provide.</li>
              <li><strong>YouTube account data:</strong> If you connect your YouTube channel, we store OAuth tokens (encrypted) to enable video uploads on your behalf. We access your YouTube channel name and upload videos you explicitly authorize.</li>
              <li><strong>Usage data:</strong> Actions performed on the platform such as video submissions, approvals, and rejections, stored for audit purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide the video collaboration service between creators and editors.</li>
              <li>To upload approved videos to your YouTube channel when you explicitly request it.</li>
              <li>To send email notifications about video status changes (approvals, rejections, uploads).</li>
              <li>To authenticate your identity and protect your account.</li>
              <li>We do not sell, rent, or share your personal data with third parties for marketing purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. YouTube API Services</h2>
            <p className="mb-3">MediaLayer uses the <strong>YouTube Data API v3</strong> to upload videos to your YouTube channel. By connecting your YouTube account, you authorize us to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Read your YouTube channel information (channel name).</li>
              <li>Upload videos to your YouTube channel on your behalf.</li>
            </ul>
            <p className="mt-3">Your YouTube OAuth tokens are encrypted using AES-256 encryption before being stored in our database. We never share your YouTube credentials with any third party.</p>
            <p className="mt-3">Our use of YouTube API Services is subject to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="text-primary underline">YouTube Terms of Service</a>. You can revoke MediaLayer's access to your YouTube account at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-primary underline">Google Account Permissions</a>.</p>
            <p className="mt-3">Google's privacy policy is available at <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">https://policies.google.com/privacy</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Video Storage</h2>
            <p>Uploaded videos are stored securely on <strong>Cloudinary</strong> using authenticated (private) delivery. Videos are not publicly accessible via direct URL — they can only be viewed through our platform by authorized users (the creator and editor associated with that video). Signed URLs with a 1-hour expiry are used for playback.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Data Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Passwords are hashed using bcrypt and never stored in plain text.</li>
              <li>YouTube OAuth tokens are encrypted with AES-256-CBC before database storage.</li>
              <li>All API communication uses HTTPS/TLS.</li>
              <li>JWT tokens are used for session authentication with a 7-day expiry.</li>
              <li>Rate limiting is applied to authentication endpoints to prevent brute force attacks.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Data Retention</h2>
            <p>We retain your account data and video metadata for as long as your account is active. You may delete individual videos at any time from the platform, which removes both the database record and the file from Cloudinary. To request full account deletion, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Third-Party Services</h2>
            <p>MediaLayer uses the following third-party services to operate:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cloudinary</strong> — video file storage (<a href="https://cloudinary.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Privacy Policy</a>)</li>
              <li><strong>Neon</strong> — PostgreSQL database hosting (<a href="https://neon.tech/privacy-policy" target="_blank" rel="noreferrer" className="text-primary underline">Privacy Policy</a>)</li>
              <li><strong>Render</strong> — backend hosting (<a href="https://render.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Privacy Policy</a>)</li>
              <li><strong>Vercel</strong> — frontend hosting (<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="text-primary underline">Privacy Policy</a>)</li>
              <li><strong>Google / YouTube Data API v3</strong> — YouTube integration (<a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Privacy Policy</a>)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Revoke YouTube access at any time via Google Account settings.</li>
              <li>Disconnect your YouTube account from within the platform at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Contact</h2>
            <p>If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at:</p>
            <p className="mt-2 font-medium text-foreground">medialayer.app@gmail.com</p>
          </section>

        </div>
      </div>
    </div>
  );
}
