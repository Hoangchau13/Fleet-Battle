
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Server,
  Search,
  X,
  Swords,
} from 'lucide-react';
import { logout, getPlayerProfileByUserAndServer, linkVrDevice } from '../../../api';
import { useMatchmakingHub } from '../../../hooks/useMatchmakingHub';
import { ensureConnectedAndRegistered } from '../../../hooks/matchHubConnection';

export default function HomePage() {
  const { userId, serverId } = useParams();
  const navigate = useNavigate();
  const [pinCode, setPinCode] = useState(['', '', '', '', '', '']);
  const [vrConnected, setVrConnected] = useState(() => localStorage.getItem('myHasVr') === 'true');
  const [playerData, setPlayerData] = useState(null);
  const [isLinkingVr, setIsLinkingVr] = useState(false);
  const [vrLinkError, setVrLinkError] = useState('');

  useEffect(() => {
    if (!userId || !serverId) {
      navigate('/server-selection');
      return;
    }

    // Fetch real stats from API using URL params
    const fetchRealProfile = async () => {
      try {
        const realProfile = await getPlayerProfileByUserAndServer(userId, serverId);
        if (realProfile) {
          setPlayerData({
            ...realProfile,
            totalMatches: realProfile.totalMatches || (realProfile.totalWins + realProfile.totalLosses),
            displayName: realProfile.displayName,
            elo: realProfile.elo,
            wins: realProfile.totalWins,
            losses: realProfile.totalLosses,
          });
          
          // localStorage.setItem('currentPlayer', ...) removed as per requirement
        } else {
          // If no player found on this server, maybe redirect to creation? 
          // But usually ServerSelection handles that. 
          console.warn('No player profile found for this user/server');
        }
      } catch (error) {
        console.error('Failed to fetch real player profile:', error);
        // If 404, maybe the player doesn't exist?
        if (error.response?.status === 404) {
          navigate('/server-selection');
        }
      }
    };

    fetchRealProfile();
  }, [userId, serverId, navigate]);

  // Resolve playerId from playerData (fetched from API)
  const playerId = playerData?.playerId || playerData?.id || null;

  // Matchmaking hook
  const {
    matchStatus,
    statusMessage,
    isSearching,
    error: matchError,
    startSearching,
    stopSearching,
  } = useMatchmakingHub(playerId, userId, serverId);

  // ── PIN Handlers ──────────────────────────────────────────────────
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
    if (e.key === 'Backspace' && !pinCode[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Allow paste of up to 6 alphanumeric characters into PIN fields
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const chars = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    if (!chars) return;

    const newPin = ['', '', '', '', '', ''];
    chars.split('').forEach((ch, i) => {
      newPin[i] = ch;
    });
    setPinCode(newPin);

    // Focus last filled input
    const lastIdx = Math.min(chars.length - 1, 5);
    const lastInput = document.getElementById(`pin-${lastIdx}`);
    if (lastInput) lastInput.focus();
  };

  // ── VR Connection ─────────────────────────────────────────────────
  const handleConnect = async () => {
    const pin = pinCode.join('');
    if (pin.length === 6) {
      setIsLinkingVr(true);
      setVrLinkError('');
      try {
        const playerIdValue = playerData?.playerId || playerData?.id;
        
        let linkTimeout;
        const conn = await ensureConnectedAndRegistered(playerIdValue);
        
        const onVrLinkConfirmed = () => {
          console.log('[HomePage] ReceiveVrLinkConfirmed event received!');
          setVrConnected(true);
          localStorage.setItem('myHasVr', 'true');
          setIsLinkingVr(false);
          clearTimeout(linkTimeout);
          conn.off('ReceiveVrLinkConfirmed', onVrLinkConfirmed);
        };
        
        conn.on('ReceiveVrLinkConfirmed', onVrLinkConfirmed);
        
        linkTimeout = setTimeout(() => {
          conn.off('ReceiveVrLinkConfirmed', onVrLinkConfirmed);
          setIsLinkingVr(prev => {
            if (prev) {
              setVrLinkError('Timeout waiting for VR confirmation from device. Please try again.');
              return false;
            }
            return prev;
          });
        }, 30000); // 30 seconds timeout
        
        await linkVrDevice(pin, playerIdValue);
        console.log('Successfully requested VR link, waiting for VR device confirmation...');
      } catch (error) {
        console.error('Failed to request VR link:', error);
        setIsLinkingVr(false);
        setVrLinkError(
          error?.response?.data?.message || 'Invalid PIN code. Please try again.'
        );
      }
    }
  };

  const handleDisconnect = () => {
    setVrConnected(false);
    localStorage.setItem('myHasVr', 'false');
    setPinCode(['', '', '', '', '', '']);
  };

  const handleLogout = () => {
    logout();
  };

  const handleChangeServer = () => {
    navigate('/server-selection');
  };

  // ── Loading guard ─────────────────────────────────────────────────
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

  const pinFull = pinCode.join('').length === 6;

  // Label / color for match status
  const matchStatusConfig = {
    idle: null,
    connecting: { text: 'Connecting...', color: 'text-blue-600' },
    searching: { text: statusMessage || 'Searching for opponent...', color: 'text-orange-600' },
    found: { text: 'Match found! Redirecting...', color: 'text-green-600' },
    error: { text: matchError || 'Error occurred.', color: 'text-red-600' },
  };

  const statusInfo = matchStatusConfig[matchStatus];

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
                <p className="text-sm font-semibold text-gray-900">{playerData?.displayName}</p>
                <p className="text-xs text-gray-600">• ELO: {playerData?.elo}</p>
                {/* <p className="text-xs text-gray-600">• Server: {playerData?.groupName}</p> */}
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
                  {playerData?.displayName?.charAt(0)?.toUpperCase()}
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

          {/* Left Column – VR Connection & Find Match */}
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
                <span className="ml-auto text-xs text-gray-400 italic">Optional</span>
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
                        onPaste={index === 0 ? handlePaste : undefined}
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
                    disabled={!pinFull || isLinkingVr}
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

            {/* Find Match Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-xl shadow-md">
                  <Swords className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Find Match</h2>
              </div>

              <p className="text-sm text-gray-600 mb-5">
                {vrConnected
                  ? 'VR connected! Click to enter ranked matchmaking.'
                  : 'Play on Web — no VR required. Click to find an opponent.'}
              </p>

              {/* Status indicator */}
              {statusInfo && (
                <div
                  className={`flex items-center gap-2 mb-4 text-sm font-medium ${statusInfo.color}`}
                >
                  {isSearching && (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                  <span>{statusInfo.text}</span>
                </div>
              )}

              {/* Find Match / Cancel button */}
              {!isSearching ? (
                <button
                  onClick={startSearching}
                  disabled={matchStatus === 'found'}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3.5 rounded-xl hover:from-orange-400 hover:to-red-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex justify-center items-center gap-2 text-base"
                >
                  <Search className="w-5 h-5" />
                  Find Match
                </button>
              ) : (
                <button
                  onClick={stopSearching}
                  className="w-full bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-all border border-gray-300 flex justify-center items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel Search
                </button>
              )}
            </div>
          </div>

          {/* Right Column – Stats and Profile */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300 p-4 shadow-md">
                <Trophy className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{playerData?.totalWins}</p>
                <p className="text-xs text-blue-700">Total Wins</p>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl border border-purple-300 p-4 shadow-md">
                <Target className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{playerData?.elo}</p>
                <p className="text-xs text-purple-700">ELO Score</p>
              </div>

              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300 p-4 shadow-md">
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{playerData?.winRate}%</p>
                <p className="text-xs text-green-700">Win Rate</p>
              </div>

              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl border border-orange-300 p-4 shadow-md">
                <Zap className="w-8 h-8 text-orange-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{playerData?.totalLosses}</p>
                <p className="text-xs text-orange-700">Total Losses</p>
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
                  <p
                    className={`text-2xl font-bold flex items-center gap-1 ${(playerData?.currentStreak || 0) >= 0 ? 'text-red-500' : 'text-blue-500'
                      }`}
                  >
                    <span>{Math.abs(playerData?.currentStreak || 0)}</span>
                    <span
                      className={
                        (playerData?.currentStreak || 0) < 0
                          ? 'hue-rotate-[190deg] brightness-125 saturate-150'
                          : ''
                      }
                    >
                      🔥
                    </span>
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
                            <p className="text-gray-900 font-semibold">
                              vs {match.opponentName || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-600">
                                {match.timestamp
                                  ? new Date(match.timestamp).toLocaleString()
                                  : 'Recently'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-bold ${match.result === 'Win' ? 'text-green-600' : 'text-red-600'
                              }`}
                          >
                            {match.result}
                          </span>
                          <div className="flex flex-col items-end gap-1 mt-1">
                            {match.eloChange !== undefined && (
                              <p
                                className={`text-xs font-semibold ${match.eloChange >= 0 ? 'text-green-500' : 'text-red-500'
                                  }`}
                              >
                                {match.eloChange >= 0 ? '+' : ''}
                                {match.eloChange} ELO
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