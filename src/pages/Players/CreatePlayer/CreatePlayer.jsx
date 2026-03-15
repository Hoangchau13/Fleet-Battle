import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Server, ArrowLeft, Check } from 'lucide-react';
import { createPlayer } from '../../../api';

function CreatePlayer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serverId = searchParams.get('serverId');

  const [displayName, setDisplayName] = useState('');
  const [currentServer, setCurrentServer] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load current server info
    const serverStr = localStorage.getItem('currentServer');
    if (serverStr) {
      try {
        const server = JSON.parse(serverStr);
        setCurrentServer(server);
      } catch (error) {
        console.error('Error parsing server data:', error);
      }
    }
  }, []);

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!displayName.trim()) {
      setError('Display Name is required');
      return;
    }

    if (displayName.trim().length < 3) {
      setError('Display Name must be at least 3 characters');
      return;
    }

    if (displayName.trim().length > 20) {
      setError('Display Name must be less than 20 characters');
      return;
    }

    setIsCreating(true);

    try {
      const response = await createPlayer({
        groupId: parseInt(serverId),
        displayName: displayName.trim()
      });

      console.log('Player creation response:', response);

      // Dùng thẳng dữ liệu backend trả về: playerId, userId, groupId, groupName, displayName, elo, exp
      const newPlayer = {
        playerId: response.playerId,
        userId: response.userId,
        groupId: response.groupId,
        groupName: response.groupName,
        displayName: response.displayName,
        eloScore: response.elo,
        exp: response.exp,
      };

      // Save player data for this server (Removed as per requirement to not use localStorage)
      setIsCreating(false);
      navigate(`/home/${response.userId}/${response.groupId}`);
    } catch (err) {
      console.error('Error creating player:', err);
      // More specific error handling if the API returns validation errors
      setError(err?.response?.data?.message || 'Failed to create player. Please try again.');
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    navigate('/server-selection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Server Selection</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <UserPlus className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create New Player</h1>
            <p className="text-blue-100">Set up your profile for this server</p>
          </div>

          {/* Server Info */}
          {currentServer && (
            <div className="bg-blue-50 border-b border-blue-100 p-4">
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <Server className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {currentServer.name} - {currentServer.region}
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCreatePlayer} className="p-8">
            <div className="mb-6">
              <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-gray-900 font-medium"
                maxLength="20"
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500 mt-2">
                {displayName.length}/20 characters (minimum 3)
              </p>
              {error && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <span className="font-semibold">⚠</span> {error}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Player Information</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Starting ELO: 100</li>
                <li>• Display name can be changed later</li>
                <li>• Each server has separate player profiles</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !displayName.trim() || displayName.trim().length < 3}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Player...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Player
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By creating a player, you agree to the game's terms of service
        </p>
      </div>
    </div>
  );
}

export default CreatePlayer;
