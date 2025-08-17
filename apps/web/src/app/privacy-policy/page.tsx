
import React from 'react';

const PrivacyPolicyPage: React.FC = () => (
  <main className="max-w-2xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold mb-4 text-white">Privacy Policy</h1>
    <p className="text-gray-600 mb-2">Last Updated: July 22, 2025</p>
    <p className="mb-6 text-gray-400">Quivio (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our trivia services.</p>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">1. Information We Collect</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li><span className="font-medium">Personal Data:</span> Username, email address, and any other information you voluntarily give to us when you register or participate in activities.</li>
        <li><span className="font-medium">Derivative Data:</span> IP address, browser type, operating system, access times, and pages viewed before/after accessing the site.</li>
        <li><span className="font-medium">Financial Data:</span> We do not directly collect financial information. All payments are processed by third-party providers.</li>
        <li><span className="font-medium">Contest/Survey Data:</span> Information you provide when entering contests or responding to surveys.</li>
      </ul>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">2. How We Use Your Information</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>Create and manage your account</li>
        <li>Enable user-to-user communications</li>
        <li>Personalize your experience</li>
        <li>Monitor and analyze usage and trends</li>
        <li>Notify you of updates</li>
        <li>Offer new products/services</li>
        <li>Prevent fraud and protect against criminal activity</li>
        <li>Process payments and refunds</li>
        <li>Request feedback and contact you</li>
        <li>Send newsletters or communications</li>
      </ul>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">3. Disclosure of Your Information</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>By law or to protect rights</li>
        <li>Third-party service providers</li>
        <li>Marketing communications (with consent)</li>
        <li>Affiliates and business partners</li>
        <li>Other third parties (e.g., advertisers, investors)</li>
        <li>Sale or bankruptcy</li>
      </ul>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">4. Security of Your Information</h2>
      <p className="text-gray-400">We use administrative, technical, and physical security measures to help protect your personal information. However, no method of transmission is 100% secure.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">5. Policy for Children</h2>
      <p className="text-gray-400">We do not knowingly collect information from children under 13. If you become aware of such data, please contact us.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">6. Your Privacy Rights</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>Access, correct, or erase your personal information</li>
        <li>Object to or restrict processing</li>
        <li>Data portability</li>
        <li>Withdraw consent</li>
      </ul>
      <p className="text-gray-400 mt-2">To exercise these rights, contact us at <a href="mailto:support@quivio.fun" className="text-blue-400 underline">support@quivio.fun</a>.</p>
    </section>
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">7. Changes to This Policy</h2>
      <p className="text-gray-400">We may update this Privacy Policy from time to time. The updated version will be effective as soon as it is accessible. Please review this page regularly.</p>
    </section>
    <section>
      <h2 className="text-xl font-semibold mb-2 text-gray-100">8. Contact Us</h2>
      <p className="text-gray-400">If you have questions or comments about this Privacy Policy, please email us at <a href="mailto:support@quivio.fun" className="text-blue-400 underline">support@quivio.fun</a>.</p>
    </section>
  </main>
);

export default PrivacyPolicyPage;
