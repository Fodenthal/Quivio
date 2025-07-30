"use client";

import { useState, useEffect } from "react";

interface TrendingTopic {
  id: string;
  topic: string;
  popularity: number;
  category: string;
}

export const TrendingTopics = () => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  // Generate trending topics with natural language prompts
  const generateTrendingTopics = (): TrendingTopic[] => {
    const sampleTopics = [
      { topic: "Ancient civilizations and their mysterious disappearances", category: "History", popularity: 1247 },
      { topic: "The science behind climate change and global warming", category: "Science", popularity: 892 },
      { topic: "Space exploration and the search for extraterrestrial life", category: "Science", popularity: 734 },
      { topic: "World cuisines and their traditional cooking methods", category: "Food", popularity: 623 },
      { topic: "Renaissance art and its revolutionary techniques", category: "Art", popularity: 445 },
      { topic: "Modern technology and artificial intelligence", category: "Technology", popularity: 1089 },
      { topic: "Olympic sports and record-breaking achievements", category: "Sports", popularity: 567 },
      { topic: "Wildlife conservation and endangered species", category: "Nature", popularity: 389 },
      { topic: "Musical instruments from around the world", category: "Music", popularity: 456 },
      { topic: "Architecture marvels and engineering feats", category: "Architecture", popularity: 334 },
      { topic: "Psychology and human behavior patterns", category: "Psychology", popularity: 578 },
      { topic: "World War II and its lasting impact on society", category: "History", popularity: 712 },
      { topic: "Cryptocurrency and blockchain technology", category: "Technology", popularity: 823 },
      { topic: "Famous explorers and their incredible journeys", category: "Geography", popularity: 445 },
      { topic: "Marine biology and ocean ecosystems", category: "Science", popularity: 367 },
      { topic: "Literary classics and their timeless themes", category: "Literature", popularity: 523 },
      { topic: "Fashion trends throughout different decades", category: "Fashion", popularity: 434 },
      { topic: "Medical breakthroughs and modern healthcare", category: "Medicine", popularity: 656 },
      { topic: "Video game evolution and gaming culture", category: "Gaming", popularity: 789 },
      { topic: "Environmental sustainability and green living", category: "Environment", popularity: 445 },
      { topic: "Ancient mythology and legendary creatures", category: "Mythology", popularity: 567 },
      { topic: "Economics and global financial systems", category: "Economics", popularity: 345 },
      { topic: "Photography techniques and visual storytelling", category: "Art", popularity: 289 },
      { topic: "Space missions and astronaut experiences", category: "Science", popularity: 634 },
      { topic: "Cultural festivals and traditions worldwide", category: "Culture", popularity: 456 },
      { topic: "Renewable energy sources and sustainability", category: "Environment", popularity: 523 },
      { topic: "Famous inventors and their groundbreaking innovations", category: "Innovation", popularity: 467 },
      { topic: "Natural disasters and geological phenomena", category: "Geography", popularity: 389 },
      { topic: "Social media evolution and digital communication", category: "Technology", popularity: 678 },
      { topic: "Ancient languages and linguistic evolution", category: "Language", popularity: 234 },
      { topic: "Quantum physics and theoretical science", category: "Science", popularity: 456 },
      { topic: "Celebrity biographies and entertainment industry", category: "Entertainment", popularity: 723 },
      { topic: "Agricultural innovations and food production", category: "Agriculture", popularity: 345 },
      { topic: "Transportation evolution from horses to rockets", category: "Transportation", popularity: 445 },
      { topic: "Philosophy and ethical dilemmas in modern society", category: "Philosophy", popularity: 378 },
      { topic: "Weather patterns and meteorological phenomena", category: "Weather", popularity: 456 },
      { topic: "Dance forms and cultural expressions", category: "Culture", popularity: 289 },
      { topic: "Robotics and automation in daily life", category: "Technology", popularity: 567 },
      { topic: "Mental health awareness and therapeutic practices", category: "Health", popularity: 634 },
      { topic: "Comic books and superhero mythology", category: "Entertainment", popularity: 523 },
      { topic: "Volcanic activity and geological formations", category: "Geography", popularity: 367 },
      { topic: "Genetic engineering and biotechnology advances", category: "Science", popularity: 445 },
      { topic: "Traditional crafts and artisan techniques", category: "Crafts", popularity: 234 },
      { topic: "Urban planning and smart city development", category: "Urban", popularity: 389 },
      { topic: "Astronomy and celestial object discoveries", category: "Astronomy", popularity: 567 },
      { topic: "Educational systems and learning methodologies", category: "Education", popularity: 456 },
      { topic: "Alternative medicine and holistic healing", category: "Health", popularity: 345 }
    ];

    // Shuffle and return only 24 topics
    return sampleTopics
      .sort(() => Math.random() - 0.5)
      .slice(0, 24)
      .map((topic, index) => ({
        id: `topic-${index}`,
        ...topic
      }));
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    const colors = {
      'Science': 'text-blue-600 dark:text-blue-400',
      'Technology': 'text-purple-600 dark:text-purple-400',
      'History': 'text-amber-600 dark:text-amber-400',
      'Art': 'text-pink-600 dark:text-pink-400',
      'Sports': 'text-green-600 dark:text-green-400',
      'Music': 'text-indigo-600 dark:text-indigo-400',
      'Food': 'text-orange-600 dark:text-orange-400',
      'Nature': 'text-emerald-600 dark:text-emerald-400',
      'Psychology': 'text-violet-600 dark:text-violet-400',
      'Literature': 'text-rose-600 dark:text-rose-400',
      'Fashion': 'text-fuchsia-600 dark:text-fuchsia-400',
      'Medicine': 'text-cyan-600 dark:text-cyan-400',
      'Gaming': 'text-lime-600 dark:text-lime-400',
      'Environment': 'text-teal-600 dark:text-teal-400',
      'Mythology': 'text-yellow-600 dark:text-yellow-400',
      'Economics': 'text-slate-600 dark:text-slate-400',
      'Geography': 'text-stone-600 dark:text-stone-400',
      'Culture': 'text-red-600 dark:text-red-400',
      'Innovation': 'text-sky-600 dark:text-sky-400',
      'Language': 'text-zinc-600 dark:text-zinc-400',
      'Entertainment': 'text-pink-600 dark:text-pink-400',
      'Agriculture': 'text-green-600 dark:text-green-400',
      'Transportation': 'text-blue-600 dark:text-blue-400',
      'Philosophy': 'text-purple-600 dark:text-purple-400',
      'Weather': 'text-cyan-600 dark:text-cyan-400',
      'Health': 'text-emerald-600 dark:text-emerald-400',
      'Astronomy': 'text-indigo-600 dark:text-indigo-400',
      'Education': 'text-blue-600 dark:text-blue-400',
      'Crafts': 'text-amber-600 dark:text-amber-400',
      'Urban': 'text-slate-600 dark:text-slate-400'
    };
    
    return colors[category as keyof typeof colors] || 'text-gray-600 dark:text-gray-400';
  };

  // Initialize topics on mount
  useEffect(() => {
    setTopics(generateTrendingTopics());
  }, []);

  return (
    <div className="card p-6 animate-cursor-in">
      <h2 className="heading-cursor text-xl mb-6 text-center">
        Trending Topics
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {topics.map((topic, index) => {
          const categoryColor = getCategoryColor(topic.category);
          
          return (
            <div
              key={topic.id}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-light-background-elevated to-light-background-hover dark:from-dark-background-elevated dark:to-dark-background-hover border border-light-border-primary dark:border-dark-border-primary hover:border-light-border-hover dark:hover:border-dark-border-hover p-4 transition-all duration-300 cursor-pointer hover:shadow-cursor-lg hover:scale-105"
            >
              {/* Topic number */}
              <div className="absolute top-3 right-3">
                <span className="text-xs font-mono font-bold text-light-text-tertiary dark:text-dark-text-tertiary">
                  #{index + 1}
                </span>
              </div>
              
              {/* Category badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColor} bg-opacity-10 border border-current border-opacity-20`}>
                  {topic.category}
                </span>
              </div>
              
              {/* Topic title */}
              <h3 className="text-cursor text-sm font-semibold leading-tight mb-3 line-clamp-3 group-hover:text-light-accent-primary dark:group-hover:text-dark-accent-primary transition-colors duration-200">
                {topic.topic}
              </h3>
              
              {/* Popularity */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-cursor-secondary">
                  {topic.popularity.toLocaleString()} views
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 