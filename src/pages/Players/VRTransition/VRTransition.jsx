import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, AlertCircle } from 'lucide-react';

export default function VRTransition() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate VR connection check and transition
    // In real implementation, this would wait for VR headsets to be ready
    const timer = setTimeout(() => {
      // After VR setup is complete, navigate to watch match screen
      navigate(`/watch-match/${roomId}`);
    }, 5000); // 5 seconds simulation

    return () => clearTimeout(timer);
  }, [roomId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* VR Icon Animation */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 bg-blue-500/20 rounded-full animate-ping"></div>
          </div>
          <div className="relative bg-white/10 backdrop-blur-lg p-8 rounded-full w-40 h-40 mx-auto flex items-center justify-center border-4 border-white/30">
            <Wifi className="w-20 h-20 text-white animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Switch to VR to Play
        </h1>

        {/* Instructions */}
        <p className="text-xl text-blue-200 mb-8">
          Put on your VR headset and prepare for battle
        </p>

        {/* Status Box */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-white font-semibold">Connecting to VR Headsets...</p>
          </div>
          
          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-blue-100 text-sm">Player 1: Connected</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-blue-100 text-sm">Player 2: Connecting...</p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-400/30 max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-blue-100 text-sm">
                Players will place their ships in VR. Once both players are ready, 
                you'll be able to watch the match unfold on this screen.
              </p>
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>

        {/* Room ID */}
        <p className="mt-8 text-blue-300 text-sm">
          Room ID: <span className="font-mono font-bold text-white">{roomId}</span>
        </p>
      </div>
    </div>
  );
}
