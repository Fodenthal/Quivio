
import React from 'react';

const ContactPage: React.FC = () => {
  const markdownContent = `
# Contact Us

We'd love to hear from you! Whether you have a question, feedback, a suggestion for a new trivia category, or need assistance, our team is here to help.

**How to Reach Us:**

*   **General Inquiries & Support:**
    For any general questions, technical support, or issues you might be experiencing with the platform, please email us at:
    **support@quiv.io**

*   **Business & Partnerships:**
    For business inquiries, potential collaborations, or partnership opportunities, please contact us at:
    **partnerships@quiv.io**

*   **Feedback & Suggestions:**
    Your input is invaluable! If you have ideas for new features, improvements, or trivia topics, please send them to:
    **feedback@quiv.io**

**We aim to respond to all inquiries within 24-48 business hours.**

Thank you for being a part of the Quiv.io community!
`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
    </div>
  );
};

export default ContactPage;
