import React, { useState } from 'react';
import { useGame } from './GameProvider';

export const GamePrompt: React.FC = () => {
  const { gameState, submitGuess } = useGame();
  const [guess, setGuess] = useState('');

  if (!gameState?.currentPrompt?.text) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-pulse">
          <div className="text-xl text-gray-600">Loading question...</div>
        </div>
      </div>
    );
  }

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      submitGuess(guess.trim());
      setGuess('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitGuess(e);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Question</h2>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <p className="text-xl text-gray-800 mb-4 leading-relaxed">
            {gameState.currentPrompt.text}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {gameState.currentPrompt.category}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full capitalize">
              {gameState.currentPrompt.difficulty}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitGuess} className="space-y-4">
        <div>
          <label htmlFor="guess" className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer
          </label>
          <div className="flex space-x-3">
            <input
              id="guess"
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your answer..."
              disabled={gameState.roundEnded}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!guess.trim() || gameState.roundEnded}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </form>

      {gameState.roundEnded && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800 mb-2">Round Ended!</div>
            <div className="text-sm text-gray-600">
              The correct answer was: <span className="font-medium text-green-600">{gameState.correctAnswer}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 