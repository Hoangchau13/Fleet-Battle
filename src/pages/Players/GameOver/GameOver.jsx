import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Trophy, RotateCcw, Home } from 'lucide-react';

export default function GameOver() {
  const { matchId, userId, serverId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const winner = searchParams.get('winner'); // 'A' or 'B'
  const playerAName = searchParams.get('playerA') || 'Player A';
  const playerBName = searchParams.get('playerB') || 'Player B';
  
  const winnerName = winner === 'A' ? playerAName : playerBName;
  const loserName = winner === 'A' ? playerBName : playerAName;

  const handlePlayAgain = () => {
    navigate(`/home/${userId}/${serverId}`);
  };

  const handleBackToHome = () => {
    navigate('/server-selection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center">
        {/* Trophy Animation */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-yellow-500/20 rounded-full animate-ping"></div>
          </div>
          <div className="relative">
            <Trophy className="w-40 h-40 text-yellow-400 mx-auto animate-bounce drop-shadow-2xl" />
          </div>
        </div>

        {/* Winner Announcement */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border-4 border-yellow-400/50 shadow-2xl mb-8">
          <h1 className="text-6xl font-black text-yellow-400 mb-6 drop-shadow-lg">
            🎉 VICTORY! 🎉
          </h1>
          
          <div className="space-y-4">
            <div className="bg-green-500/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-400">
              <p className="text-green-300 text-lg mb-2">WINNER</p>
              <p className="text-5xl font-bold text-white drop-shadow-lg">{winnerName}</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-400">
              <p className="text-red-300 text-lg mb-2">DEFEATED</p>
              <p className="text-4xl font-bold text-gray-300 drop-shadow-lg">{loserName}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all border-2 border-white/30 font-semibold"
          >
            <Home className="w-6 h-6" />
            <span>Back to Home</span>
          </button>
          
          <button
            onClick={handlePlayAgain}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg font-semibold"
          >
            <RotateCcw className="w-6 h-6" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
