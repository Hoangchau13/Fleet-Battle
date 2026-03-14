import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? ''}/hubs/match`;

/**
 * Custom hook to manage a SignalR connection for spectating a live match.
 * @param {number|null} matchId - The ID of the match to spectate.
 * @param {boolean} isOpen     - Whether the spectator modal is open.
 */
export function useSpectatorHub(matchId, isOpen) {
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const connectionRef = useRef(null);

  const buildConnection = useCallback(() => {
    const token = localStorage.getItem('token');
    return new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([1000, 2000, 5000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }, []);

  useEffect(() => {
    if (!isOpen || !matchId) return;

    let conn = buildConnection();
    connectionRef.current = conn;
    let active = true;

    conn.on('ReceiveSpectatorGameState', (state) => {
      if (active) setGameState(state);
    });

    conn.onreconnecting(() => {
      if (active) setIsConnected(false);
    });

    conn.onreconnected(() => {
      if (active) {
        setIsConnected(true);
        conn.invoke('JoinSpectatorMode', matchId).catch(console.error);
      }
    });

    conn.onclose((err) => {
      if (active) {
        setIsConnected(false);
        if (err) setConnectionError('Mất kết nối. Vui lòng thử lại.');
      }
    });

    const start = async () => {
      try {
        await conn.start();
        if (!active) return;
        setIsConnected(true);
        setConnectionError(null);
        await conn.invoke('JoinSpectatorMode', matchId);
      } catch (err) {
        if (active) {
          console.error('[SpectatorHub] Connection error:', err);
          setConnectionError('Không thể kết nối SignalR. Kiểm tra lại server.');
          setIsConnected(false);
        }
      }
    };

    start();

    return () => {
      active = false;
      if (conn && conn.state !== signalR.HubConnectionState.Disconnected) {
        conn.invoke('LeaveSpectatorMode', matchId).catch(() => {}).finally(() => {
          conn.stop();
        });
      }
      setGameState(null);
      setIsConnected(false);
      setConnectionError(null);
    };
  }, [isOpen, matchId, buildConnection]);

  return { gameState, isConnected, connectionError };
}
