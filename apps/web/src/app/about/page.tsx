
import React from 'react';

const AboutPage: React.FC = () => {
  const markdownContent = `
# About Us

Welcome to Quiv.io, your ultimate destination for engaging and interactive trivia!

At Quiv.io, we believe that learning should be fun, and what better way to test your knowledge than with exciting trivia challenges? Our platform is designed to bring friends, family, and fellow trivia enthusiasts together for a unique and competitive experience.

**Our Mission:**
To create a dynamic and accessible trivia platform that fosters learning, entertainment, and friendly competition. We strive to provide high-quality, diverse, and challenging questions across a wide range of topics, ensuring there's something for everyone.

**What We Offer:**
*   **Diverse Categories:** From history and science to pop culture and sports, our questions cover a vast array of subjects.
*   **Real-time Gameplay:** Experience the thrill of live trivia with friends or other players.
*   **User-Friendly Interface:** A seamless and intuitive design that makes joining or creating games a breeze.
*   **Continuous Updates:** We're constantly adding new questions, features, and improvements to enhance your trivia journey.

Join the Quiv.io community today and embark on an exciting adventure of knowledge and fun!

**Contact Us:**
Have questions, suggestions, or just want to say hello? Visit our [Contact Us](#) page or reach out to us directly at support@quiv.io.
`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
    </div>
  );
};

export default AboutPage;
