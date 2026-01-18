import { PLAYER_CONFIG, BOARD_SIZE } from '../constants';
import { GameState, Move, Player, Pawn } from '../types';
import { applyMove, getAllPossibleMoves, getMoveablePawnCount, getPawnAt } from './gameLogic';

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

/**
 * Smart Spawn Logic
 * AI prefers columns where:
 * 1. It has no existing pawns (coverage).
 * 2. The opponent has a clear path (defense).
 * 3. It can support an attack (reinforcement).
 */
export const getBestSpawnLocations = (board: Pawn[], player: Player, count: number): { x: number, y: number }[] => {
  const spawnRows = PLAYER_CONFIG[player].spawnRows;
  const opponent = player === Player.WHITE ? Player.BLACK : Player.WHITE;

  // Find all legal spawn spots
  const validSpots: { x: number, y: number, score: number }[] = [];

  spawnRows.forEach(y => {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!getPawnAt(board, { x, y })) {
        // Assess this spot
        let score = 0;

        // 1. Coverage: Do we have a pawn in this column already?
        const ourPawnsInCol = board.filter(p => p.owner === player && p.position.x === x);
        if (ourPawnsInCol.length === 0) {
          score += 50; // High priority to fill empty lanes
        } else {
          score -= 10; // slightly de-prioritize if we already have presence
        }

        // 2. Defense: Is there an enemy in this column advancing?
        const enemyInCol = board.find(p => p.owner === opponent && p.position.x === x);
        if (enemyInCol) {
          score += 30; // Block usage
          // Urgent defense if they are close
          const dist = Math.abs(y - enemyInCol.position.y);
          if (dist < 4) score += 20;
        }

        // 3. Randomness for variety
        score += Math.random() * 10;

        validSpots.push({ x, y, score });
      }
    }
  });

  // Sort by score
  validSpots.sort((a, b) => b.score - a.score);

  // Return top N
  return validSpots.slice(0, count).map(s => ({ x: s.x, y: s.y }));
};