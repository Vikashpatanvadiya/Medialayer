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
        <p className="text-muted-foreground mb-10">Effective Date: August 21, 2026 · Last updated: August 21, 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <p>MediaLayer ("we", "us") operates the website <strong>https://medialayer.app</strong> and provides a platform where creators and video editors collaborate on video content and publish approved videos to <strong>YouTube</strong> and <strong>Instagram</strong>. We are committed to protecting your privacy and to being transparent about how your data is handled.</p>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>

            <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Name (if provided)</li>
              <li>Email address (via Google Sign-In or manual registration)</li>
            </ul>

            <h3 className="font-semibold text-foreground mb-2">Google / YouTube Account Data</h3>
            <p className="mb-2">When you connect YouTube using Google OAuth, we may access:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Your email address</li>
              <li>Basic profile information</li>
              <li>Permission to upload videos to your YouTube channel (only if granted)</li>
            </ul>

            <h3 className="font-semibold text-foreground mb-2">Instagram Account Data</h3>
            <p className="mb-2">When you connect an Instagram Professional (Business or Creator) account using <strong>Instagram Business Login</strong>, we receive and store only:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Your Instagram-scoped user ID</li>
              <li>Your Instagram username</li>
              <li>Your account type (Business or Creator)</li>
              <li>Your profile picture URL</li>
              <li>The list of permissions you granted</li>
              <li>A long-lived access token, stored encrypted</li>
            </ul>
            <p className="mb-4">We do <strong>not</strong> access your Instagram password, direct messages, comments, follower lists, insights, or any media you did not publish through MediaLayer.</p>

            <h3 className="font-semibold text-foreground mb-2">Video &amp; Content Data</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Uploaded video files and thumbnails (stored privately)</li>
              <li>Video metadata (title, description, tags, captions)</li>
              <li>Approval status, feedback and workflow data</li>
              <li>Publish records — post type, caption, status, and the resulting YouTube or Instagram permalink</li>
            </ul>

            <h3 className="font-semibold text-foreground mb-2">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Actions performed on the platform (upload, approve, reject, publish)</li>
              <li>Logs for security and debugging purposes</li>
            </ul>
            <p className="mt-3">Access tokens, authorization codes and application secrets are never written to logs.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use your data strictly to provide core functionality:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Enable secure collaboration between editors and creators</li>
              <li>Allow creators to review and approve videos</li>
              <li>Upload approved videos to your YouTube channel</li>
              <li>Publish approved videos to your Instagram account as Reels or feed posts</li>
              <li>Display which account a video was published to, and its resulting link</li>
              <li>Send notifications related to workflow activity</li>
              <li>Maintain system security and prevent misuse</li>
            </ul>
            <p className="mt-3">We do not use your data for advertising, profiling, ad targeting, or tracking across other sites and apps. We do not sell your data, and we do not use it to train machine-learning models.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Google API Data Usage</h2>
            <p className="mb-3">MediaLayer uses Google APIs solely to enable video uploads to your YouTube channel.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We only request the minimum required permission (<code className="text-sm bg-secondary px-1 rounded">youtube.upload</code>)</li>
              <li>We do not access or modify any other YouTube data</li>
              <li>We do not store or share your YouTube content outside of the intended workflow</li>
            </ul>
            <p className="mt-3">MediaLayer's use of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Instagram &amp; Meta Platform Data Usage</h2>
            <p className="mb-3">MediaLayer uses the <strong>Instagram API with Instagram Login</strong> solely to publish content you have approved to your own Instagram Professional account. No Facebook Login, Facebook Page or Page access token is involved in this flow.</p>
            <p className="mb-3">We request exactly two permissions, and no others:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li><code className="text-sm bg-secondary px-1 rounded">instagram_business_basic</code> — to read your account ID, username, account type and profile picture, so the app can show you which account it is about to publish to</li>
              <li><code className="text-sm bg-secondary px-1 rounded">instagram_business_content_publish</code> — to create and publish a Reel or feed post on your behalf after you approve it</li>
            </ul>
            <p className="mb-3">Permissions for comments, messaging, insights and mentions are deliberately not requested.</p>
            <p className="mb-3">We commit that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nothing is ever published to your Instagram account without an explicit action by you inside MediaLayer</li>
              <li>Instagram data is never sold, rented, licensed or transferred to data brokers, ad networks or any third party</li>
              <li>Instagram data is used only to deliver the publishing feature you signed up for</li>
              <li>Your access token is encrypted at rest and is never exposed to your browser, to your editors, or to anyone else</li>
              <li>Deleting your account or disconnecting Instagram permanently erases the token and all Instagram profile data we hold</li>
            </ul>
            <p className="mt-3">Our use of information received from the Meta Platform adheres to the <a href="https://developers.facebook.com/terms/" target="_blank" rel="noreferrer" className="text-primary underline">Meta Platform Terms</a> and <a href="https://developers.facebook.com/devpolicy/" target="_blank" rel="noreferrer" className="text-primary underline">Developer Policies</a>. Your use of Instagram remains subject to the <a href="https://help.instagram.com/581066165581870" target="_blank" rel="noreferrer" className="text-primary underline">Instagram Terms of Use</a> and <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noreferrer" className="text-primary underline">Instagram Privacy Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Data Storage &amp; Security</h2>
            <p className="mb-3">We implement strong security practices:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All OAuth and Instagram access tokens are encrypted at rest using AES-256-CBC</li>
              <li>Tokens are never returned to the frontend — the API exposes only the account ID, username and account type</li>
              <li>Video files are stored privately on Cloudinary with authenticated access</li>
              <li>Playback uses temporary signed URLs that expire after 1 hour; no public video links exist</li>
              <li>The OAuth <code className="text-sm bg-secondary px-1 rounded">state</code> parameter is single-use, expiring, and bound server-side to your user account, so an authorization cannot be replayed or attributed to the wrong user</li>
              <li>Backend systems enforce JWT authentication and role-based authorization on every request</li>
              <li>Every publish and disconnect re-verifies that the connected account belongs to the signed-in user</li>
            </ul>
            <p className="mt-3">We take reasonable measures to protect your data from unauthorized access. No system is perfectly secure, but we will notify affected users without undue delay if a breach affecting personal data occurs.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Data Sharing</h2>
            <p className="mb-3">We do not sell, rent, or trade your personal data. We only share data with trusted services required to operate the platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cloudinary</strong> — secure video and thumbnail storage</li>
              <li><strong>Google APIs</strong> — YouTube uploads</li>
              <li><strong>Meta / Instagram APIs</strong> — Instagram publishing</li>
              <li><strong>Neon</strong> — database hosting</li>
              <li><strong>Vercel</strong> and <strong>Render</strong> — application hosting</li>
            </ul>
            <p className="mt-3">These services are used strictly to deliver the product's functionality, never for data exploitation.</p>
            <p className="mt-3">Within your own workspace, an editor you have linked to your account can see the publish status and resulting link for videos they submitted. Editors never receive your tokens and cannot publish on your behalf.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Video files are stored only as long as needed for workflow purposes</li>
              <li>Users may delete videos at any time</li>
              <li>Instagram and YouTube connection data is retained until you disconnect the account or delete your MediaLayer account, and is erased immediately on either action</li>
              <li>Account data is retained until you delete your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Your Rights &amp; Control</h2>
            <p className="mb-3">You have full control over your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You can disconnect your Instagram account at any time from <strong>Dashboard → Profile</strong>, which permanently deletes the stored token and profile data</li>
              <li>You can revoke MediaLayer's Instagram access from the Instagram app under <strong>Settings and privacy → Apps and websites</strong></li>
              <li>You can revoke Google access anytime via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-primary underline">Google Account settings</a></li>
              <li>You can disconnect your YouTube channel from within the platform</li>
              <li>You can delete videos from the platform</li>
              <li>You can request full account deletion — see our <Link href="/data-deletion" className="text-primary underline">Data Deletion Instructions</Link></li>
              <li>You can request a copy of the personal data we hold about you by emailing us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Third-Party Services</h2>
            <p className="mb-3">MediaLayer integrates with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Google (OAuth and YouTube API)</a></li>
              <li><a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noreferrer" className="text-primary underline">Meta / Instagram (Instagram Business Login and Content Publishing API)</a></li>
              <li><a href="https://cloudinary.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Cloudinary</a> — secure video storage</li>
              <li><a href="https://neon.tech/privacy-policy" target="_blank" rel="noreferrer" className="text-primary underline">Neon</a> — database hosting</li>
              <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="text-primary underline">Vercel</a> — frontend hosting</li>
              <li><a href="https://render.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Render</a> — backend hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Children's Privacy</h2>
            <p>MediaLayer is not intended for users under the age of 13. We do not knowingly collect data from children. Instagram publishing additionally requires an Instagram Professional account, which Instagram restricts to users aged 13 and over.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. International Users</h2>
            <p>MediaLayer is operated from India and our infrastructure providers store data in the United States and the European Union. By using the Service you consent to your data being processed in these locations. If you are in the EEA or UK, our legal basis for processing is the performance of our contract with you and, for security logging, our legitimate interest in keeping the platform safe.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised effective date. Material changes affecting how we use Instagram or YouTube data will be announced in-app before they take effect.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">13. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, or wish to exercise any of the rights above, please contact us at:</p>
            <p className="mt-2 font-medium text-foreground">medialayer.app@gmail.com</p>
          </section>

        </div>
      </div>
    </div>
  );
}
