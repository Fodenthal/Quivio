"use client";
import React, { useState, useRef, useEffect } from "react";
import { useDisplayName } from "../../contexts/DisplayNameContext";
import { useAuth } from "../../hooks/useAuth";
import Link from "next/link";

export interface GameUserDropdownProps {
  onLeaveGame: () => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

/**
 * Game-specific user dropdown component for Quivio
 * Extends the base UserDropdown with game-specific actions like Leave Game
 */
export const GameUserDropdown: React.FC<GameUserDropdownProps> = ({ 
  onLeaveGame,
  connectionStatus 
}) => {
  const { displayName, setDisplayName } = useDisplayName();
  const { user, loading } = useAuth();
  const [input, setInput] = useState<string>(displayName);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync input with displayName when it changes from context
  useEffect(() => {
    setInput(displayName);
  }, [displayName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced update
  const handleInputChange = (val: string) => {
    setInput(val);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      commitName(val);
    }, 500);
  };

  const commitName = (val: string) => {
    setDisplayName(val);
  };

  const handleBlur = () => {
    commitName(input);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLeaveGame = () => {
    setIsOpen(false);
    onLeaveGame();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center bg-white/80 hover:bg-white/90 border border-primary/30 shadow-md rounded-full px-3 py-2 space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        aria-label="User menu"
      >
        <span className="text-primary text-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        <span className="font-semibold text-black text-sm max-w-24 truncate hidden sm:block">
          {displayName}
        </span>
        <svg 
          className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] z-[9999] overflow-hidden">
          <div className="p-4">
            {/* Display Name Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="flex items-center bg-white/60 border border-gray/30 rounded-lg px-3 py-2">
                <span className="text-primary text-lg mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={input}
                  onChange={e => handleInputChange(e.target.value)}
                  onBlur={handleBlur}
                  maxLength={16}
                  placeholder="Enter display name"
                  className="bg-transparent border-none outline-none font-medium text-gray-800 text-sm flex-1 focus:ring-0 px-0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This name will be visible to other players
              </p>
            </div>

            {/* Game Actions Section */}
            {connectionStatus === 'connected' && (
              <>
                <div className="border-t border-gray/20 my-4"></div>
                <div className="mb-4">
                  <button
                    onClick={handleLeaveGame}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Leave Game
                  </button>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-gray/20 my-4"></div>

            {/* Auth Section */}
            <div className="space-y-2">
              {loading ? (
                <div className="w-full h-10 bg-gray/20 rounded-lg animate-pulse" />
              ) : user ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Signed in as <span className="font-medium text-gray-800">{user.email}</span>
                  </div>
                  <form action="/auth/signout" method="post" className="w-full">
                    <button
                      type="submit"
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Save your progress and settings
                  </p>
                  <Link
                    href="/login"
                    className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
