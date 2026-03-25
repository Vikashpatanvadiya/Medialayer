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
        <p className="text-muted-foreground mb-10">Last updated: March 25, 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using MediaLayer ("the platform", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h2>
            <p>MediaLayer is a video collaboration platform that allows YouTube creators and video editors to collaborate on video content. Editors upload videos for creator review, and creators can approve and publish videos to YouTube.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate information when registering.</li>
              <li>You are responsible for maintaining the security of your account and password.</li>
              <li>You must be at least 13 years old to use this platform.</li>
              <li>One person may not maintain more than one account.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Content Ownership</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain full ownership of all video content you upload to MediaLayer.</li>
              <li>By uploading content, you grant MediaLayer a limited license to store and transmit your content solely for the purpose of providing the service.</li>
              <li>You are solely responsible for ensuring you have the rights to upload and publish any content you submit.</li>
              <li>MediaLayer does not claim ownership of your content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Prohibited Content</h2>
            <p className="mb-3">You may not upload content that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violates any applicable law or regulation.</li>
              <li>Infringes on the intellectual property rights of others.</li>
              <li>Contains malware, viruses, or harmful code.</li>
              <li>Is defamatory, obscene, or harassing.</li>
              <li>Violates YouTube's Terms of Service when uploaded to YouTube.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. YouTube Integration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>By connecting your YouTube account, you authorize MediaLayer to upload videos to your channel on your behalf.</li>
              <li>You are solely responsible for content published to YouTube through MediaLayer.</li>
              <li>MediaLayer is not responsible for any violations of YouTube's Terms of Service resulting from content you upload.</li>
              <li>You can revoke YouTube access at any time from within the platform or via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-primary underline">Google Account Permissions</a>.</li>
              <li>Use of YouTube API Services through MediaLayer is subject to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="text-primary underline">YouTube Terms of Service</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Creator and Editor Relationship</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>MediaLayer facilitates collaboration between creators and editors but is not a party to any agreement between them.</li>
              <li>Creators are responsible for reviewing content before approving it for YouTube upload.</li>
              <li>Editors are responsible for ensuring submitted content meets the creator's requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Service Availability</h2>
            <p>MediaLayer is provided "as is" without warranty of any kind. We do not guarantee uninterrupted or error-free service. The platform runs on free-tier infrastructure and may experience downtime or slow response times.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, MediaLayer shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to loss of data, loss of revenue, or damage to your YouTube channel.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may delete your account at any time by contacting us. Upon termination, your content will be removed from our servers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the new Terms. We will update the "Last updated" date at the top of this page.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">12. Contact</h2>
            <p>For questions about these Terms, contact us at:</p>
            <p className="mt-2 font-medium text-foreground">medialayer.app@gmail.com</p>
          </section>

        </div>
      </div>
    </div>
  );
}
