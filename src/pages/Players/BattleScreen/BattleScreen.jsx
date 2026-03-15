import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Target, Zap, Shield, Trophy, Clock, Flag, AlertTriangle } from 'lucide-react';
import { getPlayerProfileByUserAndServer, getGameConfig } from '../../../api';
import { fireShot, getMatchState, surrenderMatch, claimTimeout } from '../../../api/matchApi';
import { ensureConnectedAndRegistered, disconnectMatchHub } from '../../../hooks/matchHubConnection';

const GRID_SIZE = 10;

function buildGrid(size = GRID_SIZE) {
  return Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => ({ state: 'unknown' }))
  );
}

export default function BattleScreen() {
  const { matchId, userId, serverId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const starterPlayerIdFromState = location.state?.starterPlayerId;

  const [playerData, setPlayerData] = useState(null);
  const [boardSize, setBoardSize] = useState(10);
  const [myGrid, setMyGrid] = useState(() => buildGrid(10));
  const [opponentGrid, setOpponentGrid] = useState(() => buildGrid(10));
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerName, setWinnerName] = useState('');
  const [lastShotResult, setLastShotResult] = useState(null);
  const [turnCount, setTurnCount] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFiring, setIsFiring] = useState(false);
  const [myShots, setMyShots] = useState(0);
  const [myHits, setMyHits] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Waiting for game to start...');
  const [myHasVr, setMyHasVr] = useState(() => localStorage.getItem('myHasVr') === 'true');
  const [opponentHasVr, setOpponentHasVr] = useState(false);
  const toastTimer = useRef(null);
  // keep isMyTurn in a ref for use inside event handlers without re-registering
  const isMyTurnRef = useRef(isMyTurn);
  useEffect(() => { isMyTurnRef.current = isMyTurn; }, [isMyTurn]);

  // ── Fetch player profile & game config ────────────────────────────
  useEffect(() => {
    if (!userId || !serverId || !matchId) { navigate('/server-selection'); return; }

    const init = async () => {
      try {
        const profile = await getPlayerProfileByUserAndServer(userId, serverId);
        if (!profile) {
          navigate('/server-selection');
          return;
        }

        try {
          const state = await getMatchState(matchId, profile.playerId);
          const lvlId = state?.levelId || 1;
          const config = await getGameConfig(lvlId);
          const size = config?.boardSize || 10;
          setBoardSize(size);
          setMyGrid(buildGrid(size));
          setOpponentGrid(buildGrid(size));
        } catch (err) {
          console.error('[BattleScreen] fetch custom grid config error:', err);
        }

        // Set player data after grid sizes are ready so SignalR hooks bind properly
        setPlayerData(profile);
        // Call fallback sync immediately to restore grid data on hard reload
        await fetchAndRestoreState(matchId, profile.playerId);
      } catch (err) {
        console.error('[BattleScreen] fetchProfile error:', err);
        navigate('/server-selection');
      }
    };

    const fetchAndRestoreState = async (mId, pId) => {
      try {
        const state = await getMatchState(mId, pId);
        if (state && state.status === 'Playing') {
          console.log('[BattleScreen] Initial sync successful, state:', state);
          const turnId = state.currentTurnPlayerId || state.turnPlayerId;
          if (turnId) {
            const isMine = String(turnId) === String(pId);
            setIsMyTurn(isMine);
            setStatusMessage(isMine ? 'Your turn! Click to fire.' : "Opponent's turn...");
          }
           
          if (state.myBoard?.grid) {
            setMyGrid(prev => {
              const next = prev.map(r => r.map(c => ({ ...c })));
              state.myBoard.grid.forEach(cell => {
                const { x, y, status } = cell;
                if (x >= 0 && y >= 0 && y < next.length && x < next[0].length) {
                  if (status === 'Hit' || status === 'Sunk' || status === 1) next[y][x] = { ...next[y][x], state: 'hit' };
                  else if (status === 'Miss' || status === 2) next[y][x] = { ...next[y][x], state: 'miss' };
                  else if (status === 'Ship' || status === 3) next[y][x] = { ...next[y][x], state: 'ship' };
                }
              });
              return next;
            });
          }
          if (state.opponentBoard?.grid) {
            setOpponentGrid(prev => {
              const next = prev.map(r => r.map(c => ({ ...c })));
              state.opponentBoard.grid.forEach(cell => {
                const { x, y, status } = cell;
                if (x >= 0 && y >= 0 && y < next.length && x < next[0].length) {
                  if (status === 'Hit' || status === 'Sunk' || status === 1) next[y][x] = { ...next[y][x], state: 'hit' };
                  else if (status === 'Miss' || status === 2) next[y][x] = { ...next[y][x], state: 'miss' };
                }
              });
              return next;
            });
          }
        }
      } catch(err) {
         console.error('[BattleScreen] Initial sync error:', err);
      }
    };

    init();
  }, [userId, serverId, matchId, navigate]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((result) => {
    setLastShotResult(result);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setLastShotResult(null), 2500);
  }, []);

  // ── Initial Turn from State ────────────────────────────────────────
  useEffect(() => {
    if (playerData && starterPlayerIdFromState && !gameOver) {
       console.log('[BattleScreen] Setting initial turn from state:', starterPlayerIdFromState);
       const isMine = String(starterPlayerIdFromState) === String(playerData.playerId);
       setIsMyTurn(isMine);
       setStatusMessage(isMine ? '⚔️ You go first! Click to fire.' : '⏳ Opponent goes first...');
       setTimeLeft(30);
    }
  }, [playerData, starterPlayerIdFromState, gameOver]);

  // ── Timer Logic ───────────────────────────────────────────────────
  useEffect(() => {
    if (gameOver) return;
    const timerId = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameOver]);

  // ── Fallback Sync Mechanism ────────────────────────────────────────
  useEffect(() => {
    if (!playerData || !matchId || gameOver) return;
    
    // Fallback timer: poll server to catch events missed by SignalR (e.g. AFK timeout, game over)
    const fallbackTimer = setTimeout(async () => {
      try {
        const state = await getMatchState(matchId, playerData.playerId);
        
        // Check if game ended (AFK timeout, surrender, etc.)
        const finishedStatuses = ['Finished', 'Ended', 'GameOver', 'Completed'];
        if (state && finishedStatuses.some(s => state.status?.toLowerCase() === s.toLowerCase())) {
          console.log('[BattleScreen] Fallback sync: game finished, showing game over.');
          setGameOver(true);
          // Determine winner from state.winnerId if available
          if (state.winnerId !== undefined && state.winnerId !== null) {
            const isWinner = String(state.winnerId) === String(playerData.playerId);
            setWinner(isWinner ? 'you' : 'opponent');
          }
          return;
        }
        
        if (state && state.status === 'Playing') {
          console.log('[BattleScreen] Fallback sync triggered, state:', state);
          const turnId = state.currentTurnPlayerId || state.turnPlayerId;
          if (turnId) {
            const isMine = String(turnId) === String(playerData.playerId);
            setIsMyTurn(isMine);
            setStatusMessage(isMine ? 'Your turn! Click to fire.' : "Opponent's turn...");
          }
          
          if (state.myBoard?.grid) {
            setMyGrid(prev => {
              const next = prev.map(r => r.map(c => ({ ...c })));
              state.myBoard.grid.forEach(cell => {
                const { x, y, status } = cell;
                if (x >= 0 && y >= 0 && y < next.length && x < next[0].length) {
                  if (status === 'Hit' || status === 'Sunk' || status === 1) next[y][x] = { ...next[y][x], state: 'hit' };
                  else if (status === 'Miss' || status === 2) next[y][x] = { ...next[y][x], state: 'miss' };
                  else if (status === 'Ship' || status === 3) next[y][x] = { ...next[y][x], state: 'ship' };
                }
              });
              return next;
            });
          }
          if (state.opponentBoard?.grid) {
            setOpponentGrid(prev => {
              const next = prev.map(r => r.map(c => ({ ...c })));
              state.opponentBoard.grid.forEach(cell => {
                const { x, y, status } = cell;
                if (x >= 0 && y >= 0 && y < next.length && x < next[0].length) {
                  if (status === 'Hit' || status === 'Sunk' || status === 1) next[y][x] = { ...next[y][x], state: 'hit' };
                  else if (status === 'Miss' || status === 2) next[y][x] = { ...next[y][x], state: 'miss' };
                }
              });
              return next;
            });
          }
        }
      } catch(err) {
         console.error('[BattleScreen] Fallback sync error:', err);
      }
    }, 10000); // Only run after 10s if everything is suspiciously quiet

    return () => clearTimeout(fallbackTimer);
  }, [playerData, matchId, gameOver]);

  // ── SignalR: Singleton connection + events ─────────────────────────
  useEffect(() => {
    if (!playerData) return;
    let active = true;
    let cleanup = null;

    const setup = async () => {
      try {
        const conn = await ensureConnectedAndRegistered(playerData.playerId);

        const onGameState = (gameState) => {
          if (!active) return;
          if (gameState?.isOpponentUsingVr !== undefined) {
            setOpponentHasVr(gameState.isOpponentUsingVr);
          }
          const turnId = gameState?.currentTurnPlayerId || gameState?.turnPlayerId;
          if (turnId) {
            const isMine = String(turnId) === String(playerData.playerId);
            setIsMyTurn(isMine);
            setStatusMessage(isMine ? 'Your turn! Click to fire.' : "Opponent's turn...");
            setTimeLeft(30);
          }
          if (gameState?.myBoard?.grid) {
            setMyGrid(prev => {
              const next = prev.map(r => r.map(c => ({ ...c })));
              gameState.myBoard.grid.forEach(cell => {
                const { x, y, status } = cell;
                if (x >= 0 && y >= 0 && y < next.length && x < next[0].length) {
                  if (status === 'Hit' || status === 'Sunk' || status === 1) next[y][x] = { ...next[y][x], state: 'hit' };
                  else if (status === 'Miss' || status === 2) next[y][x] = { ...next[y][x], state: 'miss' };
                  else if (status === 'Ship' || status === 3) next[y][x] = { ...next[y][x], state: 'ship' };
                }
              });
              return next;
            });
          }
          if (gameState?.opponentBoard?.grid) {
            setOpponentGrid(prev => {
              const next = prev.map(r => r.map(c => ({ ...c })));
              gameState.opponentBoard.grid.forEach(cell => {
                const { x, y, status } = cell;
                if (x >= 0 && y >= 0 && y < next.length && x < next[0].length) {
                  if (status === 'Hit' || status === 'Sunk' || status === 1) next[y][x] = { ...next[y][x], state: 'hit' };
                  else if (status === 'Miss' || status === 2) next[y][x] = { ...next[y][x], state: 'miss' };
                }
              });
              return next;
            });
          }
        };

        const onGameStarted = (starterPlayerId) => {
          if (!active) return;
          const isMine = starterPlayerId === playerData.playerId;
          setIsMyTurn(isMine);
          setStatusMessage(isMine ? '⚔️ You go first! Click to fire.' : '⏳ Opponent goes first...');
          setTimeLeft(30);
        };

        const onShotResult = async (shotResult) => {
          if (!active) return;
          setTimeLeft(30);
          console.log('[BattleScreen] ReceiveShotResult:', shotResult);
          
          const { isGameOver } = shotResult;

          // Re-sync both grids from API after every shot — this is the most reliable approach.
          // We cannot trust isMyTurnRef to know who fired, so we just ask the server for truth.
          try {
            const state = await getMatchState(matchId, playerData.playerId);
            if (!active) return;
            
            if (state?.myBoard?.grid) {
              setMyGrid(prev => {
                const next = prev.map(r => r.map(c => ({ ...c })));
                state.myBoard.grid.forEach(cell => {
                  const { x, y, status } = cell;
                  if (x >= 0 && y >= 0 && y < next.length && x < next[0].length) {
                    if (status === 'Hit' || status === 'Sunk' || status === 1) next[y][x] = { ...next[y][x], state: 'hit' };
                    else if (status === 'Miss' || status === 2) next[y][x] = { ...next[y][x], state: 'miss' };
                    else if (status === 'Ship' || status === 3) next[y][x] = { ...next[y][x], state: 'ship' };
                  }
                });
                return next;
              });
            }
            if (state?.opponentBoard?.grid) {
              setOpponentGrid(prev => {
                const next = prev.map(r => r.map(c => ({ ...c })));
                state.opponentBoard.grid.forEach(cell => {
                  const { x, y, status } = cell;
                  if (x >= 0 && y >= 0 && y < next.length && x < next[0].length) {
                    if (status === 'Hit' || status === 'Sunk' || status === 1) next[y][x] = { ...next[y][x], state: 'hit' };
                    else if (status === 'Miss' || status === 2) next[y][x] = { ...next[y][x], state: 'miss' };
                  }
                });
                return next;
              });
            }
            const turnId = state?.currentTurnPlayerId || state?.turnPlayerId;
            if (turnId) {
              const isMine = String(turnId) === String(playerData.playerId);
              setIsMyTurn(isMine);
              setStatusMessage(isMine ? 'Your turn! Click to fire.' : "Opponent's turn...");
            }
          } catch (err) {
            console.error('[BattleScreen] onShotResult sync error:', err);
          }

          if (isGameOver) setGameOver(true);
        };

        const onGameOver = (winnerId, wName) => {
          if (!active) return;
          console.log('[BattleScreen] ReceiveGameOver:', winnerId, wName);
          setGameOver(true);
          setWinnerName(wName || '');
          // Cast to string on both sides to avoid type mismatch (number vs string)
          const isWinner = String(winnerId) === String(playerData.playerId);
          setWinner(isWinner ? 'you' : 'opponent');
          disconnectMatchHub();
        };

        const onDisconnected = () => {
          if (!active) return;
          setStatusMessage('Opponent disconnected. Waiting for reconnect (30s)...');
        };

        const onReconnected = () => {
          if (!active) return;
          setStatusMessage(isMyTurnRef.current ? 'Your turn! Click to fire.' : "Opponent's turn...");
        };

        const onVrLinkConfirmed = () => {
          if (!active) return;
          setMyHasVr(true);
          localStorage.setItem('myHasVr', 'true');
        };

        conn.on('ReceiveGameState', onGameState);
        conn.on('ReceiveVrLinkConfirmed', onVrLinkConfirmed);
        conn.on('ReceiveGameStarted', onGameStarted);
        conn.on('ReceiveShotResult', onShotResult);
        conn.on('ReceiveGameOver', onGameOver);
        conn.on('ReceivePlayerDisconnected', onDisconnected);
        conn.on('ReceivePlayerReconnected', onReconnected);

        cleanup = () => {
          active = false;
          conn.off('ReceiveGameState', onGameState);
          conn.off('ReceiveGameStarted', onGameStarted);
          conn.off('ReceiveShotResult', onShotResult);
          conn.off('ReceiveGameOver', onGameOver);
          conn.off('ReceivePlayerDisconnected', onDisconnected);
          conn.off('ReceivePlayerReconnected', onReconnected);
          conn.off('ReceiveVrLinkConfirmed', onVrLinkConfirmed);
        };
      } catch (err) {
        console.error('[BattleScreen] SignalR setup error:', err);
      }
    };

    setup();

    return () => {
      active = false;
      if (cleanup) cleanup();
    };
  }, [playerData, matchId]);

  // ── Bắn tàu ───────────────────────────────────────────────────────
  const handleCellClick = useCallback(async (row, col) => {
    if (!isMyTurn || gameOver || isFiring || !playerData) return;
    if (opponentGrid[row][col].state !== 'unknown') return;

    setIsFiring(true);
    try {
      const result = await fireShot(matchId, playerData.playerId, col, row);
      setOpponentGrid(prev => {
        const next = prev.map(r => r.map(c => ({ ...c })));
        next[row][col] = {
          ...next[row][col],
          state: result.result === 'Miss' ? 'miss' : 'hit',
          sunk: result.result === 'Sunk',
        };
        return next;
      });
      setMyShots(s => s + 1);
      if (result.result !== 'Miss') setMyHits(h => h + 1);

      const type = result.result === 'Miss' ? 'miss' : result.result === 'Sunk' ? 'sunk' : 'hit';
      showToast({ type });

      if (result.isGameOver) {
        setGameOver(true);
        setWinner('you');
      } else {
        if (result.result === 'Miss') {
          setIsMyTurn(false);
          setStatusMessage("Opponent's turn...");
        } else {
          setStatusMessage("Direct Hit! You get another shot.");
        }
        setTurnCount(t => t + 1);
        setTimeLeft(30);
      }
    } catch (err) {
      console.error('[BattleScreen] fireShot error:', err);
      const msg = err?.response?.data?.message;
      if (msg) showToast({ type: 'error', message: msg });
    } finally {
      setIsFiring(false);
    }
  }, [isMyTurn, gameOver, isFiring, opponentGrid, matchId, playerData, showToast]);

  // ── Đầu hàng ───────────────────────────────────────────────────────
  const handleSurrender = async () => {
    if (gameOver || !playerData || !matchId) return;
    if (window.confirm("Are you sure you want to surrender?")) {
      try {
        setIsFiring(true);
        await surrenderMatch(matchId, playerData.playerId);
        showToast({ type: 'error', message: 'You surrendered!' });
        setGameOver(true);
        setWinner('opponent');
        // Let SignalR handle the opponent's side, navigate after a short delay
        setTimeout(() => {
          navigate(`/game-over/${matchId}/${userId}/${serverId}?winner=B`);
        }, 2000);
      } catch (err) {
        console.error('[BattleScreen] Surrender error:', err);
        showToast({ type: 'error', message: 'Failed to surrender' });
        setIsFiring(false);
      }
    }
  };

  // ── Báo Cáo AFK (Timeout Claim) ────────────────────────────────────
  const handleClaimTimeout = async () => {
    if (gameOver || !playerData || !matchId) return;
    try {
      setIsFiring(true);
      await claimTimeout(matchId, playerData.playerId);
      showToast({ type: 'hit', message: 'AFK Timeout Claimed!' });
    } catch (err) {
      console.error('[BattleScreen] Claim timeout error:', err);
      showToast({ type: 'error', message: err?.response?.data?.message || 'Failed to claim AFK' });
      setIsFiring(false);
    }
  };

  const accuracy = myShots > 0 ? Math.round((myHits / myShots) * 100) : 0;
  const myName = playerData?.displayName || 'You';

  const renderCell = (cell, r, c, isEnemy) => {
    let bg = 'bg-blue-900/50';
    if (isEnemy) {
      if (cell.state === 'hit') bg = 'bg-red-500 cursor-not-allowed';
      else if (cell.state === 'miss') bg = 'bg-gray-500/60 cursor-not-allowed';
      else if (isMyTurn && !gameOver && !isFiring) bg = 'bg-blue-900/50 hover:bg-orange-500/40 cursor-crosshair';
      else bg = 'bg-blue-900/50 cursor-not-allowed';
    } else {
      if (cell.state === 'hit') bg = 'bg-red-500/80';
      else if (cell.state === 'miss') bg = 'bg-gray-500/40';
      else if (cell.state === 'ship') bg = 'bg-green-500/80';
    }
    return (
      <div
        key={`${r}-${c}`}
        className={`w-9 h-9 border border-blue-800/40 transition-all flex items-center justify-center text-sm flex-shrink-0 ${bg}`}
        onClick={() => isEnemy && handleCellClick(r, c)}
      >
        {cell.state === 'hit' && '💥'}
        {cell.state === 'miss' && <span className="w-2 h-2 bg-gray-400 rounded-full" />}
      </div>
    );
  };

  const renderGrid = (grid, isEnemy) => {
    const labels = Array(grid.length).fill(0).map((_, i) => String.fromCharCode(65 + i));
    return (
      <div className="overflow-auto">
        <div className="flex ml-7 mb-1">
          {labels.map(l => (
            <div key={l} className="flex-shrink-0 w-9 h-5 flex items-center justify-center text-xs font-bold text-blue-300">{l}</div>
          ))}
        </div>
        {grid.map((row, r) => (
          <div key={r} className="flex">
            <div className="flex-shrink-0 w-7 h-9 flex items-center justify-center text-xs font-bold text-blue-300">{r + 1}</div>
            {row.map((cell, c) => renderCell(cell, r, c, isEnemy))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4">
      <div className="container mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Battle in Progress</h1>
              <div className="flex items-center gap-2">
                <p className="text-blue-300 text-xs">Match #{matchId} · Turn {turnCount}</p>
                {opponentHasVr && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                    🥽 Opponent is using VR
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-5 py-2.5 rounded-xl font-black text-base flex items-center gap-2 transition-all ${isMyTurn && !gameOver ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                : gameOver ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
                  : 'bg-orange-500/20 border-2 border-orange-500 text-orange-400'
              }`}>
              {gameOver ? <><Trophy className="w-5 h-5" /> Game Over</>
                : isMyTurn ? <><Target className="w-5 h-5" /> Your Turn</>
                  : <><Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '2s' }} /> Opponent's Turn</>}
            </div>
            
            {!gameOver && (
              <div className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 ${timeLeft > 10 ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-500 animate-pulse'}`}>
                <Clock className="w-4 h-4" />
                {timeLeft}s
              </div>
            )}

            {!gameOver && !isMyTurn && timeLeft === 0 && (
              <button 
                onClick={handleClaimTimeout} 
                disabled={isFiring} 
                className="bg-yellow-500/20 hover:bg-yellow-500/40 border-2 border-yellow-500/50 text-yellow-500 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                Claim AFK Win
              </button>
            )}

            {!gameOver && (
              <button 
                onClick={handleSurrender} 
                disabled={isFiring} 
                className="bg-red-500/20 hover:bg-red-500/40 border-2 border-red-500/50 text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">Surrender</span>
              </button>
            )}
          </div>
        </div>

        <div className="mb-3 text-center">
          <p className="text-blue-200 text-sm">{statusMessage}</p>
        </div>

        {myHasVr ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-center mt-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl mb-6 border-4 border-purple-400/30">
              <span className="text-5xl">🥽</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Switch to VR Headset</h2>
            <p className="text-blue-200 text-lg max-w-md mx-auto">
              Game has started! Please put on your VR headset to command your fleet and sink the enemy.
            </p>
          </div>
        ) : (
          <>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
            <p className="text-blue-300 text-xs mb-0.5">Shots Fired</p>
            <p className="text-white text-xl font-black">{myShots}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
            <p className="text-blue-300 text-xs mb-0.5">Hits</p>
            <p className="text-green-400 text-xl font-black">{myHits}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
            <p className="text-blue-300 text-xs mb-0.5">Accuracy</p>
            <p className="text-yellow-400 text-xl font-black">{accuracy}%</p>
          </div>
        </div>

        {/* Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-red-400" />
              Enemy Waters
              {isMyTurn && !gameOver && <span className="ml-auto text-xs text-orange-300 animate-pulse font-normal">← Click to fire</span>}
            </h2>
            {renderGrid(opponentGrid, true)}
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2 text-base">
              <Shield className="w-5 h-5 text-blue-400" />
              Your Ocean — {myName}
            </h2>
            {renderGrid(myGrid, false)}
          </div>
        </div>
          </>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className={`mt-6 rounded-2xl p-8 text-center border-2 ${winner === 'you' ? 'bg-yellow-500/20 border-yellow-400' : 'bg-red-500/20 border-red-400'}`}>
            <p className={`text-4xl font-black mb-3 ${winner === 'you' ? 'text-yellow-400' : 'text-red-400'}`}>
              {winner === 'you' ? '🏆 Victory!' : '💀 Defeated!'}
            </p>
            {winnerName && <p className="text-white/70 text-lg mb-3">{winner === 'you' ? 'Well done!' : `${winnerName} wins!`}</p>}
            <button
              onClick={() => navigate(`/game-over/${matchId}/${userId}/${serverId}?winner=${winner === 'you' ? 'A' : 'B'}`)}
              className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black px-10 py-3 rounded-xl hover:opacity-90 transition-all"
            >
              View Results
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {lastShotResult && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-10 py-7 rounded-3xl shadow-2xl text-center pointer-events-none z-50 ${lastShotResult.type === 'miss' ? 'bg-gray-700' : lastShotResult.type === 'error' ? 'bg-orange-700' : 'bg-red-600'
          }`}>
          <p className="text-white font-black text-5xl mb-1">
            {lastShotResult.type === 'hit' && '💥 HIT!'}
            {lastShotResult.type === 'miss' && '❌ MISS!'}
            {lastShotResult.type === 'sunk' && '⚓ SUNK!'}
            {lastShotResult.type === 'error' && '⚠️'}
          </p>
          {lastShotResult.message && <p className="text-white/80 text-base">{lastShotResult.message}</p>}
        </div>
      )}
    </div>
  );
}
