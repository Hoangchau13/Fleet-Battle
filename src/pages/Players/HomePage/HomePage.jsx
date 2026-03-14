
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  Trophy,
  Target,
  TrendingUp,
  Zap,
  Users,
  Clock,
  Award,
  LogOut,
  Wifi,
  WifiOff,
  Server
} from 'lucide-react';
import { logout, getPlayerProfile, linkVrDevice } from '../../../api';

export default function HomePage() {
  const navigate = useNavigate();
  const [pinCode, setPinCode] = useState(['', '', '', '', '', '']);
  const [vrConnected, setVrConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [isLinkingVr, setIsLinkingVr] = useState(false);
  const [vrLinkError, setVrLinkError] = useState('');

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Get player data for current server
    const playerStr = localStorage.getItem('currentPlayer');
    if (playerStr) {
      try {
        const player = JSON.parse(playerStr);
        setPlayerData({
          ...player,
          username: player?.displayName,
          eloScore: player?.eloScore
        });

        // Try to fetch real stats from API
        const fetchRealProfile = async () => {
          try {
            const playerIdToFetch = player?.playerId || player?.id || currentUser?.userId;
            if (playerIdToFetch) {
              const realProfile = await getPlayerProfile(playerIdToFetch);
              if (realProfile) {
                setPlayerData(prev => ({
                  ...prev,
                  ...realProfile,
                  username: realProfile.displayName,
                  eloScore: realProfile.elo,
                  totalMatches: realProfile.totalMatches,
                  wins: realProfile.totalWins,
                  losses: realProfile.totalLosses,
                  winRate: realProfile.winRate,
                  currentStreak: realProfile.currentStreak,
                  recentMatches: realProfile.recentMatches
                }));
              }
            }
          } catch (error) {
            console.error('Failed to fetch real player profile:', error);
          }
        };

        fetchRealProfile();

      } catch (error) {
        console.error('Error parsing player data:', error);
      }
    } else {
      // No player data, redirect to server selection
      navigate('/server-selection');
    }
  }, [navigate]);

  // Use recent matches from playerData if available
  const displayMatches = playerData?.recentMatches?.length > 0 ? playerData.recentMatches : [
    { id: 1, opponent: 'Commander_Jack', result: 'Win', score: '10-7', time: '2 hours ago' },
    { id: 2, opponent: 'Captain_Sarah', result: 'Win', score: '10-8', time: '5 hours ago' },
    { id: 3, opponent: 'Admiral_Mike', result: 'Loss', score: '8-10', time: '1 day ago' },
  ];

  const handlePinInput = (index, value) => {
    if (value.length <= 1 && /^[a-zA-Z0-9]*$/.test(value)) {
      const newPin = [...pinCode];
      newPin[index] = value.toUpperCase();
      setPinCode(newPin);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pinCode[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleConnect = async () => {
    const pin = pinCode.join('');
    if (pin.length === 6) {
      setIsLinkingVr(true);
      setVrLinkError('');
      try {
        const playerIdValue = playerData?.playerId || playerData?.id || currentUser?.userId;
        const response = await linkVrDevice(pin, playerIdValue);
        console.log('Successfully linked VR device:', response);
        setVrConnected(true);
        // Navigate to Game Modes after VR connection
        navigate('/game-modes');
      } catch (error) {
        console.error('Failed to link VR device:', error);
        setVrLinkError(error?.response?.data?.message || 'Invalid PIN code. Please try again.');
      } finally {
        setIsLinkingVr(false);
      }
    }
  };

  const handleDisconnect = () => {
    setVrConnected(false);
    setPinCode(['', '', '', '', '', '']);
  };

  const handleLogout = () => {
    logout();
  };

  const handleChangeServer = () => {
    navigate('/server-selection');
  };

  // Show loading if player data is not loaded yet
  if (!playerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading player data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                <Ship className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fleet Battle VR</h1>
                <p className="text-xs text-blue-600">Player Portal</p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{playerData?.username}</p>
                <p className="text-xs text-gray-600">• ELO: {playerData?.eloScore}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleChangeServer}
                  className="px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200 flex items-center gap-1.5 mr-2"
                  title="Change Server"
                >
                  <Server className="w-4 h-4" />
                  <span className="hidden sm:inline">Change Server</span>
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                  {playerData?.username?.charAt(0)?.toUpperCase()}
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
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - VR Connection & Quick Match */}
          <div className="lg:col-span-1 space-y-6">

            {/* VR Connection Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                {vrConnected ? (
                  <Wifi className="w-6 h-6 text-green-500" />
                ) : (
                  <WifiOff className="w-6 h-6 text-gray-400" />
                )}
                <h2 className="text-lg font-bold text-gray-900">VR Headset</h2>
              </div>

              {!vrConnected ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter the 6-digit PIN code displayed on your VR headset
                  </p>

                  {/* PIN Input */}
                  <div className="flex justify-center gap-2 mb-4">
                    {pinCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`pin-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handlePinInput(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={isLinkingVr}
                        className="w-10 sm:w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all disabled:opacity-50"
                      />
                    ))}
                  </div>
                  
                  {vrLinkError && (
                    <p className="text-red-500 text-xs text-center mb-4">{vrLinkError}</p>
                  )}

                  <button
                    onClick={handleConnect}
                    disabled={pinCode.join('').length !== 6 || isLinkingVr}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex justify-center items-center gap-2"
                  >
                    {isLinkingVr ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Connecting...
                      </>
                    ) : (
                      'Connect VR'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-700 text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      VR Headset Connected
                    </p>
                    <p className="text-green-600 text-xs mt-1">Ready to play!</p>
                  </div>

                  <button
                    onClick={handleDisconnect}
                    className="w-full bg-red-50 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-100 transition-all border border-red-200"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Stats and Profile */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300 p-4 shadow-md">
                <Trophy className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{playerData?.wins}</p>
                <p className="text-xs text-blue-700">Total Wins</p>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl border border-purple-300 p-4 shadow-md">
                <Target className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{playerData?.eloScore}</p>
                <p className="text-xs text-purple-700">ELO Score</p>
              </div>

              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300 p-4 shadow-md">
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{playerData?.winRate}%</p>
                <p className="text-xs text-green-700">Win Rate</p>
              </div>

              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl border border-orange-300 p-4 shadow-md">
                <Zap className="w-8 h-8 text-orange-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{playerData?.losses}</p>
                <p className="text-xs text-orange-700"> Total Losses</p>
              </div>
            </div>

            {/* Player Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Player Profile</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Matches</p>
                  <p className="text-2xl font-bold text-gray-900">{playerData?.totalMatches}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Current Streak</p>
                  <p className={`text-2xl font-bold flex items-center gap-1 ${(playerData?.currentStreak || 0) >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    <span>{Math.abs(playerData?.currentStreak || 0)}</span>
                    <span className={(playerData?.currentStreak || 0) < 0 ? 'hue-rotate-[190deg] brightness-125 saturate-150' : ''}>🔥</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Recent Matches */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Matches</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {(playerData?.recentMatches || []).length > 0 ? (
                  (playerData?.recentMatches || []).map((match, index) => (
                    <div
                      key={match.id || match.matchId || index}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all border border-gray-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-gray-900 font-semibold">vs {match.opponentName || 'Unknown'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-600">
                                {match.timestamp ? new Date(match.timestamp).toLocaleString() : 'Recently'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${match.result === 'Win' ? 'text-green-600' : 'text-red-600'}`}>
                            {match.result}
                          </span>
                          <div className="flex flex-col items-end gap-1 mt-1">
                            {match.eloChange !== undefined && (
                              <p className={`text-xs font-semibold ${match.eloChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {match.eloChange >= 0 ? '+' : ''}{match.eloChange} ELO
                              </p>
                            )}
                            {match.duration && (
                              <p className="text-xs text-gray-500">{match.duration}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No recent matches found. Start playing to see your history!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 