import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Trophy, Skull, Home, RotateCcw, TrendingUp, TrendingDown, Clock, Swords, Flag, Timer } from 'lucide-react';
import { getMatchResult } from '../../../api/matchApi';
import { getPlayerProfileByUserAndServer } from '../../../api';

const END_REASON_LABELS = {
  Surrender: { label: 'Surrender', icon: '🏳️' },
  AFK: { label: 'AFK Timeout', icon: '⏰' },
  AllShipsSunk: { label: 'All Ships Sunk', icon: '⚓' },
  Timeout: { label: 'AFK Timeout', icon: '⏰' },
  Default: { label: 'Game Over', icon: '🎯' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function GameOver() {
  const { matchId, userId, serverId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fallback from query param: winner=A means current player won, winner=B means lost
  const winnerParam = searchParams.get('winner');

  useEffect(() => {
    const init = async () => {
      try {
        // Get my playerId
        if (userId && serverId) {
          const profile = await getPlayerProfileByUserAndServer(userId, serverId);
          if (profile?.playerId) setMyPlayerId(profile.playerId);
        }
        // Fetch match result
        const data = await getMatchResult(matchId);
        setResult(data);
      } catch (err) {
        console.error('[GameOver] Failed to load result:', err);
        setError('Could not load match result.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [matchId, userId, serverId]);

  const isWinner = result
    ? String(result.winner?.playerId) === String(myPlayerId)
    : winnerParam === 'A';

  const endReason = result?.endReason || 'Default';
  const reasonInfo = END_REASON_LABELS[endReason] || END_REASON_LABELS.Default;

  const handlePlayAgain = () => navigate(`/home/${userId}/${serverId}`);
  const handleBackToHome = () => navigate('/server-selection');

  // ── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-purple-300 text-lg font-semibold">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">

        {/* Hero Banner */}
        <div className="relative mb-6 text-center">
          {/* Glow ring */}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
            <div className={`w-48 h-48 rounded-full animate-ping opacity-20 ${isWinner ? 'bg-yellow-400' : 'bg-red-600'}`} />
          </div>

          <div className="relative">
            {isWinner ? (
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto drop-shadow-[0_0_30px_#fbbf24] animate-bounce" />
            ) : (
              <Skull className="w-24 h-24 text-red-400 mx-auto drop-shadow-[0_0_30px_#f87171]" />
            )}
          </div>

          <h1 className={`text-5xl font-black mt-4 tracking-wider drop-shadow-lg ${isWinner ? 'text-yellow-400' : 'text-red-400'}`}>
            {isWinner ? '🏆 VICTORY!' : '💀 DEFEAT!'}
          </h1>
          <p className="text-white/50 mt-1 text-sm flex items-center justify-center gap-1.5">
            <span>{reasonInfo.icon}</span>
            <span>{reasonInfo.label}</span>
            {result?.endTime && (
              <span className="ml-2 opacity-60">· {formatDate(result.endTime)}</span>
            )}
          </p>
        </div>

        {/* Main Result Card */}
        {result ? (
          <div className="bg-white/8 backdrop-blur-xl rounded-3xl border border-white/15 overflow-hidden shadow-2xl mb-6">

            {/* Players Row */}
            <div className="grid grid-cols-2 divide-x divide-white/10">
              {/* Winner */}
              <div className="p-6 bg-gradient-to-b from-yellow-500/10 to-transparent text-center">
                <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-bold border border-yellow-500/30 uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5" /> Winner
                </div>
                <p className="text-white text-2xl font-black mt-2 truncate">{result.winner?.displayName}</p>

                {/* ELO Change */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div className="text-left">
                    <span className="text-green-400 text-xl font-black">+{result.winner?.eloChange}</span>
                    <p className="text-white/40 text-xs">{result.winner?.eloBefore} → <span className="text-white/70 font-semibold">{result.winner?.eloAfter}</span> ELO</p>
                  </div>
                </div>
              </div>

              {/* Loser */}
              <div className="p-6 bg-gradient-to-b from-red-500/10 to-transparent text-center">
                <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold border border-red-500/30 uppercase tracking-wider">
                  <Skull className="w-3.5 h-3.5" /> Defeated
                </div>
                <p className="text-white/70 text-2xl font-black mt-2 truncate">{result.loser?.displayName}</p>

                {/* ELO Change */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <span className="text-red-400 text-xl font-black">{result.loser?.eloChange}</span>
                    <p className="text-white/40 text-xs">{result.loser?.eloBefore} → <span className="text-white/70 font-semibold">{result.loser?.eloAfter}</span> ELO</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Stats Footer */}
            <div className="border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
              <div className="py-4 text-center">
                <Swords className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-white font-black text-lg">{result.totalTurns}</p>
                <p className="text-white/40 text-xs">Total Turns</p>
              </div>
              <div className="py-4 text-center">
                <span className="text-lg block mb-1">{reasonInfo.icon}</span>
                <p className="text-white font-bold text-sm">{reasonInfo.label}</p>
                <p className="text-white/40 text-xs">End Reason</p>
              </div>
              <div className="py-4 text-center">
                <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-white font-black text-sm">{result.endTime ? formatDate(result.endTime) : '—'}</p>
                <p className="text-white/40 text-xs">Ended At</p>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback if API failed */
          <div className="bg-white/8 backdrop-blur-xl rounded-3xl border border-white/15 p-8 text-center mb-6">
            <p className="text-white/60 text-lg">
              {error || (isWinner ? '🏆 You won this match!' : '💀 You were defeated.')}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleBackToHome}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 font-semibold transition-all"
          >
            <Home className="w-5 h-5" />
            Back to Lobby
          </button>
          <button
            onClick={handlePlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-500/30"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </div>

        {/* Match ID */}
        <p className="text-center text-white/20 text-xs mt-4">Match #{matchId}</p>
      </div>
    </div>
  );
}
