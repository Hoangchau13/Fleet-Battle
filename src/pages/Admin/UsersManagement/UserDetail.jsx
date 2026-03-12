import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, TrendingUp, Trophy, Target, AlertCircle } from 'lucide-react';
import './UserDetail.css';
import { getUserById, updateUserStatus, updateUserRole, getRoles } from '../../../api/userApi';

/**
 * NOTE: Các API chưa có, đang hardcode data:
 * - GET /player/{id}/history - Lịch sử đấu (10 trận gần nhất)
 * - GET /player/{id} - Profile người chơi (Elo, Level, Wins/Losses, Win Rate)
 * 
 * Hiện tại đang lấy dữ liệu từ GET /admin/users/{id} 
 * và hardcode phần Match History
 */

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

  // Hardcoded match history - TODO: Replace with API call
  const [matchHistory] = useState([
    { id: 1, opponent: 'admiral_y', date: '2024-03-15 at 15:23', result: 'Win' },
    { id: 2, opponent: 'captain_z', date: '2024-03-14 at 18:45', result: 'Loss' },
    { id: 3, opponent: 'naval_b', date: '2024-03-14 at 12:10', result: 'Win' },
    { id: 4, opponent: 'fleet_c', date: '2024-03-13 at 20:15', result: 'Win' },
    { id: 5, opponent: 'sailor_a', date: '2024-03-13 at 14:30', result: 'Loss' },
    { id: 6, opponent: 'marine_d', date: '2024-03-12 at 16:20', result: 'Win' },
    { id: 7, opponent: 'pirate_x', date: '2024-03-12 at 11:45', result: 'Loss' },
    { id: 8, opponent: 'corsair_y', date: '2024-03-11 at 19:30', result: 'Win' },
    { id: 9, opponent: 'buccaneer_z', date: '2024-03-11 at 10:15', result: 'Win' },
    { id: 10, opponent: 'privateer_a', date: '2024-03-10 at 15:50', result: 'Loss' }
  ]);

  const fetchUserDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserById(id);
      
      // Calculate additional stats if not provided by API
      const totalGames = (data.wins || 0) + (data.losses || 0);
      const winRate = totalGames > 0 ? (data.wins || 0) / totalGames : 0;
      
      setUser({
        ...data,
        totalGames,
        winRate,
        // Default values if API doesn't provide
        currentElo: data.currentElo || 1850,
        currentLevel: data.currentLevel || 12,
        wins: data.wins || 145,
        losses: data.losses || 89
      });
      setError(null);
    } catch (error) {
      setError('Failed to load user details');
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await getRoles();
      console.log('Roles Response:', response);
      
      // Handle different response formats
      let rolesData = [];
      if (Array.isArray(response)) {
        rolesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rolesData = response.data;
      } else if (response?.roles && Array.isArray(response.roles)) {
        rolesData = response.roles;
      }
      
      // Extract role names if roles are objects
      const roleNames = rolesData.map(role => {
        if (typeof role === 'string') {
          return role;
        } else if (role?.roleName) {
          return role.roleName;
        } else if (role?.name) {
          return role.name;
        } else if (role?.role) {
          return role.role;
        }
        return String(role);
      });
      
      console.log('Processed Roles:', roleNames);
      setRoles(roleNames.length > 0 ? roleNames : ['Player', 'Admin', 'SuperAdmin']);
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to default roles if API fails
      setRoles(['Player', 'Admin', 'SuperAdmin']);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchUserDetail();
      fetchRoles();
    }
  }, [id, fetchUserDetail, fetchRoles]);

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      setUpdatingStatus(true);
      const newStatus = !user.isActive;
      await updateUserStatus(id, newStatus);
      
      setUser(prev => ({ ...prev, isActive: newStatus }));
      setSuccess(`User ${newStatus ? 'unbanned' : 'banned'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to update user status');
      setTimeout(() => setError(null), 3000);
      console.error('Error updating status:', error);
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
    } catch (error) {
      setError('Failed to update user role');
      setTimeout(() => setError(null), 3000);
      console.error('Error updating role:', error);
    } finally {
      setUpdatingRole(false);
    }
  };

  const getUserInitials = (username) => {
    if (!username) return 'U';
    const parts = username.split('_');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
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
          <p>The user you're looking for doesn't exist.</p>
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
      {success && (
        <div className="alert alert-success">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {/* Main Layout */}
      <div className="user-detail-layout">
        {/* Left Column */}
        <div className="user-detail-left">
          {/* Profile Information Card */}
          <div className="profile-card">
            <h3 className="card-title">Profile Information</h3>
            
            <div className="profile-header">
              <div className="profile-avatar-large">
                {getUserInitials(user.username)}
              </div>
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
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })
                    : '2024-01-15'}
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
                  <input
                    type="checkbox"
                    checked={user.isActive}
                    onChange={handleToggleStatus}
                    disabled={updatingStatus}
                  />
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
                  <option key={index} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="user-detail-right">
          {/* Game Statistics Card */}
          <div className="game-stats-card">
            <h3 className="card-title">Game Statistics</h3>
            <p className="card-subtitle">Player performance and achievements</p>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon-wrapper">
                  <Star size={20} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Elo Rating</p>
                  <p className="stat-value">{user.currentElo}</p>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon-wrapper">
                  <TrendingUp size={20} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Current Level</p>
                  <p className="stat-value">{user.currentLevel}</p>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon-wrapper">
                  <Trophy size={20} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Wins / Losses</p>
                  <p className="stat-value">{user.wins} / {user.losses}</p>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon-wrapper">
                  <Target size={20} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Win Rate</p>
                  <p className="stat-value">{Math.round(user.winRate * 100)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Match History Card */}
          <div className="match-history-card">
            <h3 className="card-title">Match History</h3>
            <p className="card-subtitle">Recent 10 matches</p>

            <div className="match-history-note">
              <AlertCircle size={16} />
              <span>Note: Match history is hardcoded. Implement GET /player/{id}/history API</span>
            </div>

            <div className="match-list">
              {matchHistory.map((match) => (
                <div key={match.id} className="match-item">
                  <div className="match-info">
                    <p className="match-opponent">vs {match.opponent}</p>
                    <p className="match-date">{match.date}</p>
                  </div>
                  <span className={`match-result ${match.result.toLowerCase()}`}>
                    {match.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetail;
