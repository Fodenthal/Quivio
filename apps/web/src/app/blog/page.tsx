import React from 'react';
import Link from 'next/link';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  category: string;
  publishDate: string;
  featured: boolean;
}

const blogPosts: BlogPost[] = [
  {
    slug: 'history-of-trivia-games',
    title: 'The History of Trivia Games: From Ancient Greece to Digital Age',
    description: 'Discover how trivia games evolved from philosophical debates in ancient Greece to the modern digital platforms we know today.',
    readTime: '6 min read',
    category: 'History',
    publishDate: 'January 15, 2025',
    featured: true
  },
  {
    slug: 'improve-trivia-skills',
    title: 'How to Improve Your Trivia Skills: Proven Strategies and Techniques',
    description: 'Master memory techniques, learning strategies, and practice methods to become a trivia champion.',
    readTime: '8 min read',
    category: 'Skills',
    publishDate: 'January 15, 2025',
    featured: true
  },
  {
    slug: 'science-behind-learning',
    title: 'The Science Behind Learning and Memory: Why Trivia Makes You Smarter',
    description: 'Explore the neuroscience of learning and discover how trivia games improve brain health and cognitive function.',
    readTime: '7 min read',
    category: 'Science',
    publishDate: 'January 15, 2025',
    featured: true
  }
];

const BlogPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-white">Quivio Blog</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Discover the fascinating world of trivia, learn proven strategies to improve your skills, 
          and explore the science behind learning and memory.
        </p>
      </div>

      {/* Featured Posts */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-100">Featured Articles</h2>
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <article key={post.slug} className="bg-white/5 backdrop-blur-xl rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                  <span className="text-gray-500 text-sm">{post.readTime}</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-white hover:text-blue-300 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>
                
                <p className="text-gray-400 mb-4 line-clamp-3">
                  {post.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">{post.publishDate}</span>
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-100">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['History', 'Skills', 'Science', 'Strategy'].map((category) => (
            <div key={category} className="bg-white/5 backdrop-blur-xl rounded-lg p-4 text-center border border-white/10 hover:border-white/20 transition-all duration-300">
              <h3 className="font-semibold text-white">{category}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* About the Blog */}
      <section className="bg-white/5 backdrop-blur-xl rounded-lg p-8 border border-white/10">
        <h2 className="text-2xl font-semibold mb-4 text-white">About Our Blog</h2>
        <p className="text-gray-400 mb-4">
          The Quivio blog is your go-to resource for everything trivia-related. Whether you're a casual player 
          looking to improve your skills, a trivia enthusiast interested in the history of the game, or someone 
          curious about the science behind learning and memory, we've got you covered.
        </p>
        <p className="text-gray-400">
          Our articles are written by trivia experts, educators, and researchers who are passionate about 
          sharing knowledge and helping you become a better trivia player. Stay tuned for regular updates 
          with new strategies, fascinating facts, and insights into the world of trivia.
        </p>
      </section>
    </main>
  );
};

export default BlogPage;
