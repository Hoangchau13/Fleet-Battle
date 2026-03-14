import { useState, useEffect } from 'react';
import { getLiveMatches } from '../../../api';
import { Target, Users, Clock, Eye } from 'lucide-react';
import SpectateModal from './SpectateModal';
import './GamesManagement.css';

function GamesManagement() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spectateMatch, setSpectateMatch] = useState(null);

  useEffect(() => {
    fetchLiveMatches();
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchLiveMatches, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveMatches = async () => {
    try {
      setError(null);
      const response = await getLiveMatches();
      console.log('Live Matches Response:', response);

      let matchesData = [];
      if (Array.isArray(response)) {
        matchesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        matchesData = response.data;
      }

      setLiveMatches(matchesData);
    } catch (err) {
      console.error('Error fetching live matches:', err);
      setError('Unable to load live matches. Please try again.');
      setLiveMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (username) => {
    if (!username) return '??';
    const parts = username.split('_');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  const formatDuration = (duration) => {
    if (!duration) return 'Live';
    if (typeof duration === 'string') return duration;
    const minutes = Math.floor(duration / 60);
    const secs = duration % 60;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const handleSpectateMatch = (matchId) => {
    const match = liveMatches.find(m => m.matchId === matchId);
    setSpectateMatch(match || { matchId });
  };

  // Compute stats dynamically from live matches data
  const stats = {
    activeMatches: liveMatches.length,
    activePlayers: liveMatches.length * 2,
    avgTurns: liveMatches.length > 0
      ? Math.round(liveMatches.reduce((s, m) => s + (m.turnCount || 0), 0) / liveMatches.length)
      : 0
  };

  return (
    <div className="games-management-live">
      <div className="page-header-live">
        <div>
          <h1>Live Operations</h1>
          <p className="page-subtitle-live">Monitor active matches in real-time</p>
        </div>
      </div>



      {/* Error Alert */}
      {error && (
        <div className="alert-live alert-error-live">
          ⚠️ {error}
        </div>
      )}

      {/* Live Matches Grid */}
      {loading ? (
        <div className="loading-state-live">
          <div className="spinner-large-live"></div>
          <p>Loading live matches...</p>
        </div>
      ) : liveMatches.length === 0 ? (
        <div className="empty-state-live">
          <div className="empty-icon-live">🎮</div>
          <h3>No Active Matches</h3>
          <p>There are no live matches at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className="matches-grid-live">
          {liveMatches.map((match, index) => (
            <div key={match.matchId || index} className="match-card-live">
              {/* Status Badge */}
              <div className="match-header-live">
                <div className="status-badge-live-live playing">
                  <span className="status-dot-live"></span>
                  {match.status || 'Playing'}
                </div>
                <div className="match-duration-live">
                  <Clock size={14} />
                  {formatDuration(match.duration)}
                </div>
              </div>

              {/* Players Section */}
              <div className="match-players-live">
                {/* Player 1 */}
                <div className="player-info-live-live">
                  <div className="player-avatar-live">
                    {getInitials(match.player1Name)}
                  </div>
                  <div className="player-details-live-live">
                    <div className="player-name-live">
                      {match.player1Name || 'Player 1'}
                    </div>
                    {match.player1Elo != null && (
                      <div className="player-elo-live">⭐ {match.player1Elo} ELO</div>
                    )}
                  </div>
                </div>

                {/* VS Divider */}
                <div className="vs-divider-live">
                  <div>VS</div>
                  {match.turnCount != null && (
                    <div className="turn-count-live">Turn {match.turnCount}</div>
                  )}
                </div>

                {/* Player 2 */}
                <div className="player-info-live-live">
                  <div className="player-avatar-live player2">
                    {getInitials(match.player2Name)}
                  </div>
                  <div className="player-details-live-live">
                    <div className="player-name-live">
                      {match.player2Name || 'Player 2'}
                    </div>
                    {match.player2Elo != null && (
                      <div className="player-elo-live">⭐ {match.player2Elo} ELO</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Info */}
              <div className="match-footer-live">
                <div className="match-level-live">
                  <span className="level-label-live">Level</span>
                  <span className="level-name-live">{match.levelName || 'Standard Battle'}</span>
                </div>
                <button
                  className="btn-spectate-live"
                  onClick={() => handleSpectateMatch(match.matchId)}
                >
                  <Eye size={16} />
                  Spectate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spectate Modal */}
      {spectateMatch && (
        <SpectateModal
          match={spectateMatch}
          onClose={() => setSpectateMatch(null)}
        />
      )}
    </div>
  );
}

export default GamesManagement;