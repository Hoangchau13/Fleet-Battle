import React, { useState, useEffect } from 'react';
import { Target, Shield, Trophy, X, Play, Pause, FastForward, SkipBack } from 'lucide-react';

export default function ReplayModal({ replayData, currentUser, onClose }) {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0); // 0 to maxTurns
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1000); // Default 1000ms

  const togglePlay = () => setIsPlaying(!isPlaying);

  // --- Parse API Response according to REPLAY_API_1.md ---
  const boardSize = replayData?.boardSize || 10;
  
  // Helper to build a clean dynamic grid
  const createEmptyGrid = (size) => 
    Array(size).fill(null).map(() => 
      Array(size).fill(null).map(() => ({ state: 'unknown', ship: false }))
    );

  const winnerId = replayData?.winnerId;
  const isVictory = String(winnerId) === String(currentUser?.playerId);
  
  const p1Id = replayData?.player1Id;
  const isP1 = String(p1Id) === String(currentUser?.playerId);

  // Define "User" (right board) vs "Enemy" (left board)
  const userName = isP1 ? replayData?.player1Name : replayData?.player2Name;
  const enemyName = isP1 ? replayData?.player2Name : replayData?.player1Name;

  const userInitialGridRaw = isP1 ? (replayData?.player1InitialGrid || []) : (replayData?.player2InitialGrid || []);
  const enemyInitialGridRaw = isP1 ? (replayData?.player2InitialGrid || []) : (replayData?.player1InitialGrid || []);
  
  const turns = replayData?.turns || [];
  const maxTurns = turns.length;
  const totalTurns = replayData?.totalTurns || maxTurns;

  // Compute grids up to `currentTurnIndex`
  const computeGrids = () => {
    const uGrid = createEmptyGrid(boardSize);
    const eGrid = createEmptyGrid(boardSize);

    // Plot initial ships
    const plotShips = (rawArr, boardGrid) => {
      rawArr.forEach(cell => {
        if (cell.x >= 0 && cell.x < boardSize && cell.y >= 0 && cell.y < boardSize) {
          boardGrid[cell.y][cell.x].ship = true;
          boardGrid[cell.y][cell.x].state = 'ship'; // visible baseline ship
        }
      });
    };

    plotShips(userInitialGridRaw, uGrid);
    plotShips(enemyInitialGridRaw, eGrid);

    // Apply turns from 0 to currentTurnIndex - 1
    for (let i = 0; i < currentTurnIndex; i++) {
       const turn = turns[i];
       if (!turn) continue;

       const turnShooterId = turn.shooterId;
       const isShooterUser = String(turnShooterId) === String(currentUser?.playerId);
       
       // If user shoots, the target is the enemy board.
       const targetBoard = isShooterUser ? eGrid : uGrid;
       
       if (turn.x >= 0 && turn.x < boardSize && turn.y >= 0 && turn.y < boardSize) {
         const res = String(turn.result).toLowerCase();
         if (res === 'hit' || res === 'sunk') {
           targetBoard[turn.y][turn.x].state = 'hit';
         } else if (res === 'miss') {
           targetBoard[turn.y][turn.x].state = 'miss';
         }
       }
    }

    return { uGrid, eGrid };
  };

  const { uGrid, eGrid } = computeGrids();

  // Playback timer interval
  useEffect(() => {
    let timer;
    if (isPlaying && currentTurnIndex < maxTurns) {
      timer = setTimeout(() => {
        setCurrentTurnIndex(prev => prev + 1);
      }, speedMs);
    } else if (isPlaying && currentTurnIndex >= maxTurns) {
      setIsPlaying(false); // Stop when fully finished
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentTurnIndex, maxTurns, speedMs]);

  const handleSpeedChange = (e) => {
     const val = parseInt(e.target.value, 10);
     setSpeedMs(2000 - val); 
  };

  // Cell Renderer (Responsive size)
  const renderCell = (cell, r, c) => {
    let bgClass = 'bg-blue-900/40 border-blue-800/30'; // Default water
    if (cell.state === 'hit') bgClass = 'bg-red-500/80 border-red-500/50';
    else if (cell.state === 'miss') bgClass = 'bg-gray-500/50 border-gray-500/40';
    else if (cell.ship) bgClass = 'bg-green-500/70 border-green-500/50'; // Friendly/Visible ships

    return (
      <div 
        key={`${r}-${c}`} 
        className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 border flex-shrink-0 flex items-center justify-center text-[10px] sm:text-xs lg:text-sm font-bold transition-colors ${bgClass}`}
      >
        {cell.state === 'hit' && '💥'}
        {cell.state === 'miss' && <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-gray-300 rounded-full" />}
      </div>
    );
  };

  const renderGridContainer = (gridData, title, icon) => {
    const labels = Array(boardSize).fill(0).map((_, i) => String.fromCharCode(65 + i));
    return (
      <div className="flex-1 min-w-0 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex flex-col p-3 lg:p-6 pb-6 shadow-md overflow-hidden w-full">
        <h3 className="text-white font-bold text-lg lg:text-xl mb-4 lg:mb-6 flex items-center justify-center gap-3">
          {icon}
          {title}
        </h3>
        
        {/* We center the scroll container itself by max-w-max mx-auto, so the inner content is always left-aligned to its scroll bounds, thus preventing left-crop on overflow while remaining centered! */}
        <div className="w-full max-w-max mx-auto overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
           <div className="flex flex-col min-w-max px-2 lg:px-4">
             {/* Column Headers */}
             <div className="flex mb-1">
               {/* Empty corner block matching row-header width */}
               <div className="w-6 sm:w-7 md:w-8 lg:w-9 xl:w-10 flex-shrink-0" />
               {labels.map(l => (
                 <div key={l} className="w-6 sm:w-7 md:w-8 lg:w-9 xl:w-10 flex-shrink-0 flex items-center justify-center text-[9px] sm:text-[10px] lg:text-sm font-bold text-blue-300">
                   {l}
                 </div>
               ))}
             </div>
             
             {/* Rows */}
             {gridData.map((row, r) => (
               <div key={r} className="flex">
                 {/* Row Header */}
                 <div className="w-6 sm:w-7 md:w-8 lg:w-9 xl:w-10 h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 flex-shrink-0 flex items-center justify-center text-[9px] sm:text-[10px] lg:text-sm font-bold text-blue-300 pr-1 lg:pr-2">
                   {r + 1}
                 </div>
                 {row.map((cell, c) => renderCell(cell, r, c))}
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

  if (!replayData) return null;

  return (
    // Replay Modal takes full viewport (100vw, 100vh). Scrollable if data exceeds screen space.
    <div className="fixed inset-0 z-[100] bg-[#0f1522] flex flex-col overflow-y-auto overflow-x-hidden w-screen h-screen">
      
      {/* Container wraps around content and fills screen naturally */}
      <div className="relative w-full min-h-full flex flex-col">
        
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between px-6 py-5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
              <Trophy className={`w-8 h-8 ${isVictory ? 'text-yellow-400' : 'text-red-500'}`} />
              Replay: Match #{replayData?.matchId}
            </h2>
            <p className={`text-sm lg:text-base font-bold mt-1 tracking-wide ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
              Result: {isVictory ? 'VICTORY' : 'LOSS'} 
              <span className="text-slate-500 ml-2 font-normal">({replayData?.endReason || 'Ended'})</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
            title="Thoát (Close Replay)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Playback Control Bar */}
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8 px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex-shrink-0">
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button onClick={() => setCurrentTurnIndex(0)} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-all shadow-md">
                <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={togglePlay} className="p-3 w-16 flex justify-center bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black transition-all shadow-lg shadow-blue-600/20">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
          </div>
          
          <div className="flex-1 flex items-center gap-4 w-full">
            <span className="text-slate-300 font-mono font-bold text-sm lg:text-base min-w-[110px]">
              Turn: {currentTurnIndex} / {totalTurns}
            </span>
            <input 
              type="range" 
              min="0" 
              max={maxTurns} 
              value={currentTurnIndex} 
              onChange={(e) => { 
                  setCurrentTurnIndex(parseInt(e.target.value, 10)); 
                  setIsPlaying(false); 
              }}
              className="flex-1 accent-blue-500 h-2 bg-slate-900 rounded-full appearance-none cursor-pointer outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto lg:justify-end">
            <FastForward className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300 font-bold hidden sm:inline">Speed</span>
            <input 
              type="range" 
              min="100" max="1900" step="100" 
              value={2000 - speedMs} 
              onChange={handleSpeedChange}
              className="w-full lg:w-32 accent-purple-500 h-2 bg-slate-900 rounded-full appearance-none cursor-pointer outline-none"
            />
          </div>
        </div>

        {/* Grids Area */}
        {/* No flex-wrap constraints so it flows perfectly on full 100vw width */}
        <div className="px-2 sm:px-4 lg:px-8 xl:px-12 bg-[#0a0f1d] py-6 flex flex-col xl:flex-row gap-4 lg:gap-8 justify-center items-start border-t border-slate-700 flex-1 w-full flex-grow">
          
          {/* Left: User Grid */}
          {renderGridContainer(uGrid, userName || 'You', <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400" />)}
          
          {/* Right: Enemy Grid */}
          {renderGridContainer(eGrid, enemyName || 'Enemy', <Target className="w-6 h-6 lg:w-8 lg:h-8 text-red-500" />)}
          
        </div>

      </div>
    </div>
  );
}
