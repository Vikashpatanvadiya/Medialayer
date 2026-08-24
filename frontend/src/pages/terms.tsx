import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Effective Date: August 21, 2026 · Last updated: August 21, 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <p>Welcome to MediaLayer. These Terms of Service ("Terms") govern your access to and use of <strong>https://medialayer.app</strong> ("Service"). By using MediaLayer, you agree to these Terms.</p>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Overview of Service</h2>
            <p>MediaLayer is a software platform that enables creators and editors to collaborate on video content and securely publish approved videos to <strong>YouTube</strong> and <strong>Instagram</strong> — without ever sharing account passwords.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Account Registration</h2>
            <p className="mb-3">To use MediaLayer:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must create an account</li>
              <li>You may sign in using Google OAuth</li>
              <li>You must be at least 13 years old</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You agree to provide accurate information and keep it updated</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Roles and Permissions</h2>
            <p className="mb-3">MediaLayer supports two main roles:</p>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground mb-1">Creator</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Connect a YouTube channel and an Instagram Professional account</li>
                  <li>Review, approve, or reject videos</li>
                  <li>Publish approved videos to YouTube or Instagram</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Editor</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Upload videos</li>
                  <li>Submit metadata and captions</li>
                  <li>View publish status for videos they submitted</li>
                  <li>Cannot connect accounts and cannot publish videos directly</li>
                </ul>
              </div>
            </div>
            <p className="mt-3">You are responsible for all actions performed under your account, including any content published to your connected YouTube or Instagram accounts.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Use of the YouTube API</h2>
            <p className="mb-3">MediaLayer integrates with YouTube via Google APIs. By using this feature:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You authorize MediaLayer to upload videos on your behalf</li>
              <li>We only use permissions required for video upload</li>
              <li>We do not access unrelated YouTube data</li>
            </ul>
            <p className="mt-3">Your use of YouTube features is also subject to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="text-primary underline">YouTube Terms of Service</a> and <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary underline">Google API policies</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Use of the Instagram API</h2>
            <p className="mb-3">MediaLayer integrates with Instagram using the <strong>Instagram API with Instagram Login</strong>. By connecting an Instagram account:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You confirm that you own, or are authorized to manage, the connected Instagram Professional (Business or Creator) account</li>
              <li>You authorize MediaLayer to create and publish Reels and feed posts on that account, only when you explicitly trigger a publish inside MediaLayer</li>
              <li>You acknowledge that a published post appears immediately on your public profile and that MediaLayer cannot delete it afterwards — deletions must be made from Instagram directly</li>
              <li>You accept that we request only <code className="text-sm bg-secondary px-1 rounded">instagram_business_basic</code> and <code className="text-sm bg-secondary px-1 rounded">instagram_business_content_publish</code>, and access no other Instagram data</li>
              <li>You may disconnect the account at any time from <strong>Dashboard → Profile</strong></li>
            </ul>
            <p className="mt-3">Instagram enforces its own publishing rate limits, media requirements and content rules. MediaLayer is not responsible for posts rejected, removed or rate-limited by Instagram.</p>
            <p className="mt-3">Your use of Instagram features is also subject to the <a href="https://help.instagram.com/581066165581870" target="_blank" rel="noreferrer" className="text-primary underline">Instagram Terms of Use</a>, the <a href="https://transparency.meta.com/policies/community-standards/" target="_blank" rel="noreferrer" className="text-primary underline">Meta Community Standards</a> and the <a href="https://developers.facebook.com/terms/" target="_blank" rel="noreferrer" className="text-primary underline">Meta Platform Terms</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. User Content</h2>
            <p className="mb-3">You retain ownership of all videos and content you upload. However, by using MediaLayer, you grant us a limited, non-exclusive right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Store your content</li>
              <li>Process it for workflow purposes</li>
              <li>Transmit it to YouTube or Instagram when you approve and publish it</li>
            </ul>
            <p className="mt-3">This licence exists only to operate the Service and ends when you delete the content. You are responsible for ensuring your content does not violate copyright — including music rights, which Instagram enforces strictly on Reels — and complies with applicable laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Acceptable Use</h2>
            <p className="mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload illegal or harmful content</li>
              <li>Upload content without proper rights</li>
              <li>Use MediaLayer to publish spam, engagement bait, or automated bulk content to Instagram or YouTube</li>
              <li>Connect an Instagram or YouTube account you do not control</li>
              <li>Attempt to bypass platform security</li>
              <li>Abuse or misuse the system</li>
            </ul>
            <p className="mt-3">Violation may result in account suspension, and may also result in Instagram or Google restricting your account independently of us.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Data &amp; Privacy</h2>
            <p>Your use of the Service is also governed by our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. You can remove your data at any time following our <Link href="/data-deletion" className="text-primary underline">Data Deletion Instructions</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Third-Party Services</h2>
            <p className="mb-3">MediaLayer relies on third-party services including Google (OAuth, YouTube API), Meta (Instagram Login and Content Publishing API) and cloud storage providers. We are not responsible for outages, API changes, policy changes or issues caused by third-party services. These platforms may change or withdraw API access at any time, which could limit or remove features of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Service Availability</h2>
            <p>We strive to keep the platform running smoothly, but we do not guarantee uninterrupted service. Features may change or be updated at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Termination</h2>
            <p className="mb-3">We may suspend or terminate your account if you violate these Terms or misuse the platform. You may stop using the Service at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">12. Limitation of Liability</h2>
            <p className="mb-3">MediaLayer is provided "as is". We are not liable for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data loss</li>
              <li>Failed or duplicated uploads and publishes</li>
              <li>Content removed, restricted or demonetized by YouTube or Instagram</li>
              <li>Suspension of your YouTube or Instagram account</li>
              <li>Third-party service issues</li>
              <li>Indirect or consequential damages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">13. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Service means you accept the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">14. Contact</h2>
            <p>For questions about these Terms:</p>
            <p className="mt-2 font-medium text-foreground">medialayer.app@gmail.com</p>
          </section>

        </div>
      </div>
    </div>
  );
}
