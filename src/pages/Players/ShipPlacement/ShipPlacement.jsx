import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ship, RotateCw, Trash2, Check, Clock } from 'lucide-react';

const GRID_SIZE = 9;
const SHIPS = [
  { id: 'carrier', name: 'Carrier', size: 5, icon: '🚢🚢🚢🚢🚢', color: 'from-blue-500 to-blue-600' },
  { id: 'battleship', name: 'Battleship', size: 4, icon: '🚢🚢🚢🚢', color: 'from-purple-500 to-purple-600' },
  { id: 'cruiser', name: 'Cruiser', size: 3, icon: '🚢🚢🚢', color: 'from-green-500 to-green-600' },
  { id: 'destroyer', name: 'Destroyer', size: 2, icon: '🚢🚢', color: 'from-orange-500 to-orange-600' },
];

export default function ShipPlacement() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
  const [placedShips, setPlacedShips] = useState({});
  const [selectedShip, setSelectedShip] = useState(null);
  const [orientation, setOrientation] = useState('horizontal'); // 'horizontal' or 'vertical'
  const [hoveredCells, setHoveredCells] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Simulate opponent ready after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpponentReady(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Check if both players ready
  useEffect(() => {
    if (isReady && opponentReady && countdown === null) {
      setCountdown(3);
    }
  }, [isReady, opponentReady, countdown]);

  // Countdown to battle
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      navigate(`/battle/${roomId}`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate, roomId]);

  const getShipColor = (shipId) => {
    const ship = SHIPS.find(s => s.id === shipId);
    return ship ? ship.color : 'from-gray-500 to-gray-600';
  };

  const canPlaceShip = (row, col, shipSize, orientation) => {
    // Check boundaries
    if (orientation === 'horizontal') {
      if (col + shipSize > GRID_SIZE) return false;
      // Check if cells are empty
      for (let i = 0; i < shipSize; i++) {
        if (grid[row][col + i] !== null) return false;
      }
    } else {
      if (row + shipSize > GRID_SIZE) return false;
      for (let i = 0; i < shipSize; i++) {
        if (grid[row + i][col] !== null) return false;
      }
    }
    return true;
  };

  const getCellsForShip = (row, col, shipSize, orientation) => {
    const cells = [];
    if (orientation === 'horizontal') {
      for (let i = 0; i < shipSize; i++) {
        cells.push({ row, col: col + i });
      }
    } else {
      for (let i = 0; i < shipSize; i++) {
        cells.push({ row: row + i, col });
      }
    }
    return cells;
  };

  const handleCellHover = (row, col) => {
    if (!selectedShip || placedShips[selectedShip.id]) return;
    
    const cells = getCellsForShip(row, col, selectedShip.size, orientation);
    setHoveredCells(cells);
  };

  const handleCellClick = (row, col) => {
    if (!selectedShip || placedShips[selectedShip.id]) return;
    
    if (!canPlaceShip(row, col, selectedShip.size, orientation)) {
      // Show error feedback
      return;
    }

    // Place ship
    const newGrid = grid.map(r => [...r]);
    const cells = getCellsForShip(row, col, selectedShip.size, orientation);
    
    cells.forEach(cell => {
      newGrid[cell.row][cell.col] = selectedShip.id;
    });

    setGrid(newGrid);
    setPlacedShips({
      ...placedShips,
      [selectedShip.id]: { cells, orientation }
    });
    setSelectedShip(null);
    setHoveredCells([]);
  };

  const handleRemoveShip = (shipId) => {
    const newGrid = grid.map(r => [...r]);
    const shipData = placedShips[shipId];
    
    if (shipData) {
      shipData.cells.forEach(cell => {
        newGrid[cell.row][cell.col] = null;
      });
    }

    setGrid(newGrid);
    const newPlacedShips = { ...placedShips };
    delete newPlacedShips[shipId];
    setPlacedShips(newPlacedShips);
  };

  const handleReset = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setPlacedShips({});
    setSelectedShip(null);
    setHoveredCells([]);
  };

  const handleReady = () => {
    if (Object.keys(placedShips).length === SHIPS.length) {
      setIsReady(true);
    }
  };

  const allShipsPlaced = Object.keys(placedShips).length === SHIPS.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Place Your Ships</h1>
              <p className="text-gray-600">Position all 4 ships on your grid to start the battle</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-sm text-gray-600">Opponent Status:</p>
                <p className={`font-bold ${opponentReady ? 'text-green-600' : 'text-orange-600'}`}>
                  {opponentReady ? '✓ Ready' : '⏳ Placing ships...'}
                </p>
              </div>
              
              {!isReady ? (
                <>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center gap-2 border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleReady}
                    disabled={!allShipsPlaced}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      allShipsPlaced
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    Ready!
                  </button>
                </>
              ) : (
                <div className="px-6 py-2 bg-green-100 text-green-700 rounded-lg font-bold border border-green-300 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  You're Ready!
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Ocean (9x9 Grid)</h2>
              
              <div className="inline-block">
                {/* Column labels */}
                <div className="flex ml-10 mb-2">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(letter => (
                    <div key={letter} className="w-12 h-8 flex items-center justify-center font-bold text-gray-600">
                      {letter}
                    </div>
                  ))}
                </div>

                {/* Grid with row labels */}
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {/* Row label */}
                    <div className="w-10 h-12 flex items-center justify-center font-bold text-gray-600">
                      {rowIndex + 1}
                    </div>
                    
                    {/* Cells */}
                    {row.map((cell, colIndex) => {
                      const isHovered = hoveredCells.some(c => c.row === rowIndex && c.col === colIndex);
                      const canPlace = selectedShip && !placedShips[selectedShip.id] && 
                                      canPlaceShip(rowIndex, colIndex, selectedShip.size, orientation);
                      
                      return (
                        <div
                          key={colIndex}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                          onMouseLeave={() => setHoveredCells([])}
                          className={`w-12 h-12 border border-gray-300 cursor-pointer transition-all ${
                            cell
                              ? `bg-gradient-to-br ${getShipColor(cell)} border-2 border-gray-400`
                              : isHovered
                              ? canPlace
                                ? 'bg-green-200 border-green-400'
                                : 'bg-red-200 border-red-400'
                              : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          {cell && (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              <Ship className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 text-sm text-gray-600">
                <p>• Click on grid to place selected ship</p>
                <p>• Green preview: Valid placement | Red preview: Invalid placement</p>
              </div>
            </div>
          </div>

          {/* Ships List */}
          <div className="space-y-4">
            {/* Orientation Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ship Orientation
              </label>
              <button
                onClick={() => setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
                className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center gap-2 font-semibold text-blue-700 transition-all"
              >
                <RotateCw className="w-5 h-5" />
                {orientation === 'horizontal' ? 'Horizontal ↔' : 'Vertical ↕'}
              </button>
            </div>

            {/* Available Ships */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3">Available Ships</h3>
              <div className="space-y-2">
                {SHIPS.map((ship) => {
                  const isPlaced = placedShips[ship.id];
                  const isSelected = selectedShip?.id === ship.id;

                  return (
                    <div
                      key={ship.id}
                      onClick={() => !isPlaced && setSelectedShip(ship)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isPlaced
                          ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-100 border-blue-500 shadow-md'
                          : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">{ship.name}</span>
                        {isPlaced ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveShip(ship.id);
                            }}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition-all"
                          >
                            Remove
                          </button>
                        ) : (
                          <span className="text-sm text-gray-600">({ship.size} cells)</span>
                        )}
                      </div>
                      <div className="text-2xl">{ship.icon}</div>
                      {isPlaced && (
                        <div className="mt-2 text-xs text-green-600 font-semibold">
                          ✓ Placed
                        </div>
                      )}
                      {isSelected && !isPlaced && (
                        <div className="mt-2 text-xs text-blue-600 font-semibold">
                          → Click on grid to place
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress */}
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl border border-purple-200 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">Progress</span>
                <span className="font-bold text-purple-700">
                  {Object.keys(placedShips).length}/{SHIPS.length}
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500"
                  style={{ width: `${(Object.keys(placedShips).length / SHIPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Both Players Ready!</h2>
            <p className="text-gray-600 mb-6">Battle starting in...</p>
            <div className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
              {countdown}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
