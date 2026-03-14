import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, TrendingUp, Trophy, Target, AlertCircle, User, X, Loader2, Swords, ChevronRight, Flame, Clock } from 'lucide-react';
import './UserDetail.css';
import { getUserById, updateUserStatus, updateUserRole, getRoles, getUserPlayers } from '../../../api/userApi';
import { getPlayerProfile } from '../../../api/playerApi';

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Players list
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [playersError, setPlayersError] = useState(null);

  // Selected player detail modal
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [loadingPlayerDetail, setLoadingPlayerDetail] = useState(false);

  const fetchUserDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserById(id);
      const totalGames = (data.wins || 0) + (data.losses || 0);
      const winRate = totalGames > 0 ? (data.wins || 0) / totalGames : 0;
      setUser({ ...data, totalGames, winRate });
      setError(null);
    } catch (err) {
      setError('Failed to load user details');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await getRoles();
      let rolesData = [];
      if (Array.isArray(response)) rolesData = response;
      else if (response?.data && Array.isArray(response.data)) rolesData = response.data;
      else if (response?.roles && Array.isArray(response.roles)) rolesData = response.roles;

      const roleNames = rolesData.map(role => {
        if (typeof role === 'string') return role;
        return role?.roleName || role?.name || role?.role || String(role);
      });
      setRoles(roleNames.length > 0 ? roleNames : ['Player', 'Admin', 'SuperAdmin']);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setRoles(['Player', 'Admin', 'SuperAdmin']);
    }
  }, []);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoadingPlayers(true);
      setPlayersError(null);
      const response = await getUserPlayers(id);
      let playersData = [];
      if (Array.isArray(response)) playersData = response;
      else if (response?.data && Array.isArray(response.data)) playersData = response.data;
      setPlayers(playersData);
    } catch (err) {
      console.error('Error fetching players:', err);
      setPlayersError('Không thể tải danh sách nhân vật.');
    } finally {
      setLoadingPlayers(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchUserDetail();
      fetchRoles();
      fetchPlayers();
    }
  }, [id, fetchUserDetail, fetchRoles, fetchPlayers]);

  const handleViewPlayerDetail = async (player) => {
    setShowPlayerModal(true);
    setSelectedPlayer(null);
    setLoadingPlayerDetail(true);
    try {
      const playerId = player.playerId || player.id;
      const response = await getPlayerProfile(playerId);
      let playerData = response;
      if (response?.data) playerData = response.data;
      setSelectedPlayer(playerData);
    } catch (err) {
      console.error('Error fetching player detail:', err);
      // Fallback to basic player info
      setSelectedPlayer(player);
    } finally {
      setLoadingPlayerDetail(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      setUpdatingStatus(true);
      const newStatus = !user.isActive;
      await updateUserStatus(id, newStatus);
      setUser(prev => ({ ...prev, isActive: newStatus }));
      setSuccess(`User ${newStatus ? 'unbanned' : 'banned'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update user status');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!user || newRole === user.role) return;
    try {
      setUpdatingRole(true);
      await updateUserRole(id, newRole);
      setUser(prev => ({ ...prev, role: newRole }));
      setSuccess('User role updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update user role');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingRole(false);
    }
  };

  const getUserInitials = (username) => {
    if (!username) return 'U';
    const parts = username.split('_');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return username.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail-page">
        <div className="error-state">
          <AlertCircle size={48} />
          <h2>User Not Found</h2>
          <p>The user you&apos;re looking for doesn&apos;t exist.</p>
          <button className="btn-primary" onClick={() => navigate('/users')}>
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-detail-page">
      {/* Page Header */}
      <div className="page-header-detail">
        <button className="btn-back" onClick={() => navigate('/users')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>User Details</h1>
          <p className="page-subtitle">Manage user information and permissions</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Main Layout */}
      <div className="user-detail-layout">
        {/* Left Column */}
        <div className="user-detail-left">
          {/* Profile Information Card */}
          <div className="profile-card">
            <h3 className="card-title">Profile Information</h3>
            <div className="profile-header">
              <div className="profile-avatar-large">{getUserInitials(user.username)}</div>
              <div className="profile-info">
                <h2 className="profile-name">{user.username}</h2>
                <p className="profile-email">{user.email}</p>
              </div>
            </div>
            <div className="profile-details">
              <div className="profile-detail-row">
                <span className="detail-label">User ID</span>
                <span className="detail-value">#{user.userId || id}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
                    : 'N/A'}
                </span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge-detail ${user.isActive ? 'status-active' : 'status-banned'}`}>
                  {user.isActive ? 'Active' : 'Banned'}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Controls Card */}
          <div className="admin-controls-card">
            <h3 className="card-title card-title-danger">Admin Controls</h3>
            <p className="card-subtitle">Manage user status and permissions</p>
            <div className="admin-control-section">
              <div className="control-header">
                <div>
                  <h4 className="control-title">Account Status</h4>
                  <p className="control-description">Toggle to ban/unban user</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={user.isActive} onChange={handleToggleStatus} disabled={updatingStatus} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div className="admin-control-section">
              <div className="control-header">
                <div>
                  <h4 className="control-title">User Role</h4>
                  <p className="control-description">Select user role</p>
                </div>
              </div>
              <select
                className="role-select"
                value={user.role || 'Player'}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={updatingRole}
              >
                {roles.map((role, index) => (
                  <option key={index} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="user-detail-right">
          {/* Players List Card */}
          <div className="players-list-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Nhân vật (Players)</h3>
                <p className="card-subtitle">Danh sách nhân vật của người dùng này</p>
              </div>
              <span className="players-count-badge">{players.length} nhân vật</span>
            </div>

            {loadingPlayers ? (
              <div className="players-loading">
                <Loader2 size={24} className="spin-icon" />
                <p>Đang tải danh sách nhân vật...</p>
              </div>
            ) : playersError ? (
              <div className="players-error">
                <AlertCircle size={20} />
                <span>{playersError}</span>
              </div>
            ) : players.length === 0 ? (
              <div className="players-empty">
                <User size={36} strokeWidth={1.5} />
                <p>Người dùng này chưa có nhân vật nào</p>
              </div>
            ) : (
              <div className="players-grid">
                {players.map((player, index) => {
                  const playerId = player.playerId;
                  const displayName = player.displayName;
                  const elo = player.currentElo;

                  return (
                    <button
                      key={playerId}
                      className="player-card-btn"
                      onClick={() => handleViewPlayerDetail(player)}
                    >
                      <div className="player-card-avatar">
                        {displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="player-card-info">
                        <span className="player-card-name">{displayName}</span>
                        <span className="player-card-elo">⭐ {elo} ELO</span>
                        <span className="player-card-elo">{player.serverName}</span>
                      </div>
                      <ChevronRight size={16} className="player-card-arrow" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player Detail Modal */}
      {showPlayerModal && (
        <div className="modal-overlay" onClick={() => setShowPlayerModal(false)}>
          <div className="modal-content player-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <User size={22} className="modal-title-icon" />
                <h2>Chi tiết Nhân vật</h2>
              </div>
              <button className="modal-close" onClick={() => setShowPlayerModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {loadingPlayerDetail ? (
                <div className="player-modal-loading">
                  <Loader2 size={32} className="spin-icon" />
                  <p>Đang tải thông tin nhân vật...</p>
                </div>
              ) : selectedPlayer ? (
                <div className="player-modal-content">
                  {/* Player Header */}
                  <div className="player-modal-header">
                    <div className="player-modal-avatar">
                      {(selectedPlayer.displayName || 'P').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="player-modal-name">{selectedPlayer.displayName}</h3>
                      <p className="player-modal-id">ID: #{selectedPlayer.playerId}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="player-stats-section">
                    <h4 className="player-section-title">
                      <Star size={16} /> Thống kê
                    </h4>
                    <div className="player-stats-modal-grid">
                      <div className="player-stat-box">
                        <Star size={18} className="pstat-icon elo" />
                        <span className="pstat-label">ELO</span>
                        <span className="pstat-value">{selectedPlayer.elo}</span>
                      </div>
                      <div className="player-stat-box">
                        <Trophy size={18} className="pstat-icon wins" />
                        <span className="pstat-label">Thắng</span>
                        <span className="pstat-value">{selectedPlayer.totalWins}</span>
                      </div>
                      <div className="player-stat-box">
                        <Swords size={18} className="pstat-icon losses" />
                        <span className="pstat-label">Thua</span>
                        <span className="pstat-value">{selectedPlayer.totalLosses}</span>
                      </div>
                      <div className="player-stat-box">
                        <Target size={18} className="pstat-icon winrate" />
                        <span className="pstat-label">Win Rate</span>
                        <span className="pstat-value">
                          {selectedPlayer.winRate}
                        </span>
                      </div>
                      {selectedPlayer.currentStreak !== undefined && selectedPlayer.currentStreak !== null && (
                        <div className="player-stat-box">
                          <Flame
                            size={18}
                            className={`pstat-icon streak ${selectedPlayer.currentStreak < 0 ? 'flame-blue' : 'flame-red'}`}
                          />
                          <span className="pstat-label"> Current Streak</span>
                          <span className="pstat-value">{Math.abs(selectedPlayer.currentStreak)}</span>
                        </div>
                      )}
                      {selectedPlayer.totalMatches != null && (
                        <div className="player-stat-box">
                          <Swords size={18} className="pstat-icon total" />
                          <span className="pstat-label">Total Matches</span>
                          <span className="pstat-value">{selectedPlayer.totalMatches}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Matches */}
                  {selectedPlayer.recentMatches && selectedPlayer.recentMatches.length > 0 && (
                    <div className="player-matches-section">
                      <h4 className="player-section-title">
                        <Swords size={16} /> 10 trận gần nhất
                      </h4>
                      <div className="player-match-list">
                        {selectedPlayer.recentMatches.map((match, idx) => {
                          const isWin = match.result === 'Win' || match.isWin || match.won;
                          const eloChange = match.eloChange || 0;
                          return (
                            <div key={match.matchId || match.id || idx} className="player-match-item">
                              <div className="player-match-main">
                                <div className="player-match-info">
                                  <span className="player-match-opponent">
                                    vs {match.opponentName || 'Unknown'}
                                  </span>
                                  <span className="player-match-date">
                                    {formatDate(match.timestamp || match.playedAt || match.date)}
                                  </span>
                                </div>
                                <div className="player-match-status">
                                  <span className={`player-match-result ${isWin ? 'win' : 'loss'}`}>
                                    {isWin ? 'Thắng' : 'Thua'}
                                  </span>
                                  <span className={`player-match-elo-change ${eloChange >= 0 ? 'plus' : 'minus'}`}>
                                    {eloChange >= 0 ? `+${eloChange}` : eloChange}
                                  </span>
                                </div>
                              </div>
                              <div className="player-match-footer">
                                <span className="player-match-duration">
                                  <Clock size={12} /> {match.duration}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPlayerModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetail;
