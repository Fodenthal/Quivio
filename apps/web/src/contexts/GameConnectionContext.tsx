"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useGameConnection, UseGameConnectionReturn } from "@/hooks/useGameConnection";

const GameConnectionContext = createContext<UseGameConnectionReturn | undefined>(undefined);

interface GameConnectionProviderProps {
  children: ReactNode;
}

export const GameConnectionProvider: React.FC<GameConnectionProviderProps> = ({ children }) => {
  const gameConnection = useGameConnection();

  return (
    <GameConnectionContext.Provider value={gameConnection}>
      {children}
    </GameConnectionContext.Provider>
  );
};

export const useGameConnectionContext = (): UseGameConnectionReturn => {
  const context = useContext(GameConnectionContext);
  if (context === undefined) {
    throw new Error('useGameConnectionContext must be used within a GameConnectionProvider');
  }
  return context;
};
