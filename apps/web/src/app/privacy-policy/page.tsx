
import React from 'react';

const PrivacyPolicyPage: React.FC = () => (
  <main className="max-w-2xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold mb-4 text-white">Privacy Policy</h1>
    <p className="text-gray-600 mb-2">Last Updated: March 05, 2025</p>
    <p className="mb-6 text-gray-400">Quivio (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our trivia services. It also explains how advertising partners like Google AdSense use data and cookies on our site.</p>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">1. Information We Collect</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li><span className="font-medium">Personal Data:</span> Username, email address, and any other information you voluntarily give to us when you register or participate in activities.</li>
        <li><span className="font-medium">Derivative Data:</span> IP address, browser type, operating system, access times, and pages viewed before/after accessing the site.</li>
        <li><span className="font-medium">Financial Data:</span> We do not directly collect financial information. All payments are processed by third-party providers.</li>
        <li><span className="font-medium">Contest/Survey Data:</span> Information you provide when entering contests or responding to surveys.</li>
        <li><span className="font-medium">Game Data:</span> Game topics, scores, chat messages, and gameplay statistics to improve your experience.</li>
        <li><span className="font-medium">Device Information:</span> Device type, operating system, browser version, and screen resolution for optimization.</li>
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
        <li>Improve our trivia question generation and game mechanics</li>
        <li>Ensure compliance with our terms of service and community guidelines</li>
      </ul>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">3. Disclosure of Your Information</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>By law or to protect rights</li>
        <li>Third-party service providers (including advertising partners)</li>
        <li>Marketing communications (with consent)</li>
        <li>Affiliates and business partners</li>
        <li>Other third parties (e.g., advertisers, investors)</li>
        <li>Sale or bankruptcy</li>
        <li>Google Analytics and advertising services (with appropriate consent)</li>
      </ul>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">4. Cookies and Tracking Technologies</h2>
      <p className="text-gray-400 mb-3">We use cookies and similar tracking technologies to enhance your experience:</p>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li><span className="font-medium">Essential Cookies:</span> Required for basic site functionality and security</li>
        <li><span className="font-medium">Analytics Cookies:</span> Help us understand how visitors interact with our site</li>
        <li><span className="font-medium">Advertising Cookies:</span> Used to deliver relevant advertisements and measure their effectiveness</li>
        <li><span className="font-medium">Preference Cookies:</span> Remember your settings and preferences</li>
      </ul>
      <p className="text-gray-400 mt-3">You can control cookie settings through your browser preferences. However, disabling certain cookies may affect site functionality.</p>
      <p className="text-gray-400 mt-3">Google, as a third-party vendor, uses cookies to serve ads on our site. Google&apos;s use of the DoubleClick cookie enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet. Users may opt out of personalized advertising by visiting Google&apos;s Ads Settings.</p>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">5. Data Retention and Storage</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li><span className="font-medium">Account Data:</span> Retained until account deletion or 2 years of inactivity</li>
        <li><span className="font-medium">Game Data:</span> Stored for 90 days to improve game experience</li>
        <li><span className="font-medium">Chat Messages:</span> Retained for 30 days for moderation purposes</li>
        <li><span className="font-medium">Analytics Data:</span> Aggregated and anonymized after 26 months</li>
        <li><span className="font-medium">Log Files:</span> Retained for 90 days for security and debugging</li>
      </ul>
      <p className="text-gray-400 mt-2">Data is stored securely using industry-standard encryption and security measures.</p>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">6. Children's Privacy (COPPA Compliance)</h2>
      <p className="text-gray-400 mb-3">We are committed to protecting the privacy of children under 13:</p>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>We do not knowingly collect personal information from children under 13</li>
        <li>If you are under 13, please do not provide any personal information</li>
        <li>Parents or guardians can contact us to review, delete, or refuse further collection of their child's information</li>
        <li>We do not use personal information from children under 13 for advertising purposes</li>
        <li>If we discover we have collected information from a child under 13, we will delete it immediately</li>
      </ul>
      <p className="text-gray-400 mt-2">For questions about children's privacy, contact us at <a href="mailto:privacy@quivio.fun" className="text-blue-400 underline">privacy@quivio.fun</a>.</p>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">7. Your Privacy Rights (GDPR & CCPA)</h2>
      <p className="text-gray-400 mb-3">Depending on your location, you may have the following rights:</p>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>Access, correct, or erase your personal information</li>
        <li>Object to or restrict processing</li>
        <li>Data portability</li>
        <li>Withdraw consent</li>
        <li>Right to know what personal information is collected</li>
        <li>Right to opt-out of the sale of personal information</li>
        <li>Right to non-discrimination for exercising your privacy rights</li>
      </ul>
      <p className="text-gray-400 mt-2">To exercise these rights, contact us at <a href="mailto:privacy@quivio.fun" className="text-blue-400 underline">privacy@quivio.fun</a>.</p>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">8. Third-Party Services</h2>
      <p className="text-gray-400 mb-3">We use third-party services that may collect information:</p>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li><span className="font-medium">Google Analytics:</span> Website usage analytics</li>
        <li><span className="font-medium">Google AdSense:</span> Advertising services</li>
        <li><span className="font-medium">Cloudflare:</span> Content delivery and security</li>
        <li><span className="font-medium">Supabase:</span> Database and authentication services</li>
      </ul>
      <p className="text-gray-400 mt-2">These services have their own privacy policies, which we encourage you to review.</p>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">9. Security of Your Information</h2>
      <p className="text-gray-400">We use administrative, technical, and physical security measures to help protect your personal information, including encryption, secure servers, and regular security audits. However, no method of transmission is 100% secure.</p>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">10. International Data Transfers</h2>
      <p className="text-gray-400">Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.</p>
    </section>
    
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">11. Changes to This Policy</h2>
      <p className="text-gray-400">We may update this Privacy Policy from time to time. The updated version will be effective as soon as it is accessible. We will notify you of material changes via email or prominent notice on our website.</p>
    </section>
    
    <section>
      <h2 className="text-xl font-semibold mb-2 text-gray-100">12. Contact Us</h2>
      <p className="text-gray-400">If you have questions or comments about this Privacy Policy, please email us at <a href="mailto:privacy@quivio.fun" className="text-blue-400 underline">privacy@quivio.fun</a> or <a href="mailto:support@quivio.fun" className="text-blue-400 underline">support@quivio.fun</a>.</p>
    </section>
  </main>
);

export default PrivacyPolicyPage;
