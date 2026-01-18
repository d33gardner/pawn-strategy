import React, { useState, useEffect } from 'react';
import { GameConfig, PlacementMethod } from '../types';
import { Swords, Bot, User, Shield, Trophy, Target, Skull, UserCircle, Save } from 'lucide-react';
import { StatsService, UserStats } from '../services/statsService';

interface ConfigScreenProps {
  onStart: (config: GameConfig, email?: string) => void;
}

const ConfigScreen: React.FC<ConfigScreenProps> = ({ onStart }) => {
  const [config, setConfig] = useState<GameConfig>({
    totalRounds: 10,
    pawnsPerSpawn: 2,
    placementMethod: PlacementMethod.CHOICE,
    vsAI: true,
    difficulty: 'MEDIUM',
  });

  const [email, setEmail] = useState('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load email from local storage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Fetch stats when email changes (debounced or on blur/submit ideally, but effect is fine for now if careful)
  // Let's use a manual load button or blur for simplicity + robustness
  const loadStats = async () => {
    if (!email) return;
    setLoadingStats(true);
    const data = await StatsService.getStats(email);
    setStats(data);
    setLoadingStats(false);
    localStorage.setItem('user_email', email);
  };

  useEffect(() => {
    if (email && email.includes('@')) {
      const timer = setTimeout(loadStats, 1000); // Auto-load after typing
      return () => clearTimeout(timer);
    }
  }, [email]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-700 my-auto">
        <div className="text-center mb-6 md:mb-8 relative">
          <button
            onClick={() => window.alert("Rules:\n1. Move 4 pawns per turn.\n2. Pawns advance automatically after each round.\n3. Goal: Reach the end or capture more pawns.")}
            className="absolute right-0 top-0 p-2 text-slate-500 hover:text-white md:hidden"
          >
            <Shield size={20} />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
            When Pawns Attack
          </h1>
          <p className="text-slate-400 text-sm md:text-base">Tactical Pawn Warfare</p>
        </div>

        {/* User Stats Section */}
        <div className="bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-600/50">
          <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Pilot Profile</label>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                placeholder="Enter Email to Track Stats"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {loadingStats ? (
            <div className="text-center text-xs text-slate-500 animate-pulse">Syncing satellite uplink...</div>
          ) : stats ? (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Wins</div>
                <div className="text-emerald-400 font-mono font-bold">{stats.wins}</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Games</div>
                <div className="text-white font-mono font-bold">{stats.games_played}</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Kills</div>
                <div className="text-red-400 font-mono font-bold">{stats.pawns_captured}</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Lost</div>
                <div className="text-slate-400 font-mono font-bold">{stats.pawns_lost}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500 italic">Enter email to view battle record</div>
          )}
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
              {[1, 2, 3].map((num) => (
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



          <button
            onClick={() => onStart(config, email)}
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