'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '@/app/types/game';
import { useGameState } from '@/app/hooks/useGameState';
import CircularTimer from './CircularTimer';
import PlayerRevealScreen from './PlayerRevealScreen';
import VotingScreen from './VotingScreen';
import ResultsScreen from './ResultsScreen';

interface GameFlowProps {
  gameState: GameState;
  onBackToHome: () => void;
}

export default function GameFlow({ gameState, onBackToHome }: GameFlowProps) {
  const { nextQuestion, submitVote, finishVoting } = useGameState();
  const [currentPhase, setCurrentPhase] = useState(gameState.room.phase);

  useEffect(() => {
    setCurrentPhase(gameState.room.phase);
  }, [gameState.room.phase]);

  const handleNextQuestion = () => {
    nextQuestion();
  };

  const handleVote = (voter: number, target: number) => {
    submitVote(voter, target);
  };

  const handleFinishVoting = () => {
    finishVoting();
  };

  if (currentPhase === 'reveal' || currentPhase === 'qa') {
    return (
      <PlayerRevealScreen
        gameState={gameState}
        onNextQuestion={handleNextQuestion}
        onBackToHome={onBackToHome}
      />
    );
  }

  if (currentPhase === 'voting') {
    return (
      <VotingScreen
        gameState={gameState}
        onVote={handleVote}
        onFinishVoting={handleFinishVoting}
        onBackToHome={onBackToHome}
      />
    );
  }

  if (currentPhase === 'results') {
    return (
      <ResultsScreen
        gameState={gameState}
        onBackToHome={onBackToHome}
      />
    );
  }

  return null;
}
