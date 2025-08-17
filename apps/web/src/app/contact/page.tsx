
import React from 'react';

const ContactPage: React.FC = () => (
  <main className="max-w-2xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold mb-4 text-white">Contact Us</h1>
    <p className="mb-6 text-gray-400">We&apos;d love to hear from you! Whether you have a question, feedback, a suggestion for a new trivia category, or need assistance, our team is here to help.</p>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">How to Reach Us</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>
          <span className="font-medium">General Inquiries &amp; Support:</span> Email us at <a href="mailto:support@quivio.fun" className="text-blue-400 underline">support@quivio.fun</a>
        </li>
        <li>
          <span className="font-medium">Business &amp; Partnerships:</span> Contact us at <a href="mailto:partnerships@quivio.fun" className="text-blue-400 underline">partnerships@quivio.fun</a>
        </li>
        <li>
          <span className="font-medium">Feedback &amp; Suggestions:</span> Send ideas to <a href="mailto:feedback@quivio.fun" className="text-blue-400 underline">feedback@quivio.fun</a>
        </li>
      </ul>
    </section>
    <section>
      <h2 className="text-xl font-semibold mb-2 text-gray-100">Response Time</h2>
      <p className="text-gray-400">We aim to respond to all inquiries within 24-48 business hours.</p>
    </section>
    <p className="mt-8 text-gray-400">Thank you for being a part of the Quivio community!</p>
  </main>
);

export default ContactPage;
