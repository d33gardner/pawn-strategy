import React from 'react';
import { GameState, Move, Pawn, Phase, Player, Position, PlacementMethod } from '../types';
import { BOARD_SIZE, PLAYER_CONFIG } from '../constants';
import { MousePointer2, Shield } from 'lucide-react';

interface BoardProps {
  gameState: GameState;
  selectedPawnId: string | null;
  validMoves: Move[];
  onSquareClick: (pos: Position) => void;
  onPawnClick: (pawn: Pawn) => void;
}

const Board: React.FC<BoardProps> = ({
  gameState,
  selectedPawnId,
  validMoves,
  onSquareClick,
  onPawnClick,
}) => {
  const getSquareColor = (x: number, y: number) => {
    const isBlack = (x + y) % 2 === 1;
    return isBlack ? 'bg-slate-700' : 'bg-slate-300';
  };

  const getPawnAt = (x: number, y: number) => {
    return gameState.board.find((p) => p.position.x === x && p.position.y === y);
  };

  const isMoveTarget = (x: number, y: number) => {
    return validMoves.some((m) => m.to.x === x && m.to.y === y);
  };

  const isSpawnTarget = (x: number, y: number) => {
    if (gameState.phase !== Phase.SPAWNING) return false;
    const row = PLAYER_CONFIG[gameState.currentPlayer].baseRow;
    return y === row && !getPawnAt(x, y);
  };

  const renderSquare = (x: number, y: number) => {
    const pawn = getPawnAt(x, y);
    const isTarget = isMoveTarget(x, y);
    const isSpawn = isSpawnTarget(x, y);
    const isSelected = pawn && pawn.id === selectedPawnId;
    const hasMoved = pawn && gameState.movedPawnIds.includes(pawn.id);

    // Logic to show pawns that CANNOT move as dimmed/disabled
    const isCurrentPlayerPawn = pawn && pawn.owner === gameState.currentPlayer;
    const isTurn = gameState.phase === Phase.PLAYING;
    const shouldDim = isTurn && isCurrentPlayerPawn && hasMoved;

    // Coordinate labels
    const showRank = x === 0;
    const showFile = y === 0;

    return (
      <div
        key={`${x}-${y}`}
        className={`relative w-full h-full flex items-center justify-center ${getSquareColor(
          x,
          y
        )} cursor-pointer transition-colors duration-150
        ${isTarget ? 'ring-inset ring-4 ring-green-400/50' : ''}
        ${isSpawn ? 'ring-inset ring-4 ring-blue-400/50 hover:bg-blue-200' : ''}
        `}
        onClick={() => onSquareClick({ x, y })}
      >
        {/* Labels */}
        {showRank && (
          <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold ${getSquareColor(x, y).includes('700') ? 'text-slate-400' : 'text-slate-500'}`}>
            {y + 1}
          </span>
        )}
        {showFile && (
          <span className={`absolute bottom-0 right-1 text-[10px] font-bold ${getSquareColor(x, y).includes('700') ? 'text-slate-400' : 'text-slate-500'}`}>
            {String.fromCharCode(97 + x)}
          </span>
        )}

        {/* Move Indicator Dot */}
        {isTarget && !pawn && (
          <div className="w-4 h-4 rounded-full bg-green-500 opacity-60 pointer-events-none" />
        )}

        {/* Spawn Indicator */}
        {isSpawn && (
          <div className="w-4 h-4 rounded-full bg-blue-500 opacity-40 animate-pulse pointer-events-none" />
        )}

        {/* Pawn */}
        {pawn && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!hasMoved) onPawnClick(pawn);
            }}
            className={`
              w-4/5 h-4/5 rounded-full shadow-lg flex items-center justify-center transform transition-all
              ${PLAYER_CONFIG[pawn.owner].color} 
              ${PLAYER_CONFIG[pawn.owner].textColor}
              border-2 ${PLAYER_CONFIG[pawn.owner].borderColor}
              ${isSelected ? 'scale-110 ring-4 ring-yellow-400 z-10' : ''}
              ${!isSelected && !hasMoved && 'hover:scale-105'}
              ${isTarget ? 'ring-4 ring-red-500' : '' /* Capture target */}
              ${shouldDim ? 'opacity-50 cursor-not-allowed grayscale' : ''}
            `}
          >
            {/* Icon or Graphic */}
            <div className="flex flex-col items-center -space-y-1 pointer-events-none">
              <div className="w-3 h-3 rounded-full bg-current opacity-80" />
              <div className="w-5 h-3 rounded-t-full bg-current" />
              <div className="w-6 h-1 rounded-full bg-current" />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Grid: Rows 7 down to 0
  const rows = [];
  for (let y = BOARD_SIZE - 1; y >= 0; y--) {
    const cols = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      cols.push(renderSquare(x, y));
    }
    rows.push(
      <div key={y} className="flex h-full w-full">
        {cols}
      </div>
    );
  }

  return (
    <div className="aspect-square w-full max-w-[600px] max-h-full bg-slate-800 p-2 rounded-lg shadow-2xl border border-slate-700 flex flex-col justify-center">
      <div className="flex flex-col w-full h-full border-2 border-slate-600 rounded overflow-hidden">
        {rows}
      </div>

      {/* Turn Indicator Overlay for Spawning */}
      {gameState.phase === Phase.SPAWNING && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-xl z-20 animate-bounce pointer-events-none">
          Place your Pawn ({gameState.spawnQueue[gameState.currentPlayer]} left)
        </div>
      )}
    </div>
  );
};

export default Board;