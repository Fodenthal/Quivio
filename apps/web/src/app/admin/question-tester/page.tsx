'use client';

import { useState } from 'react';

interface GeneratedQuestion {
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  category: string;
  difficulty: number;
}

export default function QuestionTesterPage() {
  const [topic, setTopic] = useState('History');
  const [difficulty, setDifficulty] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setQuestion(null);

    try {
      const response = await fetch('/api/test-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, difficulty }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate question');
      }

      setQuestion(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">Question Generation Test Harness</h1>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 'Quantum Physics'"
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">Difficulty: {difficulty}</label>
            <input
              id="difficulty"
              type="range"
              min="1"
              max="5"
              step="1"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Question'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-900 border border-red-700 rounded-md text-center">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {question && (
          <div className="mt-8 p-6 bg-gray-700 rounded-lg space-y-4 border border-gray-600">
            <div>
              <h3 className="font-semibold text-purple-300">Question:</h3>
              <p className="text-lg">{question.question}</p>
            </div>
            <div>
              <h3 className="font-semibold text-purple-300">Correct Answer:</h3>
              <p className="text-green-400 font-mono">{question.correctAnswer}</p>
            </div>
            <div>
              <h3 className="font-semibold text-purple-300">Acceptable Answers:</h3>
              <ul className="list-disc list-inside space-y-1">
                {question.acceptableAnswers.map((ans, i) => (
                  <li key={i} className="font-mono">{ans}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-300">Category:</h3>
              <p>{question.category}</p>
            </div>
            <div>
              <h3 className="font-semibold text-purple-300">Difficulty:</h3>
              <p>{question.difficulty}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
