import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ship, Users, Copy, Check, Clock, ArrowLeft } from 'lucide-react';

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    // Mock: Add current player
    setPlayers([
      { id: 1, username: 'You', isReady: true, isHost: true }
    ]);

    // Simulate opponent joining after 3 seconds
    const joinTimer = setTimeout(() => {
      setPlayers([
        { id: 1, username: 'You', isReady: true, isHost: true },
        { id: 2, username: 'Captain_Jack', isReady: false, isHost: false }
      ]);
    }, 3000);

    // Simulate both ready after 6 seconds
    const readyTimer = setTimeout(() => {
      setPlayers([
        { id: 1, username: 'You', isReady: true, isHost: true },
        { id: 2, username: 'Captain_Jack', isReady: true, isHost: false }
      ]);
      
      // Start countdown
      setCountdown(3);
    }, 6000);

    return () => {
      clearTimeout(joinTimer);
      clearTimeout(readyTimer);
    };
  }, []);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      // Navigate to VR transition screen
      navigate(`/vr-transition/${roomId}`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate, roomId]);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedRoomId(true);
    setTimeout(() => setCopiedRoomId(false), 2000);
  };

  const handleLeaveRoom = () => {
    // TODO: API call to leave room
    navigate('/game-modes');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Waiting Room</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Room ID:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold border border-blue-200">
                  {roomId}
                </span>
                <button
                  onClick={handleCopyRoomId}
                  className="p-1.5 hover:bg-gray-100 rounded transition-all"
                  title="Copy Room ID"
                >
                  {copiedRoomId ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center gap-2 border border-red-200 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>

        {/* Players Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Players ({players.length}/2)
            </h2>
          </div>

          <div className="grid gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    player.isReady ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{player.username}</p>
                    <p className="text-sm text-gray-600">
                      {player.isHost && <span className="text-blue-600 font-semibold">👑 Host</span>}
                    </p>
                  </div>
                </div>

                <div>
                  {player.isReady ? (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-300">
                      ✓ Ready
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-full text-sm font-bold">
                      Waiting...
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slot */}
            {players.length < 2 && (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-semibold">Waiting for opponent...</p>
                  <p className="text-sm text-gray-400 mt-1">Share the Room ID to invite</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status/Countdown */}
        {countdown !== null ? (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl text-center animate-pulse">
            <h2 className="text-white text-2xl font-bold mb-2">Both Players Ready!</h2>
            <p className="text-blue-100 mb-4">Starting game in...</p>
            <div className="text-7xl font-bold text-white">{countdown}</div>
          </div>
        ) : players.length < 2 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-spin" style={{ animationDuration: '3s' }} />
            <h3 className="font-bold text-blue-900 text-lg mb-2">
              Waiting for opponent to join...
            </h3>
            <p className="text-blue-700 text-sm">
              Share the Room ID with your friend to start the game
            </p>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white animate-spin" />
            </div>
            <h3 className="font-bold text-purple-900 text-lg mb-2">
              Waiting for players to ready up...
            </h3>
            <p className="text-purple-700 text-sm">
              Game will start when both players are ready
            </p>
          </div>
        )}

        {/* Share Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800 text-center">
            💡 <strong>Tip:</strong> Copy and share the Room ID with your friend to invite them to this game!
          </p>
        </div>
      </div>
    </div>
  );
}
