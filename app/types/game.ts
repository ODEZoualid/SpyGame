export interface GameState {
  room: {
    players: number;
    currentPlayer: number;
    category: string;
    word: string;
    spyIndex: number;
    currentQuestion: number;
    phase: 'setup' | 'reveal' | 'qa' | 'voting' | 'results';
    votes: number[];
  };
}

export interface Category {
  id: string;
  name: string;
  words: string[];
}

export interface PlayerVote {
  voter: number;
  target: number;
}
