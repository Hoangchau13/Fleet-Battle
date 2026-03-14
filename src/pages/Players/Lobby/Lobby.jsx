import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ship, Users, Plus, RefreshCw, Copy, Check, LogOut, Lock, Globe, ArrowLeft, Target } from 'lucide-react';
import { logout } from '../../../api';

export default function Lobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'ranked' or 'friend'
  
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Create room form state
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [difficulty, setDifficulty] = useState('medium');

  const fetchRooms = async () => {
    // TODO: Replace with actual API call
    // Mock data
    setRooms([
      { id: 'RM1234', name: 'Captain\'s Room', players: 1, maxPlayers: 2, host: 'Captain_Alex', isPrivate: false, difficulty: 'easy' },
      { id: 'RM5678', name: 'Battle Arena', players: 1, maxPlayers: 2, host: 'Commander_Jack', isPrivate: false, difficulty: 'medium' },
      { id: 'RM9012', name: 'Pro League', players: 1, maxPlayers: 2, host: 'Player123', isPrivate: true, difficulty: 'hard' },
    ]);
  };

  useEffect(() => {
    // Get user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Fetch available rooms
    fetchRooms();
  }, []);

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;
    if (isPrivate && !roomPassword.trim()) {
      alert('Please enter a password for private room');
      return;
    }
    
    // TODO: API call to create room
    const roomId = 'RM' + Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log('Creating room:', { roomName, isPrivate, difficulty, roomId });
    
    setShowCreateModal(false);
    // Navigate to waiting room
    navigate(`/waiting-room/${roomId}`);
  };

  const handleJoinRoom = (room) => {
    if (room.isPrivate) {
      const password = prompt('Enter room password:');
      if (!password) return;
      // TODO: Validate password with API
    }
    
    console.log('Joining room:', room.id);
    // TODO: API call to join room
    navigate(`/waiting-room/${room.id}`);
  };

  const handleCopyRoomId = (roomId) => {
    navigator.clipboard.writeText(roomId);
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  const handleLogout = () => {
    logout();
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'text-green-600 bg-green-100 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/game-modes')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                  <Ship className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {mode === 'ranked' ? 'Ranked Matchmaking' : 'Available Rooms'}
                  </h1>
                  <p className="text-xs text-blue-600">
                    {mode === 'ranked' ? 'Find competitive match' : 'Play with friends'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {currentUser?.username || 'Player'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'ranked' ? 'Finding Match...' : 'Game Rooms'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {mode === 'ranked' ? 'Searching for opponents...' : `${rooms.length} rooms available`}
            </p>
          </div>
          
          {mode === 'friend' && (
            <div className="flex gap-3">
              <button
                onClick={fetchRooms}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border border-gray-300 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Create Room</span>
              </button>
            </div>
          )}
        </div>

        {/* Rooms List */}
        {mode === 'friend' ? (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {room.isPrivate ? (
                        <Lock className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Globe className="w-5 h-5 text-green-500" />
                      )}
                      <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(room.difficulty)}`}>
                        {room.difficulty.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{room.players}/{room.maxPlayers} Players</span>
                      </div>
                      <div>
                        <span>Host: <span className="font-semibold text-gray-900">{room.host}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyRoomId(room.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {copiedRoomId === room.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="text-xs">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span className="text-xs">{room.id}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinRoom(room)}
                    disabled={room.players >= room.maxPlayers}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
                  >
                    {room.players >= room.maxPlayers ? 'Full' : 'Join'}
                  </button>
                </div>
              </div>
            ))}

            {rooms.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No rooms available</p>
                <p className="text-gray-400 text-sm mt-2">Create a room to start playing!</p>
              </div>
            )}
          </div>
        ) : (
          // Ranked Mode - Show searching animation
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="animate-pulse mb-6">
              <Target className="w-20 h-20 text-orange-500 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Searching for opponent...</h3>
            <p className="text-gray-600 mb-6">Finding players with similar ELO rating</p>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <button
              onClick={() => navigate('/game-modes')}
              className="mt-8 px-6 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              Cancel Search
            </button>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Room</h2>

            {/* Room Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900"
              />
            </div>

            {/* Room Type */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Room Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    !isPrivate
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">Public</span>
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    isPrivate
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span className="font-semibold">Private</span>
                </button>
              </div>
            </div>

            {/* Password (only for private rooms) */}
            {isPrivate && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Password
                </label>
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900"
                />
              </div>
            )}

            {/* Difficulty Level */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    difficulty === 'easy'
                      ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  Easy
                </button>
                <button
                  onClick={() => setDifficulty('medium')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    difficulty === 'medium'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setDifficulty('hard')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    difficulty === 'hard'
                      ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  Hard
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim() || (isPrivate && !roomPassword.trim())}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
