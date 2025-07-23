
import React from 'react';

const TermsAndConditionsPage: React.FC = () => (
  <main className="max-w-2xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold mb-4 text-white">Terms &amp; Conditions</h1>
    <p className="text-gray-600 mb-2">Last Updated: July 22, 2025</p>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">1. Acceptance of Terms</h2>
      <p className="text-gray-400">By accessing or using the Quizza.io website (the &quot;Service&quot;), you agree to be bound by these Terms. If you disagree with any part, you may not access the Service.</p>
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
      <p className="text-gray-400">The Service and its original content are the exclusive property of Quizza.io and its licensors. Our trademarks and trade dress may not be used without written consent.</p>
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
      <p className="text-gray-400">Quizza.io and its affiliates are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
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
      <p className="text-gray-400">If you have questions about these Terms, please email us at <a href="mailto:support@quizza.io" className="text-blue-400 underline">support@quizza.io</a>.</p>
    </section>
  </main>
);

export default TermsAndConditionsPage;
