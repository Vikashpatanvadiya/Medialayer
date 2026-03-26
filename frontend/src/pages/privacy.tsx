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
        <p className="text-muted-foreground mb-10">Effective Date: March 26, 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <p>MediaLayer ("we") operates the website <strong>https://medialayer.vercel.app</strong> and provides a platform for creators and editors to collaborate on video uploads. We are committed to protecting your privacy and ensuring transparency in how your data is handled.</p>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>

            <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Name (if provided)</li>
              <li>Email address (via Google Sign-In or manual registration)</li>
            </ul>

            <h3 className="font-semibold text-foreground mb-2">Google Account Data</h3>
            <p className="mb-2">When you sign in using Google OAuth, we may access:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Your email address</li>
              <li>Basic profile information</li>
              <li>Permission to upload videos to your YouTube channel (only if granted)</li>
            </ul>
            <p className="mb-4">We do not access your password at any time.</p>

            <h3 className="font-semibold text-foreground mb-2">Video & Content Data</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Uploaded video files (temporarily stored)</li>
              <li>Video metadata (title, description, tags)</li>
              <li>Approval status and workflow data</li>
            </ul>

            <h3 className="font-semibold text-foreground mb-2">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Actions performed on the platform (upload, approve, reject)</li>
              <li>Logs for security and debugging purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use your data strictly to provide core functionality:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Enable secure collaboration between editors and creators</li>
              <li>Allow creators to review and approve videos</li>
              <li>Upload videos to your YouTube channel upon approval</li>
              <li>Send notifications related to workflow activity</li>
              <li>Maintain system security and prevent misuse</li>
            </ul>
            <p className="mt-3">We do not use your data for advertising or tracking purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Google API Data Usage</h2>
            <p className="mb-3">MediaLayer uses Google APIs solely to enable video uploads to your YouTube channel.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We only request the minimum required permissions (<code className="text-sm bg-secondary px-1 rounded">youtube.upload</code>)</li>
              <li>We do not access or modify any other YouTube data</li>
              <li>We do not store or share your YouTube content outside of the intended workflow</li>
            </ul>
            <p className="mt-3">MediaLayer's use of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Data Storage & Security</h2>
            <p className="mb-3">We implement strong security practices:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>OAuth tokens are encrypted using AES-256-CBC encryption</li>
              <li>Video files are stored securely using authenticated access on Cloudinary</li>
              <li>Access to videos is restricted using temporary signed URLs (1-hour expiry)</li>
              <li>Backend systems enforce JWT authentication and role-based authorization checks</li>
            </ul>
            <p className="mt-3">We take reasonable measures to protect your data from unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Data Sharing</h2>
            <p className="mb-3">We do not sell, rent, or trade your personal data. We only share data with trusted services required to operate the platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cloudinary</strong> — for secure video file storage</li>
              <li><strong>Google APIs</strong> — for YouTube uploads</li>
              <li><strong>Neon</strong> — for database hosting</li>
            </ul>
            <p className="mt-3">These services are used strictly for functionality and not for data exploitation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Video files are stored only as long as needed for workflow purposes</li>
              <li>Users may delete videos at any time</li>
              <li>Account data is retained until the user deletes their account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Your Rights & Control</h2>
            <p className="mb-3">You have full control over your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You can revoke Google access anytime via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-primary underline">Google Account settings</a></li>
              <li>You can disconnect your YouTube channel from within the platform</li>
              <li>You can delete videos from the platform</li>
              <li>You can request account deletion by contacting us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Third-Party Services</h2>
            <p className="mb-3">MediaLayer integrates with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Google (OAuth and YouTube API)</a></li>
              <li><a href="https://cloudinary.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Cloudinary</a> — secure video storage</li>
              <li><a href="https://neon.tech/privacy-policy" target="_blank" rel="noreferrer" className="text-primary underline">Neon</a> — database hosting</li>
              <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="text-primary underline">Vercel</a> — frontend hosting</li>
              <li><a href="https://render.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Render</a> — backend hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Children's Privacy</h2>
            <p>MediaLayer is not intended for users under the age of 13. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised effective date.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p className="mt-2 font-medium text-foreground">patanvadiyabansi6@gmail.com</p>
          </section>

        </div>
      </div>
    </div>
  );
}
