import { useState, useEffect } from 'react';
import { getLiveMatches } from '../../api';
import { Target, Users, Clock, Eye } from 'lucide-react';
import './GamesManagement.css';

function GamesManagement() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const handleSpectateMatch = (matchId) => {
    console.log('Spectate match:', matchId);
    // TODO: Implement spectate functionality
  };

  // Hardcoded stats as requested
  const stats = {
    activeMatches: 4,
    activePlayers: 8,
    avgMatchTime: 22
  };

  return (
    <div className="games-management-live">
      <div className="page-header-live">
        <div>
          <h1>Live Operations</h1>
          <p className="page-subtitle-live">Monitor active matches in real-time</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-live">
        <div className="stat-card-live">
          <div className="stat-header-live">
            <div className="stat-label-live">Active Matches</div>
            <div className="stat-icon-wrapper-target-live">
              <Target size={24} />
            </div>
          </div>
          <div className="stat-content-live">
            <div className="stat-value-live">{stats.activeMatches}</div>
            <div className="stat-sublabel-live">Currently playing</div>
          </div>
        </div>

        <div className="stat-card-live">
          <div className="stat-header-live">
            <div className="stat-label-live">Active Players</div>
            <div className="stat-icon-wrapper-users-live">
              <Users size={24} />
            </div>
          </div>
          <div className="stat-content-live">
            <div className="stat-value-live">{stats.activePlayers}</div>
            <div className="stat-sublabel-live">In-game right now</div>
          </div>
        </div>

        <div className="stat-card-live">
          <div className="stat-header-live">
            <div className="stat-label-live">Avg. Match Time</div>
            <div className="stat-icon-wrapper-clock-live">
              <Clock size={24} />
            </div>
          </div>
          <div className="stat-content-live">
            <div className="stat-value-live">{stats.avgMatchTime} min</div>
            <div className="stat-sublabel-live">Average duration</div>
          </div>
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
                  Playing
                </div>
                <div className="match-duration-live">
                  <Clock size={14} />
                  {formatDuration(match.duration || match.elapsedTime)}
                </div>
              </div>

              {/* Players Section */}
              <div className="match-players-live">
                {/* Player 1 */}
                <div className="player-info-live-live">
                  <div className="player-avatar-live">
                    {getInitials(match.player1Username || match.player1?.username)}
                  </div>
                  <div className="player-details-live-live">
                    <div className="player-name-live">
                      {match.player1Username || match.player1?.username || 'Player 1'}
                    </div>
                    {match.currentTurn === 1 && (
                      <div className="current-turn-badge-live">Current turn</div>
                    )}
                  </div>
                </div>

                {/* VS Divider */}
                <div className="vs-divider-live">VS</div>

                {/* Player 2 */}
                <div className="player-info-live-live">
                  <div className="player-avatar-live player2">
                    {getInitials(match.player2Username || match.player2?.username)}
                  </div>
                  <div className="player-details-live-live">
                    <div className="player-name-live">
                      {match.player2Username || match.player2?.username || 'Player 2'}
                    </div>
                    {match.currentTurn === 2 && (
                      <div className="current-turn-badge-live">Current turn</div>
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
                  Spectate Match
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GamesManagement;