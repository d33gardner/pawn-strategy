import React, { useState } from 'react';
import { GameConfig, PlacementMethod } from '../types';
import { Swords, Bot, User, Shield } from 'lucide-react';

interface ConfigScreenProps {
  onStart: (config: GameConfig) => void;
}

const ConfigScreen: React.FC<ConfigScreenProps> = ({ onStart }) => {
  const [config, setConfig] = useState<GameConfig>({
    totalRounds: 10,
    pawnsPerSpawn: 2,
    placementMethod: PlacementMethod.RANDOM,
    vsAI: true,
    difficulty: 'MEDIUM',
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-700 my-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
            Pawn Advance
          </h1>
          <p className="text-slate-400 text-sm md:text-base">Tactical Pawn Warfare</p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Game Mode */}
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Opponent</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfig({ ...config, vsAI: true })}
                className={`p-3 md:p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${config.vsAI
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
              >
                <Bot size={24} />
                <span className="font-medium text-sm md:text-base">vs AI</span>
              </button>
              <button
                onClick={() => setConfig({ ...config, vsAI: false })}
                className={`p-3 md:p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${!config.vsAI
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
              >
                <User size={24} />
                <span className="font-medium text-sm md:text-base">2 Player</span>
              </button>
            </div>
          </div>

          {/* Rounds */}
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">
              Game Length: <span className="text-emerald-400">{config.totalRounds} Rounds</span>
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={config.totalRounds}
              onChange={(e) => setConfig({ ...config, totalRounds: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Pawns Per Spawn */}
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">
              Pawns Spawning per Round: <span className="text-emerald-400">{config.pawnsPerSpawn}</span>
            </label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setConfig({ ...config, pawnsPerSpawn: num })}
                  className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${config.pawnsPerSpawn === num
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Placement Method */}
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Spawn Placement</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfig({ ...config, placementMethod: PlacementMethod.RANDOM })}
                className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all ${config.placementMethod === PlacementMethod.RANDOM
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400'
                  }`}
              >
                Random
              </button>
              <button
                onClick={() => setConfig({ ...config, placementMethod: PlacementMethod.CHOICE })}
                className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all ${config.placementMethod === PlacementMethod.CHOICE
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400'
                  }`}
              >
                Player Choice
              </button>
            </div>
          </div>

          <button
            onClick={() => onStart(config)}
            className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            <Swords className="w-5 h-5" />
            Start Battle
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigScreen;