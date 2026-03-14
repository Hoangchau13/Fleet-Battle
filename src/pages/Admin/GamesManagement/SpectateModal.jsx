import { X, Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { useSpectatorHub } from '../../../hooks/useSpectatorHub';
import './SpectateModal.css';

// Renders a single 10x10 game board
function GameBoard({ boardData, label }) {
  if (!boardData) {
    return (
      <div className="spectate-board-wrapper">
        <div className="spectate-board-label">{label}</div>
        <div className="spectate-board-placeholder">
          <Loader2 size={20} className="spin-icon" />
          <span>Chờ dữ liệu...</span>
        </div>
      </div>
    );
  }

  const grid = boardData.grid || [];
  // Build a 10x10 matrix from a flat grid array or 2D array
  const SIZE = 10;
  const cells = [];

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      // grid can be 2D array or flat; try both
      let cellValue = null;
      if (Array.isArray(grid[row])) {
        cellValue = grid[row][col];
      } else {
        const flat = grid.find(c => c.x === col && c.y === row);
        cellValue = flat?.state ?? flat?.status ?? flat?.value ?? null;
      }

      let cellClass = 'spec-cell empty';
      let cellContent = null;

      if (cellValue === 'Hit' || cellValue === 1) {
        cellClass = 'spec-cell hit';
        cellContent = '✕';
      } else if (cellValue === 'Miss' || cellValue === 2) {
        cellClass = 'spec-cell miss';
        cellContent = '·';
      } else if (cellValue === 'Ship' || cellValue === 3) {
        cellClass = 'spec-cell ship';
      }

      cells.push(
        <div key={`${row}-${col}`} className={cellClass}>
          {cellContent}
        </div>
      );
    }
  }

  return (
    <div className="spectate-board-wrapper">
      <div className="spectate-board-label">
        <div className="board-player-name">{boardData.displayName || label}</div>
        <div className="board-ships-remaining">
          {boardData.remainingShips != null ? `🚢 ${boardData.remainingShips} tàu còn lại` : ''}
        </div>
      </div>
      <div className="spectate-board-grid">
        {/* Column headers */}
        <div className="spec-grid-corner"></div>
        {Array.from({ length: SIZE }, (_, i) => (
          <div key={`col-${i}`} className="spec-grid-header">{i + 1}</div>
        ))}
        {/* Rows */}
        {Array.from({ length: SIZE }, (_, row) => (
          <>
            <div key={`row-label-${row}`} className="spec-grid-row-label">
              {String.fromCharCode(65 + row)}
            </div>
            {cells.slice(row * SIZE, row * SIZE + SIZE)}
          </>
        ))}
      </div>
    </div>
  );
}

export default function SpectateModal({ match, onClose }) {
  const matchId = match?.matchId;
  const { gameState, isConnected, connectionError } = useSpectatorHub(matchId, true);

  const currentTurnName = gameState
    ? (gameState.turnPlayerId === gameState.myBoard?.playerId
        ? gameState.myBoard?.displayName
        : gameState.opponentBoard?.displayName) ?? 'Unknown'
    : null;

  return (
    <div className="spectate-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="spectate-modal">
        {/* Header */}
        <div className="spectate-header">
          <div className="spectate-title-section">
            <h2 className="spectate-title">
              🎮 {match?.player1Name ?? 'Player 1'} <span className="spectate-vs">vs</span> {match?.player2Name ?? 'Player 2'}
            </h2>
            <p className="spectate-subtitle">Level: {match?.levelName ?? 'N/A'} &nbsp;·&nbsp; Match #{matchId}</p>
          </div>
          <div className="spectate-header-right">
            {/* Connection status badge */}
            {connectionError ? (
              <div className="spectate-badge error">
                <WifiOff size={14} /> Error
              </div>
            ) : isConnected ? (
              <div className="spectate-badge live">
                <span className="live-dot" /> LIVE
              </div>
            ) : (
              <div className="spectate-badge connecting">
                <Loader2 size={14} className="spin-icon" /> Connecting...
              </div>
            )}
            <button className="spectate-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {connectionError && (
          <div className="spectate-error-bar">
            <AlertCircle size={16} />
            {connectionError}
          </div>
        )}

        {/* Turn Indicator */}
        {gameState && currentTurnName && (
          <div className="spectate-turn-banner">
            ⚡ Lượt của: <strong>{currentTurnName}</strong>
            <span className="spectate-turn-count">Turn #{gameState.turnCount}</span>
          </div>
        )}

        {/* Boards */}
        <div className="spectate-boards-container">
          {!isConnected && !connectionError && (
            <div className="spectate-loading-overlay">
              <Loader2 size={36} className="spin-icon" />
              <p>Đang kết nối tới trận đấu...</p>
            </div>
          )}

          <GameBoard
            boardData={gameState?.myBoard}
            label={match?.player1Name ?? 'Player 1'}
          />

          <div className="spectate-boards-divider">
            <div className="spectate-boards-vs">VS</div>
          </div>

          <GameBoard
            boardData={gameState?.opponentBoard}
            label={match?.player2Name ?? 'Player 2'}
          />
        </div>

        {/* Footer */}
        <div className="spectate-footer">
          <div className="spectate-legend">
            <span className="legend-item"><span className="spec-cell hit">✕</span> Hit</span>
            <span className="legend-item"><span className="spec-cell miss">·</span> Miss</span>
            <span className="legend-item"><span className="spec-cell empty"></span> Empty</span>
          </div>
          <button className="spectate-leave-btn" onClick={onClose}>
            <WifiOff size={14} /> Rời phòng xem
          </button>
        </div>
      </div>
    </div>
  );
}
