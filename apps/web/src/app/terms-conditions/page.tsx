
import React from 'react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Quivio",
  description: "Read the Terms & Conditions for using Quivio's multiplayer trivia platform, including advertising and third-party services.",
  openGraph: {
    title: "Terms & Conditions | Quivio",
    description: "Terms for using Quivio, including ads and third-party services.",
  },
  twitter: {
    card: "summary",
    title: "Terms & Conditions | Quivio",
    description: "Terms for using Quivio, including ads and third-party services.",
  },
};

const TermsAndConditionsPage: React.FC = () => (
  <main className="max-w-2xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold mb-4 text-white">Terms &amp; Conditions</h1>
    <p className="text-gray-600 mb-2">Last Updated: March 05, 2025</p>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">1. Acceptance of Terms</h2>
      <p className="text-gray-400">By accessing or using the Quivio website (the &quot;Service&quot;), you agree to be bound by these Terms. If you disagree with any part, you may not access the Service.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">2. Accounts</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>Provide accurate, complete, and current information when creating an account.</li>
        <li>Safeguard your password and notify us of any unauthorized use.</li>
        <li>We may terminate accounts for violations of these Terms.</li>
      </ul>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">3. Intellectual Property</h2>
      <p className="text-gray-400">The Service and its original content are the exclusive property of Quivio and its licensors. Our trademarks and trade dress may not be used without written consent.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">4. Links to Other Websites</h2>
      <p className="text-gray-400">We may link to third-party websites. We are not responsible for their content or privacy practices. Please review their terms and policies.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">5. Termination</h2>
      <p className="text-gray-400">We may terminate or suspend your account immediately for any reason, including breach of these Terms. Upon termination, your right to use the Service ceases.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">6. Limitation of Liability</h2>
      <p className="text-gray-400">Quivio and its affiliates are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">7. Disclaimer</h2>
      <p className="text-gray-400">The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free service.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">8. Governing Law</h2>
      <p className="text-gray-400">These Terms are governed by the laws of your country, without regard to conflict of law provisions.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">9. Changes</h2>
      <p className="text-gray-400">We may update these Terms at any time. Material changes will be notified in advance. Continued use of the Service after changes means you accept the new terms.</p>
    </section>
    <section>
      <h2 className="text-xl font-semibold mb-2 text-gray-100">10. Contact Us</h2>
      <p className="text-gray-400">If you have questions about these Terms, please email us at <a href="mailto:support@quivio.fun" className="text-blue-400 underline">support@quivio.fun</a>.</p>
    </section>

    <section className="mt-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">11. Advertising and Third-Party Services</h2>
      <p className="text-gray-400">
        We use third-party services, including Google AdSense, to display ads and measure performance. These services may use cookies and similar technologies to deliver personalized ads and analytics. By using Quivio, you agree to the processing of data by these providers in accordance with their privacy policies. You can opt out of personalized ads in your Google Ads settings or by using industry opt-out tools.
      </p>
    </section>
  </main>
);

export default TermsAndConditionsPage;
