import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ship, Target, Zap, Trophy } from 'lucide-react';

const GRID_SIZE = 9;

export default function BattleScreen() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // Mock player grid with ships
  const [playerGrid, setPlayerGrid] = useState(() => {
    const grid = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({ ship: null, hit: false }))
    );
    // Place mock ships
    for (let i = 0; i < 5; i++) grid[0][i] = { ship: 'carrier', hit: false };
    for (let i = 0; i < 4; i++) grid[2][i] = { ship: 'battleship', hit: false };
    for (let i = 0; i < 3; i++) grid[4][i] = { ship: 'cruiser', hit: false };
    for (let i = 0; i < 2; i++) grid[6][i] = { ship: 'destroyer', hit: false };
    return grid;
  });

  // Opponent grid (hidden ships, only shows shots)
  const [opponentGrid, setOpponentGrid] = useState(
    Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({ hit: false, miss: false }))
    )
  );

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [stats, setStats] = useState({
    playerShots: 0,
    playerHits: 0,
    playerMisses: 0,
    opponentShots: 0,
    opponentHits: 0,
  });

  const [ships, setShips] = useState({
    player: {
      carrier: { total: 5, hits: 0, sunk: false },
      battleship: { total: 4, hits: 0, sunk: false },
      cruiser: { total: 3, hits: 0, sunk: false },
      destroyer: { total: 2, hits: 0, sunk: false },
    },
    opponent: {
      carrier: { total: 5, hits: 0, sunk: false },
      battleship: { total: 4, hits: 0, sunk: false },
      cruiser: { total: 3, hits: 0, sunk: false },
      destroyer: { total: 2, hits: 0, sunk: false },
    },
  });

  const [lastShot, setLastShot] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // Mock opponent ships (hidden from player)
  const opponentShipsHidden = useState(() => {
    const grid = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => null)
    );
    // Place mock opponent ships
    for (let i = 0; i < 5; i++) grid[1][i + 2] = 'carrier';
    for (let i = 0; i < 4; i++) grid[3][i + 3] = 'battleship';
    for (let i = 0; i < 3; i++) grid[5][i + 1] = 'cruiser';
    for (let i = 0; i < 2; i++) grid[7][i + 4] = 'destroyer';
    return grid;
  })[0];

  // Simulate opponent turn
  useEffect(() => {
    if (!isPlayerTurn && !gameOver) {
      const timer = setTimeout(() => {
        // Random shot
        let row, col;
        do {
          row = Math.floor(Math.random() * GRID_SIZE);
          col = Math.floor(Math.random() * GRID_SIZE);
        } while (playerGrid[row][col].hit);

        const newPlayerGrid = playerGrid.map(r => r.map(c => ({...c})));
        newPlayerGrid[row][col].hit = true;

        const isHit = newPlayerGrid[row][col].ship !== null;
        
        setPlayerGrid(newPlayerGrid);
        setStats(prev => ({
          ...prev,
          opponentShots: prev.opponentShots + 1,
          opponentHits: prev.opponentHits + (isHit ? 1 : 0),
        }));

        if (isHit) {
          const shipType = newPlayerGrid[row][col].ship;
          const newShips = { ...ships };
          newShips.player[shipType].hits += 1;
          if (newShips.player[shipType].hits >= newShips.player[shipType].total) {
            newShips.player[shipType].sunk = true;
          }
          setShips(newShips);

          // Check if player lost
          if (Object.values(newShips.player).every(s => s.sunk)) {
            setGameOver(true);
            setTimeout(() => navigate(`/game-over/${roomId}?winner=opponent`), 2000);
          }
        }

        setIsPlayerTurn(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameOver, playerGrid, ships, navigate, roomId]);

  const handleCellClick = (row, col) => {
    if (!isPlayerTurn || gameOver) return;
    if (opponentGrid[row][col].hit || opponentGrid[row][col].miss) return;

    const newOpponentGrid = opponentGrid.map(r => r.map(c => ({...c})));
    const isHit = opponentShipsHidden[row][col] !== null;

    if (isHit) {
      newOpponentGrid[row][col].hit = true;
      const shipType = opponentShipsHidden[row][col];
      
      const newShips = { ...ships };
      newShips.opponent[shipType].hits += 1;
      if (newShips.opponent[shipType].hits >= newShips.opponent[shipType].total) {
        newShips.opponent[shipType].sunk = true;
        setLastShot({ type: 'sunk', ship: shipType });
      } else {
        setLastShot({ type: 'hit' });
      }
      setShips(newShips);

      // Check if opponent lost
      if (Object.values(newShips.opponent).every(s => s.sunk)) {
        setGameOver(true);
        setTimeout(() => navigate(`/game-over/${roomId}?winner=player`), 2000);
      }
    } else {
      newOpponentGrid[row][col].miss = true;
      setLastShot({ type: 'miss' });
    }

    setOpponentGrid(newOpponentGrid);
    setStats(prev => ({
      ...prev,
      playerShots: prev.playerShots + 1,
      playerHits: prev.playerHits + (isHit ? 1 : 0),
      playerMisses: prev.playerMisses + (isHit ? 0 : 1),
    }));

    setIsPlayerTurn(false);
    setTimeout(() => setLastShot(null), 2000);
  };

  const getShipHealthBar = (ship) => {
    const percentage = ((ship.total - ship.hits) / ship.total) * 100;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${
              ship.sunk ? 'bg-red-500' : percentage > 50 ? 'bg-green-500' : percentage > 25 ? 'bg-yellow-500' : 'bg-orange-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 w-16">
          {ship.total - ship.hits}/{ship.total}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-300 shadow-xl p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <Ship className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Battle in Progress</h1>
                <p className="text-sm text-gray-600">Room: {roomId}</p>
              </div>
            </div>

            <div className={`px-6 py-3 rounded-xl font-bold text-lg ${
              isPlayerTurn
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-orange-100 text-orange-700 border-2 border-orange-300'
            }`}>
              {isPlayerTurn ? (
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  YOUR TURN
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 animate-pulse" />
                  OPPONENT'S TURN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Battle Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Your Ocean */}
          <div className="bg-white rounded-2xl border border-gray-300 shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Ship className="w-5 h-5 text-blue-600" />
              Your Ocean
            </h2>

            <div className="inline-block">
              {/* Column labels */}
              <div className="flex ml-8 mb-1">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(letter => (
                  <div key={letter} className="w-10 h-6 flex items-center justify-center font-bold text-xs text-gray-600">
                    {letter}
                  </div>
                ))}
              </div>

              {playerGrid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  <div className="w-8 h-10 flex items-center justify-center font-bold text-xs text-gray-600">
                    {rowIndex + 1}
                  </div>
                  
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`w-10 h-10 border border-gray-400 ${
                        cell.hit
                          ? cell.ship
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                          : cell.ship
                          ? 'bg-blue-400'
                          : 'bg-blue-100'
                      }`}
                    >
                      {cell.hit && cell.ship && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xl">
                          💥
                        </div>
                      )}
                      {cell.hit && !cell.ship && (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          ❌
                        </div>
                      )}
                      {!cell.hit && cell.ship && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Ship className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Your Ships Status */}
            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-gray-800 text-sm mb-2">Your Fleet:</h3>
              {Object.entries(ships.player).map(([key, ship]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-sm font-semibold w-24 ${ship.sunk ? 'text-red-600 line-through' : 'text-gray-700'}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </span>
                  {getShipHealthBar(ship)}
                  {ship.sunk && <span className="text-xs text-red-600 font-bold">⚓ SUNK</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Enemy Waters */}
          <div className="bg-white rounded-2xl border border-gray-300 shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-red-600" />
              Enemy Waters
            </h2>

            <div className="inline-block">
              {/* Column labels */}
              <div className="flex ml-8 mb-1">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(letter => (
                  <div key={letter} className="w-10 h-6 flex items-center justify-center font-bold text-xs text-gray-600">
                    {letter}
                  </div>
                ))}
              </div>

              {opponentGrid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  <div className="w-8 h-10 flex items-center justify-center font-bold text-xs text-gray-600">
                    {rowIndex + 1}
                  </div>
                  
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className={`w-10 h-10 border border-gray-400 transition-all ${
                        cell.hit
                          ? 'bg-red-500 cursor-not-allowed'
                          : cell.miss
                          ? 'bg-gray-300 cursor-not-allowed'
                          : isPlayerTurn
                          ? 'bg-blue-200 hover:bg-yellow-200 cursor-crosshair'
                          : 'bg-blue-200 cursor-not-allowed'
                      }`}
                    >
                      {cell.hit && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xl">
                          💥
                        </div>
                      )}
                      {cell.miss && (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          ❌
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Enemy Ships Status */}
            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-gray-800 text-sm mb-2">Enemy Fleet:</h3>
              {Object.entries(ships.opponent).map(([key, ship]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-sm font-semibold w-24 ${ship.sunk ? 'text-red-600 line-through' : 'text-gray-700'}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </span>
                  {getShipHealthBar(ship)}
                  {ship.sunk && <span className="text-xs text-red-600 font-bold">⚓ SUNK</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-4 bg-white rounded-xl border border-gray-300 shadow-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Shots</p>
              <p className="text-2xl font-bold text-gray-900">{stats.playerShots}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Hits</p>
              <p className="text-2xl font-bold text-green-600">{stats.playerHits}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.playerShots > 0 ? Math.round((stats.playerHits / stats.playerShots) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shot Result Toast */}
      {lastShot && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-8 py-6 rounded-2xl shadow-2xl animate-bounce text-center ${
          lastShot.type === 'hit' || lastShot.type === 'sunk'
            ? 'bg-red-500'
            : 'bg-gray-500'
        }`}>
          <p className="text-white font-bold text-4xl mb-2">
            {lastShot.type === 'hit' && '💥 HIT!'}
            {lastShot.type === 'miss' && '❌ MISS!'}
            {lastShot.type === 'sunk' && '⚓ SHIP SUNK!'}
          </p>
          {lastShot.type === 'sunk' && (
            <p className="text-white text-xl">
              {lastShot.ship.toUpperCase()} destroyed!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
