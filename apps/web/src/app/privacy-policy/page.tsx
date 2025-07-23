
import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  const markdownContent = `
# Privacy Policy

**Last Updated: July 22, 2025**

Quiv.io ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website [Your Website URL Here] (the "Site") and use our trivia services.

Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Site.

**1. Information We Collect**

We may collect information about you in a variety of ways. The information we may collect on the Site includes:

*   **Personal Data:** Personally identifiable information, such as your username, email address, and any other information you voluntarily give to us when you register for the Site or participate in activities on the Site.
*   **Derivative Data:** Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.
*   **Financial Data:** We do not directly collect financial information. All payment transactions are processed by our third-party payment processor [e.g., Stripe, PayPal - if applicable].
*   **Data From Contests, Giveaways, and Surveys:** Personal and other information you may provide when entering contests or giveaways and/or responding to surveys.

**2. How We Use Your Information**

Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:

*   Create and manage your account.
*   Enable user-to-user communications.
*   Generate a personal profile about you to make your visit to the Site more personalized.
*   Increase the efficiency and operation of the Site.
*   Monitor and analyze usage and trends to improve your experience with the Site.
*   Notify you of updates to the Site.
*   Offer new products, services, and/or recommendations to you.
*   Perform other business activities as needed.
*   Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.
*   Process payments and refunds.
*   Request feedback and contact you about your use of the Site.
*   Resolve disputes and troubleshoot problems.
*   Respond to product and customer service requests.
*   Send you a newsletter or other communications.

**3. Disclosure of Your Information**

We may share information we have collected about you in certain situations. Your information may be disclosed as follows:

*   **By Law or to Protect Rights:** If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
*   **Third-Party Service Providers:** We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
*   **Marketing Communications:** With your consent, or with an opportunity for you to withdraw consent, we may share your information with third parties for marketing purposes, as permitted by law.
*   **Affiliates:** We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy.
*   **Business Partners:** We may share your information with our business partners to offer you certain products, services, or promotions.
*   **Other Third Parties:** We may share your information with advertisers and investors for the purpose of conducting general business analysis.
*   **Sale or Bankruptcy:** If we reorganize or sell all or a portion of our assets, undergo a merger, or are acquired by another entity, we may transfer your information to the successor entity. If we go out of business or enter bankruptcy, your information would be an asset transferred or acquired by a third party. You acknowledge that such transfers may occur and that the transferee may not honor the commitments we’ve made in this Privacy Policy.

**4. Security of Your Information**

We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.

**5. Policy for Children**

We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.

**6. Your Privacy Rights**

Depending on your location, you may have certain rights regarding your personal information, including:

*   The right to access your personal information.
*   The right to request correction of your personal information.
*   The right to request erasure of your personal information.
*   The right to object to the processing of your personal information.
*   The right to request restriction of processing your personal information.
*   The right to data portability.
*   The right to withdraw consent.

To exercise any of these rights, please contact us at support@quiv.io.

**7. Changes to This Privacy Policy**

We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this Privacy Policy frequently to be informed of how we are protecting your information.

**8. Contact Us**

If you have questions or comments about this Privacy Policy, please contact us at:
**support@quiv.io**
`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
    </div>
  );
};

export default PrivacyPolicyPage;
