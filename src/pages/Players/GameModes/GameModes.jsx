import { useNavigate } from 'react-router-dom';
import { Trophy, Users, ArrowLeft, Target, Zap } from 'lucide-react';

export default function GameModes() {
  const navigate = useNavigate();

  const handleRankedMode = () => {
    // TODO: Navigate to ranked matchmaking
    console.log('Starting ranked match...');
    // For now, navigate to lobby with rank mode
    navigate('/lobby?mode=ranked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/home')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Select Game Mode</h1>
          <p className="text-gray-600">Choose how you want to play</p>
        </div>

        {/* Game Modes List */}
        <div className="flex flex-col gap-6 max-w-xl mx-auto">

          {/* Ranked Mode */}
          <button
            onClick={handleRankedMode}
            className="group bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-orange-500 hover:shadow-2xl transition-all text-left relative overflow-hidden"
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative">
              {/* Icon */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Ranked Match</h2>

              {/* Description */}
              <p className="text-gray-600 mb-4">
                Competitive matchmaking where your ELO rating is on the line
              </p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">Win: <span className="font-semibold text-green-600">+15-25 ELO</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-red-600" />
                  <span className="text-gray-700">Lose: <span className="font-semibold text-red-600">-10-20 ELO</span></span>
                </div>
              </div>

              {/* Call to Action */}
              <div className="flex items-center justify-between text-orange-600 font-semibold group-hover:text-orange-700">
                <span>Find Match</span>
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}
