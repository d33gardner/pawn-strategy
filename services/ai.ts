import { PLAYER_CONFIG } from '../constants';
import { GameState, Move, Player } from '../types';
import { applyMove, getAllPossibleMoves, getMoveablePawnCount } from './gameLogic';

// Helper to evaluate a board state for the AI
const evaluateBoard = (board: any[], player: Player, opponent: Player): number => {
  let score = 0;
  const targetRow = PLAYER_CONFIG[player].targetRow;

  board.forEach((p: any) => {
    if (p.owner === player) {
      // Points for advancing (closer to target is better)
      const distance = Math.abs(targetRow - p.position.y);
      score += (8 - distance) * 10;
      
      // Bonus for winning imminent
      if (distance === 0) score += 1000;
      if (distance === 1) score += 50;
    } else {
      // Penalty for opponent advancing
      const dist = Math.abs(PLAYER_CONFIG[opponent].targetRow - p.position.y);
      score -= (8 - dist) * 10;
      if (dist === 1) score -= 50;
    }
  });
  return score;
};

export const getBestMoves = (gameState: GameState): { pawnId: string; move: Move }[] => {
  const { board, currentPlayer, movedPawnIds } = gameState;
  
  // Pass movedPawnIds to ignore already moved pieces
  const allMoves = getAllPossibleMoves(board, currentPlayer, movedPawnIds);
  
  if (allMoves.length === 0) return [];

  // Calculate how many more moves we need this turn
  // Use getMoveablePawnCount with movedPawnIds to see how many distinct pawns are LEFT
  const remainingMoveable = getMoveablePawnCount(board, currentPlayer, movedPawnIds);
  
  // We want to make 1 move right now, but we need to ensure it's a good one.
  // The logic below selects a list, but we only return the list. App uses the first one.
  
  // Score each move individually
  const scoredMoves = allMoves.map(moveData => {
    const { newBoard, capturedId } = applyMove(board, moveData.move);
    let score = 0;
    
    // Immediate Win
    const pawn = newBoard.find(p => p.id === moveData.pawnId);
    if (pawn && pawn.position.y === PLAYER_CONFIG[currentPlayer].targetRow) {
      score += 10000;
    }

    // Capture
    if (capturedId) {
      score += 100;
    }

    // Advance
    if (pawn) {
      const dist = Math.abs(PLAYER_CONFIG[currentPlayer].targetRow - pawn.position.y);
      score += (8 - dist) * 5;
    }
    
    // Prefer 2-step moves if safe?
    // The distance logic above handles it. A 2 step move reduces distance by 2, so +10 score.

    return { ...moveData, score };
  });

  // Sort by score descending
  scoredMoves.sort((a, b) => b.score - a.score);

  // Since we only need to provide the *next* best move, we can just return the sorted list.
  // The App loop calls this function once per individual move action.
  return scoredMoves;
};