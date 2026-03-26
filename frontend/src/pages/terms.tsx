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
        <p className="text-muted-foreground mb-10">Effective Date: March 26, 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <p>Welcome to MediaLayer. These Terms of Service ("Terms") govern your access to and use of <strong>https://medialayer.vercel.app</strong> ("Service"). By using MediaLayer, you agree to these Terms.</p>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Overview of Service</h2>
            <p>MediaLayer is a software platform that enables creators and editors to collaborate on video uploads and securely publish content to YouTube without sharing account access.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Account Registration</h2>
            <p className="mb-3">To use MediaLayer:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must create an account</li>
              <li>You may sign in using Google OAuth</li>
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
                  <li>Connect YouTube channel</li>
                  <li>Review, approve, or reject videos</li>
                  <li>Publish videos to YouTube</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Editor</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Upload videos</li>
                  <li>Submit metadata</li>
                  <li>Cannot publish videos directly</li>
                </ul>
              </div>
            </div>
            <p className="mt-3">You are responsible for all actions performed under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Use of YouTube API</h2>
            <p className="mb-3">MediaLayer integrates with YouTube via Google APIs. By using this feature:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You authorize MediaLayer to upload videos on your behalf</li>
              <li>We only use permissions required for video upload</li>
              <li>We do not access unrelated YouTube data</li>
            </ul>
            <p className="mt-3">Your use of YouTube features is also subject to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="text-primary underline">YouTube Terms of Service</a> and <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary underline">Google API policies</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. User Content</h2>
            <p className="mb-3">You retain ownership of all videos and content you upload. However, by using MediaLayer, you grant us a limited right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Store your content</li>
              <li>Process it for workflow purposes</li>
              <li>Upload it to YouTube when approved</li>
            </ul>
            <p className="mt-3">You are responsible for ensuring your content does not violate copyright and complies with applicable laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Acceptable Use</h2>
            <p className="mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload illegal or harmful content</li>
              <li>Upload content without proper rights</li>
              <li>Attempt to bypass platform security</li>
              <li>Abuse or misuse the system</li>
            </ul>
            <p className="mt-3">Violation may result in account suspension.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Data & Privacy</h2>
            <p>Your use of the Service is also governed by our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. We take reasonable measures to protect your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Third-Party Services</h2>
            <p className="mb-3">MediaLayer relies on third-party services including Google (OAuth, YouTube API) and cloud storage providers. We are not responsible for outages or issues caused by third-party services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Service Availability</h2>
            <p>We strive to keep the platform running smoothly, but we do not guarantee uninterrupted service. Features may change or be updated at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Termination</h2>
            <p className="mb-3">We may suspend or terminate your account if you violate these Terms or misuse the platform. You may stop using the Service at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Limitation of Liability</h2>
            <p className="mb-3">MediaLayer is provided "as is". We are not liable for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data loss</li>
              <li>Failed uploads</li>
              <li>Third-party service issues</li>
              <li>Indirect or consequential damages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">12. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Service means you accept the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">13. Contact</h2>
            <p>For questions about these Terms:</p>
            <p className="mt-2 font-medium text-foreground">patanvadiyabansi6@gmail.com</p>
          </section>

        </div>
      </div>
    </div>
  );
}
