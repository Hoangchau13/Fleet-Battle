import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ship, CheckCircle, Clock, LogOut, AlertCircle, Loader } from 'lucide-react';
import { confirmMatch, getMatchState, getPlayerProfileByUserAndServer } from '../../../api';
import { ensureConnectedAndRegistered } from '../../../hooks/matchHubConnection';

export default function MatchRoom() {
  const { matchId, userId, serverId } = useParams();
  const navigate = useNavigate();

  const [playerData, setPlayerData] = useState(null);
  const [opponentName, setOpponentName] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Waiting for both players to confirm...');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Dùng để bỏ qua cái broadcast "PlayerReady" rác của chính mình
  const ignoreNextReady = React.useRef(false);

  // ── 1. Fetch player profile ─────────────────────────────────────────
  useEffect(() => {
    if (!userId || !serverId) {
      setError('Missing userId or serverId in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    getPlayerProfileByUserAndServer(userId, serverId)
      .then(profile => {
        if (profile) {
          setPlayerData(profile);
        } else {
          setError('Could not load player profile. Please try again.');
        }
      })
      .catch(err => {
        console.error('[MatchRoom] fetchProfile error:', err);
        // Do NOT navigate away – show error so player stays in room
        setError('Failed to load profile. Check your connection.');
      })
      .finally(() => setLoading(false));
  }, [userId, serverId]);

  // ── 2. Fetch match state → opponent name ───────────────────────────
  useEffect(() => {
    if (!playerData || !matchId) return;
    getMatchState(matchId, playerData.playerId)
      .then(state => {
        console.log('[MatchRoom] matchState:', state);
        // Try various field names the BE might use
        const name =
          state?.opponentName ||
          state?.opponent?.displayName ||
          state?.opponentBoard?.displayName ||
          (Array.isArray(state?.players)
            ? state.players.find(p => p.playerId !== playerData.playerId)?.displayName
            : null) ||
          null;
        if (name) setOpponentName(name);
      })
      .catch(err => console.warn('[MatchRoom] getMatchState:', err?.message));
  }, [playerData, matchId]);

  // ── 3. SignalR: register + events ──────────────────────────────────
  useEffect(() => {
    if (!playerData) return;
    let active = true;
    let cleanup = null;

    const setup = async () => {
      try {
        const conn = await ensureConnectedAndRegistered(playerData.playerId);

        const onMatchStatus = (status, mId, message) => {
          if (!active) return;
          console.log('[MatchRoom] ReceiveMatchStatus:', status, mId, message);

          if (status === 'PlayerReady') {
            // Nếu thông điệp chính là ID của mình hoặc mình đang chờ echo
            if (String(message) === String(playerData.playerId)) {
              console.log('[MatchRoom] Ignored own PlayerReady event (matched ID).');
              return;
            }
            if (ignoreNextReady.current) {
              console.log('[MatchRoom] Ignored own PlayerReady event (echo cancellation).');
              ignoreNextReady.current = false;
              return;
            }
            
            setOpponentReady(true);
            setStatusMessage('Opponent is ready! Waiting for you...');
          } else if (status === 'Cancelled') {
            setStatusMessage('Match was cancelled. Returning home...');
            setTimeout(() => { if (active) navigate(`/home/${userId}/${serverId}`); }, 2000);
          }
        };

        const onMatchFound = (mId) => {
          if (!active) return;
          // Both confirmed → ShipPlacement
          console.log('[MatchRoom] ReceiveMatchFound → ShipPlacement:', mId);
          navigate(`/ship-placement/${mId || matchId}/${userId}/${serverId}`);
        };

        conn.on('ReceiveMatchStatus', onMatchStatus);
        conn.on('ReceiveMatchFound', onMatchFound);

        cleanup = () => {
          active = false;
          conn.off('ReceiveMatchStatus', onMatchStatus);
          conn.off('ReceiveMatchFound', onMatchFound);
        };
      } catch (err) {
        console.error('[MatchRoom] SignalR setup error:', err);
      }
    };

    setup();

    return () => {
      active = false;
      if (cleanup) cleanup();
    };
  }, [playerData, matchId, navigate, userId, serverId]);

  // ── 4. Confirm ready ───────────────────────────────────────────────
  const handleReady = useCallback(async () => {
    if (!playerData || isReady || isConfirming) return;
    setIsConfirming(true);
    setError('');
    try {
      // Đánh dấu để bỏ qua phát sóng "PlayerReady" của chính mình từ Hub
      ignoreNextReady.current = true;
      
      await confirmMatch(matchId, playerData.playerId);
      setIsReady(true);
      setStatusMessage('You are ready! Waiting for opponent to confirm...');
    } catch (err) {
      console.error('[MatchRoom] confirmMatch error:', err);
      setError(err?.response?.data?.message || 'Failed to confirm. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  }, [playerData, isReady, isConfirming, matchId]);

  const myName = playerData?.displayName || '...';

  // ── Loading screen ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-xl">Loading match room...</p>
          <p className="text-blue-300 text-sm mt-1">Match #{matchId}</p>
        </div>
      </div>
    );
  }

  // ── Full UI (even if playerData is null – show error in context) ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-4 shadow-2xl">
            <Ship className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Match Found!</h1>
          <p className="text-blue-200">
            Match ID: <span className="font-bold text-white">#{matchId}</span>
          </p>
        </div>

        {/* Profile fetch error – but stay in room */}
        {error && !playerData && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 mb-6 text-center">
            <p className="text-red-300 text-sm flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                getPlayerProfileByUserAndServer(userId, serverId)
                  .then(p => { if (p) setPlayerData(p); })
                  .catch(e => setError(e?.message || 'Retry failed'))
                  .finally(() => setLoading(false));
              }}
              className="mt-3 text-blue-300 hover:text-white text-xs underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Players Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl mb-6">
          <div className="flex items-center gap-4">

            {/* You */}
            <div className={`flex-1 rounded-2xl p-6 text-center transition-all ${
              isReady ? 'bg-green-500/20 border-2 border-green-400' : 'bg-white/10 border-2 border-white/20'
            }`}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg">
                {myName.charAt(0).toUpperCase()}
              </div>
              <p className="text-white font-bold text-lg truncate">{myName}</p>
              <p className="text-blue-200 text-sm mb-3">You</p>
              {isReady
                ? <span className="flex items-center justify-center gap-1.5 text-green-400 font-bold"><CheckCircle className="w-5 h-5" /> Ready</span>
                : <span className="text-gray-400 text-sm flex items-center justify-center gap-1"><Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} /> Waiting...</span>
              }
            </div>

            <div className="text-white/60 font-black text-2xl flex-shrink-0">VS</div>

            {/* Opponent */}
            <div className={`flex-1 rounded-2xl p-6 text-center transition-all ${
              opponentReady ? 'bg-green-500/20 border-2 border-green-400' : 'bg-white/10 border-2 border-white/20'
            }`}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg">
                {opponentName ? opponentName.charAt(0).toUpperCase() : '?'}
              </div>
              <p className="text-white font-bold text-lg truncate">{opponentName || 'Opponent'}</p>
              <p className="text-orange-200 text-sm mb-3">Enemy</p>
              {opponentReady
                ? <span className="flex items-center justify-center gap-1.5 text-green-400 font-bold"><CheckCircle className="w-5 h-5" /> Ready</span>
                : <span className="text-gray-400 text-sm flex items-center justify-center gap-1"><Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} /> Waiting...</span>
              }
            </div>

          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-blue-200">
            {!isReady && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
            <p className="text-sm">{statusMessage}</p>
          </div>
          {error && playerData && (
            <p className="text-red-400 text-sm mt-2 font-medium flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />{error}
            </p>
          )}
        </div>

        {/* Ready Button */}
        <button
          onClick={handleReady}
          disabled={isReady || isConfirming || !playerData}
          className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-3 ${
            isReady
              ? 'bg-green-500/30 border-2 border-green-500 text-green-400 cursor-not-allowed'
              : !playerData
              ? 'bg-gray-600/30 border-2 border-gray-500 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white disabled:opacity-60'
          }`}
        >
          {isConfirming
            ? <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />Confirming...</>
            : isReady
            ? <><CheckCircle className="w-7 h-7" />Ready! Waiting for opponent...</>
            : <><CheckCircle className="w-7 h-7" />Ready</>
          }
        </button>

        {/* Leave */}
        <button
          onClick={() => navigate(`/home/${userId}/${serverId}`)}
          className="w-full mt-3 py-3 text-gray-400 hover:text-red-400 flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Leave Match
        </button>

      </div>
    </div>
  );
}
