"use client";

import { useState, useEffect } from "react";

interface TrendingTopic {
  id: string;
  topic: string;
  popularity: number;
  category: string;
  trending: "rising" | "falling";
  change: number; // Percentage change
}

export const TrendingTopics = () => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  // Generate trending topics with natural language prompts
  const generateTrendingTopics = (): TrendingTopic[] => {
    const sampleTopics = [
      { topic: "Ancient civilizations and their mysterious disappearances", category: "History", popularity: 1247 },
      { topic: "The science behind climate change and global warming", category: "Science", popularity: 892 },
      { topic: "Famous movie quotes and their cultural impact", category: "Entertainment", popularity: 1156 },
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

    // Shuffle and return a subset with trend data
    return sampleTopics
      .sort(() => Math.random() - 0.5)
      .slice(0, 48)
      .map((topic, index) => ({
        id: `topic-${index}`,
        ...topic,
        trending: Math.random() > 0.5 ? "rising" : "falling" as "rising" | "falling",
        change: Math.round((Math.random() * 30 - 15) * 100) / 100 // Random change between -15% to +15%
      }));
  };

  // Get trend display properties
  const getTrendDisplay = (trending: "rising" | "falling"): { 
    color: string; 
    arrow: string; 
    changeColor: string;
  } => {
    if (trending === "rising") {
      return { 
        color: "text-green-400", 
        arrow: "↑", 
        changeColor: "text-green-400" 
      };
    } else {
      return { 
        color: "text-red-400", 
        arrow: "↓", 
        changeColor: "text-red-400" 
      };
    }
  };

  // Initialize topics on mount
  useEffect(() => {
    setTopics(generateTrendingTopics());
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20 h-full">
      <h2 className="text-2xl font-bold text-text-main mb-4 text-center">
        Trending Topics
      </h2>
      
      <div className="h-[calc(100%-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-1">
        <div className="space-y-3 px-1 py-2">
          {topics.map((topic, index) => {
            const { color, arrow, changeColor } = getTrendDisplay(topic.trending);
            
            return (
              <div
                key={topic.id}
                className="flex items-start gap-2 py-3 hover:bg-white/5 transition-all duration-200 cursor-pointer border-b border-white/10 last:border-b-0"
              >
                <div className="flex-shrink-0 w-6 text-right">
                  <span className="text-text-secondary text-sm font-mono font-medium">
                    {index + 1}.
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-text-main text-sm font-medium leading-relaxed mb-1">
                    {topic.topic}
                  </p>
                  <p className="text-xs text-text-secondary opacity-75">
                    {topic.category}
                  </p>
                </div>
                
                <div className="flex flex-col items-end text-right flex-shrink-0">
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`text-sm font-bold ${color}`}>
                      {arrow}
                    </span>
                    <span className={`text-xs font-medium ${changeColor}`}>
                      {topic.change > 0 ? `+${topic.change}` : topic.change}%
                    </span>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {topic.popularity.toLocaleString()} plays
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 