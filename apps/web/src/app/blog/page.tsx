import React from 'react';
import Link from 'next/link';
// Uncomment when ready to add ads:
// import { BlogAd } from './components/BlogAd';

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
  },
  {
    slug: 'psychology-competition-trivia',
    title: 'The Psychology of Competition in Trivia Games: Why We Love to Compete',
    description: 'Understand why we love to compete and how competition enhances learning, memory, and engagement in trivia games.',
    readTime: '8 min read',
    category: 'Psychology',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'famous-trivia-champions',
    title: 'Famous Trivia Champions and Their Winning Strategies: Lessons from the Best',
    description: 'Learn from the world\'s best trivia players and discover the winning strategies that separate champions from casual players.',
    readTime: '10 min read',
    category: 'Strategy',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'trivia-improves-social-skills',
    title: 'How Trivia Games Improve Social Skills: Building Connections Through Knowledge',
    description: 'Explore how trivia games build communication, teamwork, and interpersonal skills in a fun, low-pressure environment.',
    readTime: '9 min read',
    category: 'Social',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'evolution-quiz-shows',
    title: 'The Evolution of Quiz Shows: From Radio to Streaming - A Century of Trivia Entertainment',
    description: 'Trace the fascinating journey of quiz shows through a century of technological innovation and cultural change.',
    readTime: '11 min read',
    category: 'Media',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'trivia-in-education',
    title: 'Trivia in Education: Using Games to Teach - Making Learning Fun and Effective',
    description: 'Discover how trivia games are transforming education by making learning engaging, interactive, and memorable.',
    readTime: '10 min read',
    category: 'Education',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'art-of-hosting-trivia',
    title: 'The Art of Hosting a Great Trivia Night: From Setup to Showtime',
    description: 'Master the skills needed to host engaging trivia events that players will want to return to week after week.',
    readTime: '12 min read',
    category: 'Hosting',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'sports-trivia',
    title: 'Sports Trivia: More Than Just Numbers - The Stories Behind the Stats',
    description: 'Discover how sports trivia goes beyond statistics to reveal human stories, cultural impact, and historical significance.',
    readTime: '9 min read',
    category: 'Sports',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'pop-culture-trivia',
    title: 'Pop Culture Trivia Through the Decades: How Entertainment Shapes Our World',
    description: 'Explore how pop culture has evolved from the 1920s to today, reflecting and shaping society through entertainment.',
    readTime: '10 min read',
    category: 'Entertainment',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'geography-trivia',
    title: 'Geography Trivia: Exploring the World - Beyond Maps and Capitals',
    description: 'Understand how geography connects people, places, and the natural world, revealing the complex relationships that shape our planet.',
    readTime: '11 min read',
    category: 'Geography',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'science-trivia',
    title: 'Science Trivia: From Atoms to Galaxies - The Wonders of Scientific Discovery',
    description: 'Explore the incredible journey of human discovery from quantum physics to cosmic exploration, showing how curiosity transforms our understanding.',
    readTime: '12 min read',
    category: 'Science',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'literature-trivia',
    title: 'Literature Trivia: Books That Shaped History - The Power of the Written Word',
    description: 'Discover how literature has influenced revolutions, social movements, and the way we think about ourselves and our world.',
    readTime: '11 min read',
    category: 'Literature',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'technology-trivia',
    title: 'Technology Trivia: The Digital Revolution - How Innovation Transformed Our World',
    description: 'Explore how human ingenuity created the digital world, from early computers to modern AI, transforming every aspect of our lives.',
    readTime: '11 min read',
    category: 'Technology',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'music-trivia',
    title: 'Music Trivia: The Universal Language - How Melodies Shape Our World',
    description: 'Discover how music has transcended cultural boundaries to become humanity\'s universal language, influencing everything from social movements to scientific discoveries.',
    readTime: '10 min read',
    category: 'Music',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'art-trivia',
    title: 'Art Trivia: The Visual Language of Humanity - How Images Shape Our World',
    description: 'Explore how visual expression has been humanity\'s most powerful tool for communication, cultural preservation, and social change throughout history.',
    readTime: '11 min read',
    category: 'Art',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'food-trivia',
    title: 'Food Trivia: The Cultural History of Cuisine - How Meals Shape Our World',
    description: 'Discover how cuisine has been one of humanity\'s most powerful tools for cultural exchange, social bonding, and historical preservation.',
    readTime: '10 min read',
    category: 'Food',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'nature-trivia',
    title: 'Nature Trivia: The Wonders of the Natural World - Exploring Earth\'s Incredible Diversity',
    description: 'Explore the incredible complexity and diversity of life on Earth, from the smallest microorganisms to the largest ecosystems.',
    readTime: '11 min read',
    category: 'Nature',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'space-trivia',
    title: 'Space Trivia: Exploring the Cosmos - Our Journey to the Stars',
    description: 'Discover humanity\'s incredible journey of cosmic discovery, from ancient stargazers to modern space exploration and our quest to understand the universe.',
    readTime: '12 min read',
    category: 'Space',
    publishDate: 'January 15, 2025',
    featured: false
  },
  {
    slug: 'philosophy-trivia',
    title: 'Philosophy Trivia: The Great Questions of Life - Exploring the Big Ideas',
    description: 'Explore how the greatest minds in history have grappled with life\'s most fundamental questions, from the nature of reality to the meaning of existence.',
    readTime: '11 min read',
    category: 'Philosophy',
    publishDate: 'January 15, 2025',
    featured: false
  }
];

const BlogPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-white">Quivio Blog</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Discover the fascinating world of trivia across 20 diverse categories, from sports and science to philosophy and space exploration. 
          Learn proven strategies, explore the science behind learning, and master the art of hosting engaging trivia events.
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

      {/* Ad placement example - uncomment when ready */}
      {/* <BlogAd slot="your-ad-slot-id" className="text-center" /> */}

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-100">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['History', 'Skills', 'Science', 'Psychology', 'Strategy', 'Social', 'Media', 'Education', 'Hosting', 'Sports', 'Entertainment', 'Geography', 'Literature', 'Technology', 'Music', 'Art', 'Food', 'Nature', 'Space', 'Philosophy'].map((category) => (
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
