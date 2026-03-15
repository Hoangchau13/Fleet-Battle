import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { findMatch, cancelMatch } from '../api/matchApi';
import {
  getMatchHubConnection,
  ensureConnectedAndRegistered,
  disconnectMatchHub,
} from './matchHubConnection';
import * as signalR from '@microsoft/signalr';

/**
 * Custom hook quản lý SignalR + REST cho luồng tìm trận (Matchmaking).
 * Dùng singleton connection từ matchHubConnection.js để không bị disconnect
 * khi chuyển trang.
 *
 * Luồng theo tài liệu kỹ thuật BE:
 *   1. connect SignalR + RegisterPlayer(playerId) TRƯỚC khi tìm trận
 *   2. POST /match/find
 *   3. ReceiveMatchStatus("Found") → vào MatchRoom (chờ confirm)
 *   4. ReceiveMatchFound(matchId) → sau khi cả 2 confirm → ShipPlacement
 */
export function useMatchmakingHub(playerId, userId, serverId) {
  const navigate = useNavigate();

  const [matchStatus, setMatchStatus] = useState('idle');
  const [matchId, setMatchId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const isSearching = matchStatus === 'searching' || matchStatus === 'connecting';

  // Đăng ký event handlers trên singleton connection khi hook mount
  useEffect(() => {
    const conn = getMatchHubConnection();

    const onMatchStatus = (status, mId, message) => {
      console.log('[MatchHub] ReceiveMatchStatus:', status, mId, message);
      setStatusMessage(message || '');
      if (mId) setMatchId(mId);

      if (status === 'Searching') {
        setMatchStatus('searching');
      } else if (status === 'Found') {
        setMatchStatus('found');
        if (mId) navigate(`/match-room/${mId}/${userId}/${serverId}`);
      } else if (status === 'Cancelled') {
        setMatchStatus('idle');
        setMatchId(null);
      } else if (status === 'InGame') {
        setMatchStatus('found');
        if (mId) navigate(`/match-room/${mId}/${userId}/${serverId}`);
      } else {
        setMatchStatus('idle');
      }
    };

    const onMatchFound = (mId) => {
      // ReceiveMatchFound = cả 2 confirm → ShipPlacement
      console.log('[MatchHub] ReceiveMatchFound → ShipPlacement:', mId);
      setMatchId(mId);
      setMatchStatus('setup');
      navigate(`/ship-placement/${mId}/${userId}/${serverId}`);
    };

    conn.on('ReceiveMatchStatus', onMatchStatus);
    conn.on('ReceiveMatchFound', onMatchFound);

    conn.onreconnected(() => setIsConnected(true));
    conn.onreconnecting(() => setIsConnected(false));

    return () => {
      conn.off('ReceiveMatchStatus', onMatchStatus);
      conn.off('ReceiveMatchFound', onMatchFound);
      // KHÔNG stop() connection ở đây – duy trì liên tục cho MatchRoom
    };
  }, [navigate, userId, serverId]);

  /**
   * Bắt đầu tìm trận:
   * 1. connect + RegisterPlayer
   * 2. POST /match/find
   */
  const startSearching = useCallback(async () => {
    if (!playerId) {
      setError('Player ID not found.');
      return;
    }

    setError(null);
    setMatchStatus('connecting');
    setStatusMessage('Connecting to match server...');

    try {
      await ensureConnectedAndRegistered(playerId);
      setIsConnected(true);
      setMatchStatus('searching');
      setStatusMessage('Searching for an opponent...');

      const result = await findMatch(playerId);
      console.log('[Matchmaking] findMatch result:', result);

      if (result?.status === 'Found') {
        const mId = result.matchId;
        setMatchId(mId);
        setMatchStatus('found');
        navigate(`/match-room/${mId}/${userId}/${serverId}`);
      } else {
        setMatchStatus('searching');
        setStatusMessage(result?.message || 'Searching for an opponent...');
      }
    } catch (err) {
      console.error('[Matchmaking] startSearching error:', err);
      setMatchStatus('error');
      setError(err?.response?.data?.message || 'Failed to start matchmaking. Please try again.');
    }
  }, [playerId, userId, serverId, navigate]);

  const stopSearching = useCallback(async () => {
    if (!playerId) return;
    try {
      await cancelMatch(playerId);
    } catch (err) {
      console.warn('[Matchmaking] cancelMatch error:', err);
    } finally {
      setMatchStatus('idle');
      setStatusMessage('');
      setMatchId(null);
      await disconnectMatchHub();
      setIsConnected(false);
    }
  }, [playerId]);

  return {
    matchStatus,
    matchId,
    statusMessage,
    isConnected,
    isSearching,
    error,
    startSearching,
    stopSearching,
  };
}
