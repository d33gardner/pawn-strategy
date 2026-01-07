import { BOARD_SIZE, PLAYER_CONFIG } from '../constants';
import { GameState, Move, Pawn, Player, Position } from '../types';

export const getPawnAt = (board: Pawn[], pos: Position): Pawn | undefined => {
  return board.find((p) => p.position.x === pos.x && p.position.y === pos.y);
};

export const isPositionValid = (pos: Position): boolean => {
  return pos.x >= 0 && pos.x < BOARD_SIZE && pos.y >= 0 && pos.y < BOARD_SIZE;
};

export const getValidMoves = (pawn: Pawn, board: Pawn[]): Move[] => {
  const moves: Move[] = [];
  const direction = PLAYER_CONFIG[pawn.owner].direction;

  // Forward 1
  const forward1: Position = { x: pawn.position.x, y: pawn.position.y + direction };
  const canMoveForward1 = isPositionValid(forward1) && !getPawnAt(board, forward1);
  
  if (canMoveForward1) {
    moves.push({ from: pawn.position, to: forward1, isCapture: false });

    // Forward 2 (Allowed ONLY if pawn hasn't moved yet and path is clear)
    if (!pawn.hasMoved) {
      const forward2: Position = { x: pawn.position.x, y: pawn.position.y + direction * 2 };
      if (isPositionValid(forward2) && !getPawnAt(board, forward2)) {
        moves.push({ from: pawn.position, to: forward2, isCapture: false });
      }
    }
  }

  // Captures
  const captureOffsets = [-1, 1];
  captureOffsets.forEach((offset) => {
    const target: Position = { x: pawn.position.x + offset, y: pawn.position.y + direction };
    if (isPositionValid(target)) {
      const targetPawn = getPawnAt(board, target);
      if (targetPawn && targetPawn.owner !== pawn.owner) {
        moves.push({ from: pawn.position, to: target, isCapture: true });
      }
    }
  });

  return moves;
};

export const getAllPossibleMoves = (board: Pawn[], player: Player, movedPawnIds: string[] = []): { pawnId: string; move: Move }[] => {
  const playerPawns = board.filter((p) => p.owner === player && !movedPawnIds.includes(p.id));
  const allMoves: { pawnId: string; move: Move }[] = [];

  playerPawns.forEach((pawn) => {
    const moves = getValidMoves(pawn, board);
    moves.forEach((move) => {
      allMoves.push({ pawnId: pawn.id, move });
    });
  });

  return allMoves;
};

export const getMoveablePawnCount = (board: Pawn[], player: Player, movedPawnIds: string[] = []): number => {
  const playerPawns = board.filter((p) => p.owner === player && !movedPawnIds.includes(p.id));
  let moveableCount = 0;
  playerPawns.forEach((pawn) => {
    if (getValidMoves(pawn, board).length > 0) {
      moveableCount++;
    }
  });
  return moveableCount;
};

export const applyMove = (board: Pawn[], move: Move): { newBoard: Pawn[]; capturedId: string | null } => {
  const movingPawnIndex = board.findIndex(
    (p) => p.position.x === move.from.x && p.position.y === move.from.y
  );

  if (movingPawnIndex === -1) return { newBoard: board, capturedId: null };

  let newBoard = [...board];
  let capturedId = null;

  const targetPawnIndex = newBoard.findIndex(
    (p) => p.position.x === move.to.x && p.position.y === move.to.y
  );

  if (targetPawnIndex !== -1) {
    capturedId = newBoard[targetPawnIndex].id;
    newBoard.splice(targetPawnIndex, 1);
  }

  newBoard = newBoard.map((p) => {
    if (p.position.x === move.from.x && p.position.y === move.from.y) {
      return { ...p, position: move.to, hasMoved: true };
    }
    return p;
  });

  return { newBoard, capturedId };
};

export const calculateAdvancement = (board: Pawn[]): Pawn[] => {
  const nextBoard = board.map(p => ({ ...p }));
  const blockedPawnIds = new Set<string>();

  // 1. Check direct blocking (Head-to-head)
  for (const pawn of nextBoard) {
    const dir = PLAYER_CONFIG[pawn.owner].direction;
    const frontPos = { x: pawn.position.x, y: pawn.position.y + dir };
    const blocker = getPawnAt(nextBoard, frontPos);
    
    if (blocker) {
      blockedPawnIds.add(pawn.id);
    }
  }

  // 2. Check collision courses (White at y, Black at y+2, both moving to y+1)
  const whitePawns = nextBoard.filter(p => p.owner === Player.WHITE);
  for (const wp of whitePawns) {
     const potentialEnemyPos = { x: wp.position.x, y: wp.position.y + 2 };
     const enemy = getPawnAt(nextBoard, potentialEnemyPos);
     const midPos = { x: wp.position.x, y: wp.position.y + 1 };
     const midPawn = getPawnAt(nextBoard, midPos);

     if (enemy && enemy.owner === Player.BLACK && !midPawn) {
        blockedPawnIds.add(wp.id);
        blockedPawnIds.add(enemy.id);
     }
  }

  // 3. Execute
  return nextBoard.map(p => {
    if (blockedPawnIds.has(p.id)) return p;
    
    const dir = PLAYER_CONFIG[p.owner].direction;
    const nextY = p.position.y + dir;
    if (nextY < 0 || nextY >= BOARD_SIZE) return p;

    return {
      ...p,
      position: { ...p.position, y: nextY },
      hasMoved: true
    };
  });
};

export const checkWinCondition = (state: GameState): { winner: Player | null; reason: string | null } => {
  for (const pawn of state.board) {
    if (pawn.owner === Player.WHITE && pawn.position.y === PLAYER_CONFIG[Player.WHITE].targetRow) {
      return { winner: Player.WHITE, reason: 'White pawn reached the back row!' };
    }
    if (pawn.owner === Player.BLACK && pawn.position.y === PLAYER_CONFIG[Player.BLACK].targetRow) {
      return { winner: Player.BLACK, reason: 'Black pawn reached the back row!' };
    }
  }

  const whiteCount = state.board.filter(p => p.owner === Player.WHITE).length;
  const blackCount = state.board.filter(p => p.owner === Player.BLACK).length;
  
  if (whiteCount === 0 && blackCount === 0) return { winner: null, reason: 'Mutually Assured Destruction (Draw)' };
  if (whiteCount === 0) return { winner: Player.BLACK, reason: 'White has no pawns left!' };
  if (blackCount === 0) return { winner: Player.WHITE, reason: 'Black has no pawns left!' };

  if (state.currentRound > state.config.totalRounds) {
    if (state.scores[Player.WHITE] > state.scores[Player.BLACK]) {
      return { winner: Player.WHITE, reason: 'Max rounds reached. White has more captures.' };
    } else if (state.scores[Player.BLACK] > state.scores[Player.WHITE]) {
      return { winner: Player.BLACK, reason: 'Max rounds reached. Black has more captures.' };
    } else {
      return { winner: 'DRAW' as any, reason: 'Max rounds reached. Tie score.' };
    }
  }

  return { winner: null, reason: null };
};