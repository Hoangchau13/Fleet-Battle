import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ship, RotateCcw, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { getMatchState, getGameConfig, setupMatch, getPlayerProfileByUserAndServer, getShipTypes } from '../../../api';
import { ensureConnectedAndRegistered } from '../../../hooks/matchHubConnection';

// Note: Backend requires angles in degrees (0, 90, 180, 270)
const ROTATION = { DEG_0: 0, DEG_90: 90, DEG_180: 180, DEG_270: 270 };

// Ship colors
const SHIP_COLORS = {
  1: 'bg-blue-500',
  2: 'bg-purple-500',
  3: 'bg-green-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

function buildEmptyGrid(size) {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

export default function ShipPlacement() {
  const { matchId, userId, serverId } = useParams();
  const navigate = useNavigate();

  const [playerData, setPlayerData] = useState(null);
  const [boardSize, setBoardSize] = useState(10);
  const [levelId, setLevelId] = useState(null);
  const [ships, setShips] = useState([]); // [{shipTypeId, name, size, count}]
  const [grid, setGrid] = useState(buildEmptyGrid(10));
  const [placedShips, setPlacedShips] = useState([]); // [{shipTypeId, x, y, rotation}]
  const [selectedShip, setSelectedShip] = useState(null); // ship type being placed
  const [rotation, setRotation] = useState(0);
  const [hoverCell, setHoverCell] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [error, setError] = useState('');
  const connectionRef = useRef(null);

  // Fetch player profile from API using URL params
  useEffect(() => {
    if (!userId || !serverId) {
      navigate('/server-selection');
      return;
    }

    const fetchProfile = async () => {
      try {
        const profile = await getPlayerProfileByUserAndServer(userId, serverId);
        if (profile) {
          setPlayerData(profile);
        } else {
          navigate('/server-selection');
        }
      } catch (err) {
        console.error('[ShipPlacement] Failed to fetch player profile:', err);
        navigate('/server-selection');
      }
    };

    fetchProfile();
  }, [userId, serverId, navigate]);

  // Keyboard shortcut L or R to rotate
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'l' || e.key === 'L') {
        setRotation(r => (r + 270) % 360);
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation(r => (r + 90) % 360);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load match state → levelId → game config (ships + board size)
  useEffect(() => {
    if (!playerData || !matchId) return;
    const load = async () => {
      try {
        const state = await getMatchState(matchId, playerData.playerId);
        const lvlId = state?.levelId || 1;
        setLevelId(lvlId);

        const [config, allShipTypes] = await Promise.all([
          getGameConfig(lvlId),
          getShipTypes().catch(err => {
            console.error('Failed to fetch ship types:', err);
            return [];
          })
        ]);

        let shipsArray = [];
        if (Array.isArray(allShipTypes)) shipsArray = allShipTypes;
        else if (allShipTypes?.data && Array.isArray(allShipTypes.data)) shipsArray = allShipTypes.data;

        const size = config?.boardSize || 10;
        setBoardSize(size);
        setGrid(buildEmptyGrid(size));

        // config.ships: [{shipTypeId, shipName, size, count, shapePattern}] (or similar)
        const rawShips = config?.ships || config?.shipTypes || [];
        setShips(rawShips.map(s => {
          const typeId = s.shipTypeId ?? s.id;
          const fullShipData = shipsArray.find(st => st.shipTypeId === typeId);
          return {
            shipTypeId: typeId,
            name: s.shipName ?? s.name ?? fullShipData?.shipName ?? `Ship ${typeId}`,
            size: s.size ?? s.shipSize ?? fullShipData?.size ?? 1,
            shapePattern: s.shapePattern ?? s.shipType?.shapePattern ?? fullShipData?.shapePattern ?? null,
            remaining: s.count ?? s.quantity ?? 1,
          };
        }));
      } catch (err) {
        console.error('Failed to load level config:', err);
        // Fallback: 10x10 with demo ships
        setBoardSize(10);
        setGrid(buildEmptyGrid(10));
        setShips([
          { shipTypeId: 1, name: 'Carrier', size: 5, remaining: 1 },
          { shipTypeId: 2, name: 'Battleship', size: 4, remaining: 1 },
          { shipTypeId: 3, name: 'Cruiser', size: 3, remaining: 1 },
          { shipTypeId: 4, name: 'Submarine', size: 3, remaining: 1 },
          { shipTypeId: 5, name: 'Destroyer', size: 2, remaining: 1 },
        ]);
      }
    };
    load();
  }, [playerData, matchId]);

  // ── SignalR: Singleton – Lắng nghe ReceiveGameStarted → BattleScreen ─
  useEffect(() => {
    if (!playerData) return;
    let active = true;

    const setup = async () => {
      try {
        const conn = await ensureConnectedAndRegistered(playerData.playerId);

        const onGameStarted = (starterPlayerId) => {
          if (!active) return;
          console.log('[ShipPlacement] ReceiveGameStarted → BattleScreen:', starterPlayerId);
          navigate(`/battle/${matchId}/${userId}/${serverId}`, { state: { starterPlayerId } });
        };

        const onGameState = (gameState) => {
          if (!active) return;
          if (gameState?.status === 'Playing') {
            navigate(`/battle/${matchId}/${userId}/${serverId}`, { state: { starterPlayerId: gameState.turnPlayerId } });
          }
        };

        conn.on('ReceiveGameStarted', onGameStarted);
        conn.on('ReceiveGameState', onGameState);

        return () => {
          active = false;
          conn.off('ReceiveGameStarted', onGameStarted);
          conn.off('ReceiveGameState', onGameState);
        };
      } catch (err) {
        console.error('[ShipPlacement] SignalR error:', err);
      }
    };

    let cleanup;
    setup().then(fn => { cleanup = fn; });

    return () => {
      active = false;
      if (cleanup) cleanup();
    };
  }, [playerData, matchId, navigate, userId, serverId]);

  // Get cells a ship would occupy based on shapePattern and rotation
  const getOccupiedCells = useCallback((row, col, ship, rot) => {
    let activeCells = [[0, 0]]; // Default fallback (anchor only)
    try {
      if (ship?.shapePattern) {
        activeCells = JSON.parse(ship.shapePattern);
      } else if (ship?.size) {
        // Fallback to straight line if no shapePattern (legacy support)
        activeCells = Array(ship.size).fill(0).map((_, i) => [i, 0]);
      }
    } catch (e) {
      console.error('getOccupiedCells parse error:', e);
    }

    return activeCells.map(([cx, cy]) => {
      // Rotation logic for Grid where Y increases downwards:
      // 0 deg: original
      // 90 deg (clockwise): x' = -y, y' = x
      // 180 deg: x' = -x, y' = -y
      // 270 deg (counter-clockwise): x' = y, y' = -x
      let rx, ry;

      if (rot === 0) {
        rx = cx;  // col offset
        ry = cy;  // row offset
      } else if (rot === 90) {
        rx = -cy; // col offset
        ry = cx;  // row offset
      } else if (rot === 180) {
        rx = -cx;
        ry = -cy;
      } else if (rot === 270) {
        rx = cy;
        ry = -cx;
      } else {
        rx = cx;
        ry = cy;
      }

      return {
        r: row + ry,
        c: col + rx
      };
    });
  }, []);

  // Check if placement is valid
  const isValidPlacement = useCallback((row, col, ship, rot, currentGrid) => {
    if (!ship) return false;
    const cells = getOccupiedCells(row, col, ship, rot);
    return cells.every(({ r, c }) =>
      r >= 0 && r < boardSize && c >= 0 && c < boardSize && !currentGrid[r][c]
    );
  }, [boardSize, getOccupiedCells]);

  // Place selected ship on click
  const handleCellClick = useCallback((row, col) => {
    if (!selectedShip || submitDone) return;
    const ship = ships.find(s => s.shipTypeId === selectedShip);
    if (!ship || ship.remaining <= 0) return;

    if (!isValidPlacement(row, col, ship, rotation, grid)) return;

    const cells = getOccupiedCells(row, col, ship, rotation);
    const newGrid = grid.map(r => [...r]);
    cells.forEach(({ r, c }) => {
      newGrid[r][c] = { shipTypeId: ship.shipTypeId, color: SHIP_COLORS[ship.shipTypeId] || 'bg-gray-500' };
    });
    setGrid(newGrid);
    setPlacedShips(prev => [...prev, { shipTypeId: ship.shipTypeId, x: col, y: row, rotation }]);
    setShips(prev => prev.map(s =>
      s.shipTypeId === selectedShip ? { ...s, remaining: s.remaining - 1 } : s
    ));
    // Auto-deselect if no more remaining
    if (ship.remaining - 1 <= 0) setSelectedShip(null);
  }, [selectedShip, ships, rotation, grid, isValidPlacement, getOccupiedCells, submitDone]);

  // Clear all
  const handleReset = () => {
    setGrid(buildEmptyGrid(boardSize));
    setPlacedShips([]);
    setShips(prev => prev.map(s => {
      // restore remaining from original count — use placed ships to compute
      const placed = placedShips.filter(p => p.shipTypeId === s.shipTypeId).length;
      return { ...s, remaining: s.remaining + placed };
    }));
    setSelectedShip(null);
    setSubmitDone(false);
    setError('');
  };

  const allPlaced = ships.every(s => s.remaining === 0);

  const handleSubmit = async () => {
    if (!allPlaced || isSubmitting || submitDone) return;
    setIsSubmitting(true);
    setError('');
    try {
      await setupMatch(matchId, playerData.playerId, placedShips);
      setSubmitDone(true);
    } catch (err) {
      console.error('setupMatch error:', err);
      setError(err?.response?.data?.message || 'Failed to submit ship placement. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCombat = () => {
    navigate(`/battle/${matchId}/${userId}/${serverId}`);
  };

  // Hover preview
  const previewCells = hoverCell && selectedShip && (() => {
    const ship = ships.find(s => s.shipTypeId === selectedShip);
    if (!ship || ship.remaining <= 0) return [];
    return getOccupiedCells(hoverCell.r, hoverCell.c, ship, rotation);
  })();
  const previewValid = previewCells && selectedShip && isValidPlacement(
    hoverCell?.r, hoverCell?.c,
    ships.find(s => s.shipTypeId === selectedShip),
    rotation, grid
  );

  const unplacedCount = ships.reduce((acc, s) => acc + s.remaining, 0);

  // Render mini ship preview from shapePattern
  const renderShipPreview = (ship) => {
    let activeCells = [];
    try {
      activeCells = JSON.parse(ship.shapePattern || '[[0,0]]');
    } catch (e) {
      activeCells = [[0, 0]];
    }

    const grid = Array(5).fill().map(() => Array(5).fill(false));
    activeCells.forEach(([x, y]) => {
      const c = x + 2;
      const r = y + 2;
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        grid[r][c] = true;
      }
    });

    const isDepleted = ship.remaining === 0;

    return (
      <div className="flex flex-col gap-[2px] mt-2">
        {grid.map((row, r) => {
          // Chỉ render các hàng có ít nhất 1 ô màu để tiết kiệm không gian
          if (!row.some(isActive => isActive)) return null;
          return (
            <div key={r} className="flex gap-[2px] justify-center">
              {row.map((isActive, c) => {
                // Kiểm tra xem cột này có ô màu nào trong toàn bộ grid không
                const hasCol = grid.some(gr => gr[c]);
                if (!hasCol) return null;

                const isAnchor = r === 2 && c === 2;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] flex items-center justify-center text-[10px] ${isActive
                        ? (isDepleted ? 'bg-gray-600' : (SHIP_COLORS[ship.shipTypeId] || 'bg-blue-500'))
                        : 'bg-transparent'
                      }`}
                  >
                    {isActive && isAnchor && <span className="text-white/80 leading-none">⚓</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
              <Ship className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Ship Placement</h1>
              <p className="text-blue-300 text-xs">Match #{matchId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${allPlaced ? 'bg-green-500/20 text-green-400 border border-green-600' : 'bg-orange-500/20 text-orange-300 border border-orange-600'
              }`}>
              {unplacedCount === 0 ? '✓ All ships placed' : `${unplacedCount} ship(s) remaining`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

          {/* Left: Ship Palette */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <Ship className="w-4 h-4 text-blue-400" /> Your Fleet
              </h2>

              <div className="space-y-2">
                {ships.map(ship => (
                  <button
                    key={ship.shipTypeId}
                    onClick={() => {
                      if (ship.remaining > 0 && !submitDone) setSelectedShip(ship.shipTypeId);
                    }}
                    disabled={ship.remaining === 0 || submitDone}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedShip === ship.shipTypeId
                        ? 'border-blue-400 bg-blue-500/30 shadow-lg shadow-blue-500/20'
                        : ship.remaining === 0
                          ? 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                          : 'border-white/20 bg-white/10 hover:bg-white/20 cursor-pointer'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white text-sm font-semibold">{ship.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ship.remaining === 0 ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 text-white'
                        }`}>×{ship.remaining}</span>
                    </div>
                    {/* Ship preview */}
                    <div className="flex justify-center mt-2">
                      {renderShipPreview(ship)}
                    </div>
                  </button>
                ))}
              </div>

              {/* Rotation + Reset */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rotation: {rotation}° (Press L/R)
                </button>
                <button
                  onClick={handleReset}
                  disabled={placedShips.length === 0}
                  className="w-full py-2.5 bg-red-600/30 hover:bg-red-600/50 border border-red-600/50 text-red-400 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4 text-blue-200 text-xs space-y-1.5">
              <p className="font-bold text-blue-300 mb-2">How to place ships:</p>
              <p>① Select a ship from the list</p>
              <p>② Click on the grid to place it</p>
              <p>③ Use Rotate to change direction</p>
              <p>④ Place all ships, then click <strong>Submit</strong></p>
            </div>
          </div>

          {/* Center: Grid */}
          <div className="xl:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold">Your Ocean</h2>
                <p className="text-blue-300 text-sm">{boardSize}×{boardSize}</p>
              </div>

              <div className="overflow-auto">
                {/* Column labels */}
                <div className="flex ml-7 mb-1">
                  {Array(boardSize).fill(0).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-9 h-6 flex items-center justify-center text-xs font-bold text-blue-300">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>

                {grid.map((row, r) => (
                  <div key={r} className="flex">
                    {/* Row label */}
                    <div className="flex-shrink-0 w-7 h-9 flex items-center justify-center text-xs font-bold text-blue-300">
                      {r + 1}
                    </div>
                    {row.map((cell, c) => {
                      const isPreview = previewCells?.some(p => p.r === r && p.c === c);
                      const isBadPreview = isPreview && !previewValid;
                      return (
                        <div
                          key={c}
                          className={`flex-shrink-0 w-9 h-9 border border-blue-800/50 cursor-pointer transition-all ${cell
                              ? `${cell.color} opacity-90`
                              : isPreview
                                ? isBadPreview
                                  ? 'bg-red-500/50'
                                  : 'bg-blue-400/50'
                                : 'bg-blue-900/40 hover:bg-blue-700/40'
                            }`}
                          onClick={() => handleCellClick(r, c)}
                          onMouseEnter={() => setHoverCell({ r, c })}
                          onMouseLeave={() => setHoverCell(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-center gap-2 bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit / Combat buttons */}
              <div className="mt-6 flex gap-3">
                {!submitDone ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!allPlaced || isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        Submit Placement
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-2 bg-green-500/20 border border-green-500 rounded-xl p-3 text-green-400 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      Ships submitted! Waiting for opponent...
                    </div>
                    <button
                      onClick={handleCombat}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black py-4 rounded-xl transition-all shadow-2xl flex items-center justify-center gap-2 text-lg animate-pulse"
                    >
                      <ArrowRight className="w-6 h-6" />
                      ⚔ Combat!
                    </button>
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
