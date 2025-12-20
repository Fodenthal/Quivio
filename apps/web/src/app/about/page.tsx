
import React from 'react';

const AboutPage: React.FC = () => (
  <main className="max-w-2xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold mb-4 text-white">About Us</h1>
    <p className="mb-6 text-lg text-gray-400">
      Welcome to <span className="font-semibold">Quivio</span>, your ultimate destination for engaging and interactive trivia! We build fast, friendly trivia experiences for friends, classrooms, and teams.
    </p>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">Our Mission</h2>
      <p className="text-gray-400">To create a dynamic and accessible trivia platform that fosters learning, entertainment, and friendly competition. We strive to provide high-quality, diverse, and challenging questions across a wide range of topics, ensuring there&apos;s something for everyone.</p>
      <p className="text-gray-400 mt-3">We are a distributed team of educators, engineers, and trivia hosts working from New York and Berlin. We believe playful learning should be available to everyone on any device.</p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">What We Offer</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li><span className="font-medium">Diverse Categories:</span> From history and science to pop culture and sports, our questions cover a vast array of subjects.</li>
        <li><span className="font-medium">Real-time Gameplay:</span> Experience the thrill of live trivia with friends or other players.</li>
        <li><span className="font-medium">User-Friendly Interface:</span> A seamless and intuitive design that makes joining or creating games a breeze.</li>
        <li><span className="font-medium">Continuous Updates:</span> We&apos;re constantly adding new questions, features, and improvements to enhance your trivia journey.</li>
      </ul>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">Who We Serve</h2>
      <p className="text-gray-400">Hosts running pub nights, teachers looking for warmups, remote teams wanting icebreakers, and friends hanging out online. Quivio is designed to be light, fast, and safe for all ages.</p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2 text-gray-100">Join the Quivio Community</h2>
      <p className="text-gray-400">Embark on an exciting adventure of knowledge and fun! Whether you&apos;re a trivia enthusiast or just looking for a good time, there&apos;s a place for you here.</p>
    </section>
    <section>
      <h2 className="text-xl font-semibold mb-2 text-gray-100">Contact Us</h2>
      <p className="text-gray-400">Have questions, suggestions, or just want to say hello? Visit our <a href="/contact" className="text-blue-400 underline">Contact</a> page or email us at <a href="mailto:support@quivio.fun" className="text-blue-400 underline">support@quivio.fun</a>.</p>
    </section>
  </main>
);

export default AboutPage;
