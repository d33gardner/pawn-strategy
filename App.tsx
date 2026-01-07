import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Phase,
  Player,
  GameState,
  GameConfig,
  Pawn,
  Position,
  Move,
  PlacementMethod,
} from './types';
import { BOARD_SIZE, MOVES_PER_TURN, PLAYER_CONFIG } from './constants';
import * as GameLogic from './services/gameLogic';
import * as AI from './services/ai';
import Board from './components/Board';
import ConfigScreen from './components/ConfigScreen';
import { RefreshCw, Trophy, AlertTriangle, Play, FastForward, History, HelpCircle, Users } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPawnId, setSelectedPawnId] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [showRules, setShowRules] = useState(false);

  // --- Initialization ---
  const initGame = (config: GameConfig) => {
    const pawns: Pawn[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      pawns.push({
        id: uuidv4(),
        owner: Player.WHITE,
        position: { x, y: 0 },
        hasMoved: false,
      });
    }
    for (let x = 0; x < BOARD_SIZE; x++) {
      pawns.push({
        id: uuidv4(),
        owner: Player.BLACK,
        position: { x, y: BOARD_SIZE - 1 },
        hasMoved: false,
      });
    }

    setGameState({
      board: pawns,
      phase: Phase.PLAYING,
      currentRound: 1,
      currentPlayer: Player.WHITE,
      movesMadeInTurn: 0,
      movedPawnIds: [],
      scores: { [Player.WHITE]: 0, [Player.BLACK]: 0 },
      winner: null,
      winReason: null,
      moveHistory: [],
      config,
      spawnQueue: { [Player.WHITE]: 0, [Player.BLACK]: 0 },
    });
  };

  const handlePawnClick = (pawn: Pawn) => {
    if (!gameState || gameState.phase !== Phase.PLAYING) return;
    if (selectedPawnId && pawn.owner !== gameState.currentPlayer) {
      const move = validMoves.find((m) => m.to.x === pawn.position.x && m.to.y === pawn.position.y && m.isCapture);
      if (move) {
        executeMove(move);
        return;
      }
    }
    if (gameState.currentPlayer !== pawn.owner) return;
    if (gameState.config.vsAI && gameState.currentPlayer === Player.BLACK) return;
    if (gameState.movedPawnIds.includes(pawn.id)) return;

    if (selectedPawnId === pawn.id) {
      setSelectedPawnId(null);
      setValidMoves([]);
    } else {
      const moves = GameLogic.getValidMoves(pawn, gameState.board);
      if (moves.length > 0) {
        setSelectedPawnId(pawn.id);
        setValidMoves(moves);
      }
    }
  };

  const handleSquareClick = (pos: Position) => {
    if (!gameState) return;
    if (gameState.phase === Phase.SPAWNING) {
      handleManualSpawn(pos);
      return;
    }
    if (gameState.phase === Phase.PLAYING && selectedPawnId) {
      const move = validMoves.find((m) => m.to.x === pos.x && m.to.y === pos.y);
      if (move) {
        executeMove(move);
      }
    }
  };

  const executeMove = (move: Move) => {
    if (!gameState) return;
    let movingPawnId = selectedPawnId;
    if (!movingPawnId) {
      const p = gameState.board.find(p => p.position.x === move.from.x && p.position.y === move.from.y);
      if (p) movingPawnId = p.id;
    }
    if (!movingPawnId) return;

    const { newBoard, capturedId } = GameLogic.applyMove(gameState.board, move);
    const newScores = { ...gameState.scores };
    if (capturedId) newScores[gameState.currentPlayer]++;

    const log = `${gameState.currentPlayer === Player.WHITE ? 'W' : 'B'}: ${String.fromCharCode(97 + move.from.x)}${move.from.y + 1} → ${String.fromCharCode(97 + move.to.x)}${move.to.y + 1}${capturedId ? ' (x)' : ''}`;

    const tempStateForCheck = { ...gameState, board: newBoard, scores: newScores };
    const winResult = GameLogic.checkWinCondition(tempStateForCheck);

    if (winResult.winner) {
      setGameState({
        ...tempStateForCheck,
        phase: Phase.GAME_OVER,
        winner: winResult.winner,
        winReason: winResult.reason,
        moveHistory: [log, ...gameState.moveHistory],
      });
      return;
    }

    const movesMade = gameState.movesMadeInTurn + 1;
    const newMovedPawnIds = [...gameState.movedPawnIds, movingPawnId];
    const remainingMoveableCount = GameLogic.getMoveablePawnCount(newBoard, gameState.currentPlayer, newMovedPawnIds);

    let nextPlayer = gameState.currentPlayer;
    let nextPhase = Phase.PLAYING;
    let nextMovesMade = movesMade;
    let nextMovedPawnIds = newMovedPawnIds;

    if (movesMade >= MOVES_PER_TURN || remainingMoveableCount === 0) {
      nextMovesMade = 0;
      nextMovedPawnIds = [];
      if (gameState.currentPlayer === Player.WHITE) {
        nextPlayer = Player.BLACK;
      } else {
        nextPlayer = Player.WHITE;
        nextPhase = Phase.ADVANCEMENT;
      }
    }

    setGameState({
      ...gameState,
      board: newBoard,
      scores: newScores,
      currentPlayer: nextPlayer,
      phase: nextPhase,
      movesMadeInTurn: nextMovesMade,
      movedPawnIds: nextMovedPawnIds,
      moveHistory: [log, ...gameState.moveHistory],
    });

    setSelectedPawnId(null);
    setValidMoves([]);
  };

  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === Phase.ADVANCEMENT) {
      const timer = setTimeout(() => performAdvancement(), 1000);
      return () => clearTimeout(timer);
    }
    if (gameState.phase === Phase.SPAWNING) {
      if (gameState.currentPlayer === Player.BLACK && gameState.config.vsAI) {
        const timer = setTimeout(() => autoSpawn(Player.BLACK), 500);
        return () => clearTimeout(timer);
      }
    }
    if (gameState.phase === Phase.PLAYING && gameState.currentPlayer === Player.BLACK && gameState.config.vsAI && !gameState.winner) {
      const timer = setTimeout(() => performAIMove(), 750);
      return () => clearTimeout(timer);
    }
  }, [gameState?.phase, gameState?.currentPlayer, gameState?.movesMadeInTurn]);

  const performAdvancement = () => {
    if (!gameState) return;
    let nextBoard = GameLogic.calculateAdvancement(gameState.board);
    const winResult = GameLogic.checkWinCondition({ ...gameState, board: nextBoard });

    if (winResult.winner) {
      setGameState({ ...gameState, board: nextBoard, phase: Phase.GAME_OVER, winner: winResult.winner, winReason: winResult.reason });
      return;
    }

    const pawnsToSpawn = gameState.config.pawnsPerSpawn;
    if (gameState.config.placementMethod === PlacementMethod.RANDOM) {
      const boardWithSpawns = spawnRandomly(nextBoard, Player.WHITE, pawnsToSpawn);
      const finalBoard = spawnRandomly(boardWithSpawns, Player.BLACK, pawnsToSpawn);
      setGameState({ ...gameState, board: finalBoard, phase: Phase.PLAYING, currentRound: gameState.currentRound + 1, currentPlayer: Player.WHITE, movedPawnIds: [] });
    } else {
      setGameState({ ...gameState, board: nextBoard, phase: Phase.SPAWNING, currentPlayer: Player.WHITE, spawnQueue: { [Player.WHITE]: pawnsToSpawn, [Player.BLACK]: pawnsToSpawn }, movedPawnIds: [] });
    }
  };

  const spawnRandomly = (board: Pawn[], player: Player, count: number): Pawn[] => {
    let currentBoard = [...board];
    const baseRow = PLAYER_CONFIG[player].baseRow;
    const emptySpots: number[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!GameLogic.getPawnAt(currentBoard, { x, y: baseRow })) emptySpots.push(x);
    }
    const spotsToSpawn = emptySpots.sort(() => 0.5 - Math.random()).slice(0, count);
    spotsToSpawn.forEach(x => {
      currentBoard.push({ id: uuidv4(), owner: player, position: { x, y: baseRow }, isNew: true, hasMoved: false });
    });
    return currentBoard;
  };

  const autoSpawn = (player: Player) => {
    if (!gameState) return;
    const count = gameState.spawnQueue[player];
    const newBoard = spawnRandomly(gameState.board, player, count);
    finishSpawnTurn(newBoard, player);
  };

  const handleManualSpawn = (pos: Position) => {
    if (!gameState) return;
    const player = gameState.currentPlayer;
    const baseRow = PLAYER_CONFIG[player].baseRow;
    if (pos.y !== baseRow || GameLogic.getPawnAt(gameState.board, pos)) return;

    const newBoard = [...gameState.board, { id: uuidv4(), owner: player, position: pos, isNew: true, hasMoved: false }];
    const newQueue = { ...gameState.spawnQueue, [player]: gameState.spawnQueue[player] - 1 };

    if (newQueue[player] <= 0) {
      finishSpawnTurn(newBoard, player);
    } else {
      setGameState({ ...gameState, board: newBoard, spawnQueue: newQueue });
    }
  };

  const finishSpawnTurn = (newBoard: Pawn[], finishedPlayer: Player) => {
    if (!gameState) return;
    if (finishedPlayer === Player.WHITE) {
      setGameState({ ...gameState, board: newBoard, currentPlayer: Player.BLACK, spawnQueue: { ...gameState.spawnQueue, [Player.WHITE]: 0 } });
    } else {
      setGameState({ ...gameState, board: newBoard, phase: Phase.PLAYING, currentRound: gameState.currentRound + 1, currentPlayer: Player.WHITE, spawnQueue: { [Player.WHITE]: 0, [Player.BLACK]: 0 }, movedPawnIds: [] });
    }
  };

  const performAIMove = () => {
    if (!gameState) return;
    const bestMoves = AI.getBestMoves(gameState);
    if (bestMoves.length > 0) {
      executeMove(bestMoves[0].move);
    } else {
      setGameState({ ...gameState, currentPlayer: Player.WHITE, phase: Phase.ADVANCEMENT, movesMadeInTurn: 0, movedPawnIds: [] });
    }
  };

  if (!gameState) return <ConfigScreen onStart={initGame} />;

  const moveableCount = gameState.phase === Phase.PLAYING ? GameLogic.getMoveablePawnCount(gameState.board, gameState.currentPlayer, gameState.movedPawnIds) : 0;
  const movesLeft = Math.min(MOVES_PER_TURN - gameState.movesMadeInTurn, moveableCount);

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] w-full bg-slate-900 text-slate-100 overflow-hidden">
      <div className="md:w-80 w-full bg-slate-800 border-b md:border-b-0 md:border-r border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto z-10">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl flex items-center gap-2">
            <Trophy className="text-yellow-400" size={20} /> Pawn Advance
          </h1>
          <button onClick={() => setShowRules(!showRules)} className="p-2 hover:bg-slate-700 rounded-full">
            <HelpCircle size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
            <div className="text-xs text-slate-400 uppercase font-bold">Round</div>
            <div className="text-2xl font-bold text-white">{gameState.currentRound} <span className="text-sm text-slate-500">/ {gameState.config.totalRounds}</span></div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
            <div className="text-xs text-slate-400 uppercase font-bold">Phase</div>
            <div className="text-sm font-bold text-emerald-400 truncate">
              {gameState.phase === Phase.PLAYING && 'Battle'}
              {gameState.phase === Phase.ADVANCEMENT && 'Marching'}
              {gameState.phase === Phase.SPAWNING && 'Reinforce'}
              {gameState.phase === Phase.GAME_OVER && 'Finished'}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-slate-700/30 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold"><div className="w-3 h-3 bg-white rounded-full"></div> White</span>
            <span className="text-xl font-mono">{gameState.scores[Player.WHITE]}</span>
          </div>
          <div className="w-full h-px bg-slate-600 my-1"></div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold"><div className="w-3 h-3 bg-slate-900 border border-slate-500 rounded-full"></div> Black</span>
            <span className="text-xl font-mono">{gameState.scores[Player.BLACK]}</span>
          </div>
        </div>
        {gameState.phase === Phase.PLAYING && (
          <div className={`p-4 rounded-xl border-l-4 shadow-lg transition-colors ${gameState.currentPlayer === Player.WHITE ? 'bg-slate-100 text-slate-900 border-slate-400' : 'bg-slate-900 text-slate-100 border-slate-600'}`}>
            <div className="text-xs font-bold uppercase mb-1 flex items-center gap-2"><Play size={12} className="fill-current" /> Current Turn</div>
            <div className="text-2xl font-bold">{PLAYER_CONFIG[gameState.currentPlayer].name}</div>
            <div className="mt-2 text-sm font-medium opacity-80">Moves Remaining: {movesLeft}</div>
          </div>
        )}
        {gameState.phase === Phase.ADVANCEMENT && (
          <div className="p-4 bg-blue-500/20 border border-blue-500/50 text-blue-200 rounded-xl flex items-center gap-3 animate-pulse">
            <FastForward size={24} />
            <div><div className="font-bold">Marching Phase</div><div className="text-xs">Troops advancing forward...</div></div>
          </div>
        )}
        <div className="flex-1 overflow-hidden flex flex-col min-h-[150px]">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><History size={12} /> Log</div>
          <div className="flex-1 overflow-y-auto text-sm font-mono space-y-1 pr-2">
            {gameState.moveHistory.map((log, i) => <div key={i} className="text-slate-400 border-b border-slate-700/50 pb-1 last:border-0">{log}</div>)}
          </div>
        </div>
        <button onClick={() => setGameState(null)} className="mt-auto flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"><RefreshCw size={16} /> Reset Game</button>
      </div>
      <div className="flex-1 bg-slate-900 relative flex items-center justify-center p-4">
        <Board gameState={gameState} selectedPawnId={selectedPawnId} validMoves={validMoves} onSquareClick={handleSquareClick} onPawnClick={handlePawnClick} />
      </div>
      {gameState.phase === Phase.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <h2 className="text-3xl font-bold text-white mb-2">{gameState.winner === 'DRAW' ? 'Draw!' : `${PLAYER_CONFIG[gameState.winner as Player].name} Wins!`}</h2>
            <p className="text-slate-400 mb-8">{gameState.winReason}</p>
            <button onClick={() => setGameState(null)} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all">Play Again</button>
          </div>
        </div>
      )}
      {showRules && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 p-6 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><HelpCircle size={20} /> Rules</h2>
              <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              <p><strong className="text-white">Goal:</strong> Reach the opponent's back row OR capture the most pawns.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Movement:</strong> 4 moves per turn. Each pawn moves once.</li>
                <li><strong>The March:</strong> After every round, all pawns automatically advance 1 square unless blocked by an enemy or collision.</li>
                <li><strong>Reinforcements:</strong> New units (1-4) spawn on your back row every round.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;