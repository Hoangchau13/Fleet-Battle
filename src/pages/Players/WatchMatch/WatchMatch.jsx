import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Target, Crosshair, Ship as ShipIcon } from 'lucide-react';

export default function WatchMatch() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [playerAGrid, setPlayerAGrid] = useState([]);
  const [playerBGrid, setPlayerBGrid] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('A'); // 'A' or 'B'
  const [notification, setNotification] = useState(null); // { type: 'hit'|'miss'|'sunk', message: string }
  const [gameOver, setGameOver] = useState(false);

  // Mock player names
  const playerAName = 'Captain_Alex';
  const playerBName = 'Commander_Jack';

  // Initialize grids (9x9)
  useEffect(() => {
    const initGrid = () => {
      const grid = [];
      for (let row = 0; row < 9; row++) {
        const rowData = [];
        for (let col = 0; col < 9; col++) {
          rowData.push({ status: 'water' }); // water, hit, miss, ship
        }
        grid.push(rowData);
      }
      return grid;
    };

    setPlayerAGrid(initGrid());
    setPlayerBGrid(initGrid());

    // Simulate game flow
    simulateGame();
  }, []);

  const simulateGame = () => {
    let moveCount = 0;
    const interval = setInterval(() => {
      moveCount++;

      // Simulate random shot
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      const isHit = Math.random() > 0.6; // 40% chance of hit
      const isSunk = isHit && Math.random() > 0.8; // 20% chance of sunk if hit

      // Determine which grid to update (opposite of current turn)
      const targetGrid = currentTurn === 'A' ? 'B' : 'A';
      
      if (targetGrid === 'A') {
        setPlayerAGrid(prev => {
          const newGrid = prev.map(r => [...r]);
          if (newGrid[row][col].status === 'water') {
            newGrid[row][col].status = isHit ? 'hit' : 'miss';
            return newGrid;
          }
          return prev;
        });
      } else {
        setPlayerBGrid(prev => {
          const newGrid = prev.map(r => [...r]);
          if (newGrid[row][col].status === 'water') {
            newGrid[row][col].status = isHit ? 'hit' : 'miss';
            return newGrid;
          }
          return prev;
        });
      }

      // Show notification
      if (isSunk) {
        showNotification('sunk', '💥 SHIP DESTROYED!');
      } else if (isHit) {
        showNotification('hit', '🎯 DIRECT HIT!');
      } else {
        showNotification('miss', '💨 MISS!');
      }

      // Toggle turn
      setCurrentTurn(prev => prev === 'A' ? 'B' : 'A');

      // End game after 30 moves (for demo)
      if (moveCount >= 30) {
        clearInterval(interval);
        setGameOver(true);
        setTimeout(() => {
          const winner = Math.random() > 0.5 ? 'A' : 'B';
          navigate(`/game-over/${roomId}?winner=${winner}&playerA=${playerAName}&playerB=${playerBName}`);
        }, 2000);
      }
    }, 2000); // Shot every 2 seconds

    return () => clearInterval(interval);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 1500);
  };

  const getCellClass = (status) => {
    switch(status) {
      case 'hit':
        return 'bg-red-500 border-red-700';
      case 'miss':
        return 'bg-blue-300 border-blue-400';
      case 'ship':
        return 'bg-gray-400 border-gray-500';
      default:
        return 'bg-blue-100 border-blue-200';
    }
  };

  const renderGrid = (grid, playerName, isActive) => {
    return (
      <div className={`flex-1 transition-all duration-500 ${isActive ? 'bg-yellow-50 scale-105' : 'bg-white scale-100'} rounded-2xl p-6 border-4 ${isActive ? 'border-yellow-400 shadow-2xl' : 'border-gray-200 shadow-lg'}`}>
        {/* Player Name */}
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">{playerName}</h2>
          {isActive && (
            <div className="flex items-center justify-center gap-2 text-orange-600 text-sm font-semibold">
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
              <span>ATTACKING</span>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="aspect-square max-w-xl mx-auto">
          <div className="grid grid-cols-9 gap-1 h-full">
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${getCellClass(cell.status)} border-2 rounded-sm flex items-center justify-center transition-all duration-300 hover:scale-110`}
                >
                  {cell.status === 'hit' && <Crosshair className="w-4 h-4 text-white" />}
                  {cell.status === 'miss' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      {/* Room Header */}
      <div className="text-center py-4 mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">⚓ Fleet Battle VR ⚓</h1>
        <p className="text-blue-200">Room: <span className="font-mono font-bold">{roomId}</span></p>
      </div>

      {/* Grids Container */}
      <div className="max-w-[1800px] mx-auto flex gap-6 px-4">
        {/* Player A Grid */}
        {renderGrid(playerAGrid, playerAName, currentTurn === 'A')}

        {/* Player B Grid */}
        {renderGrid(playerBGrid, playerBName, currentTurn === 'B')}
      </div>

      {/* Center Notification Overlay */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className={`
            transform scale-150 animate-bounce
            px-16 py-12 rounded-3xl shadow-2xl border-4
            ${notification.type === 'hit' ? 'bg-red-500 border-red-700' : ''}
            ${notification.type === 'miss' ? 'bg-blue-400 border-blue-600' : ''}
            ${notification.type === 'sunk' ? 'bg-orange-500 border-orange-700' : ''}
          `}>
            <div className="text-center">
              {notification.type === 'hit' && <Target className="w-24 h-24 text-white mx-auto mb-4" />}
              {notification.type === 'miss' && <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center text-6xl">💨</div>}
              {notification.type === 'sunk' && <ShipIcon className="w-24 h-24 text-white mx-auto mb-4" />}
              
              <p className="text-5xl font-black text-white drop-shadow-lg">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Battle Complete!</h2>
            <p className="text-gray-600 text-xl mb-6">Determining winner...</p>
            <div className="flex justify-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
