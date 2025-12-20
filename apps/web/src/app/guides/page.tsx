import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Guides | Quivio",
  description: "Quivio guides and tutorials are on the way.",
  robots: {
    index: false,
    follow: false,
  },
};

const GuidesPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-white">Quivio Guides</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Learn how to get the most out of Quivio with our comprehensive guides and tutorials.
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white/5 backdrop-blur-xl rounded-lg p-12 text-center border border-white/10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Guides Coming Soon</h2>
          <p className="text-gray-400 mb-6">
            We're working on detailed guides to help you master Quivio and become a trivia champion.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Getting Started</h3>
            <p className="text-gray-400 text-sm">
              Complete beginner's guide to creating your first game and understanding the basics.
            </p>
          </div>
          
          <div className="bg-white/5 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Advanced Features</h3>
            <p className="text-gray-400 text-sm">
              Master advanced settings, custom topics, and AI-powered question generation.
            </p>
          </div>
          
          <div className="bg-white/5 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Hosting Tips</h3>
            <p className="text-gray-400 text-sm">
              Learn how to be the best trivia host and create engaging game experiences.
            </p>
          </div>
          
          <div className="bg-white/5 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Troubleshooting</h3>
            <p className="text-gray-400 text-sm">
              Common issues and solutions to keep your games running smoothly.
            </p>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Link 
            href="/blog" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Read Our Blog
          </Link>
          <Link 
            href="/" 
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start Playing
          </Link>
        </div>
      </div>
    </main>
  );
};

export default GuidesPage;
