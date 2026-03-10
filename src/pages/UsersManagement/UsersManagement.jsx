import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '../../api';
import { Search, Eye } from 'lucide-react';
import './UsersManagement.css';

function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Lấy danh sách users khi component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUsers();
      console.log('API Response:', response);
      
      // Handle different response formats
      let usersData = [];
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response?.users && Array.isArray(response.users)) {
        usersData = response.users;
      } else {
        console.warn('Unexpected response format:', response);
        usersData = [];
      }
      
      setUsers(usersData);
    } catch (err) {
      setError('Không thể tải danh sách users. Vui lòng thử lại.');
      console.error('Error fetching users:', err);
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (userId) => {
    console.log('Navigate to User Detail - User ID:', userId);
    
    if (!userId) {
      setError('User ID không hợp lệ');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Navigate to user detail page
    navigate(`/users/${userId}`);
  };

  // Filter and pagination logic
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) : [];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Get user initials and background color
  const getUserInitials = (username) => {
    if (!username) return 'U';
    const parts = username.split('_');
    if (parts.length > 1) {
      return parts.map(p => p.charAt(0).toUpperCase()).join('');
    }
    return username.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = () => {
    return '#e0e7ff'; // Single primary color for all avatars
  };

  const getAvatarTextColor = () => {
    return '#2a219f'; // Consistent text color
  };

  return (
    <div className="users-management">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="page-subtitle">Manage players and administrators</p>
        </div>
      </div>

      {/* Error messages */}
      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {/* Search and Filter + Table */}
      <div className="content-card">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option>All Roles</option>
            <option>Player</option>
            <option>Admin</option>
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : !Array.isArray(users) || users.length === 0 ? (
          <div className="empty-state">
            <h3>No users found</h3>
            <p>User list is empty</p>
          </div>
        ) : (
          <>
            <div className="users-section">
              <div className="users-table-container">
                <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user, index) => {
                    const bgColor = getAvatarColor();
                    const textColor = getAvatarTextColor();
                    
                    return (
                      <tr key={user.id || index}>
                        <td>
                          <div className="user-cell">
                            <div 
                              className="user-avatar"
                              style={{ 
                                background: bgColor,
                                color: textColor
                              }}
                            >
                              {getUserInitials(user.username)}
                            </div>
                            <span className="user-name">{user.username || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="text-gray">{user.email || 'N/A'}</td>
                        <td>
                          <span className={`role-badge ${user.role === 'Admin' ? 'role-admin' : 'role-player'}`}>
                            {user.role || 'Player'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'status-active' : 'status-banned'}`}>
                            {user.isActive ? 'Active' : 'Banned'}
                          </span>
                        </td>
                        <td className="text-gray">
                          {user.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
                            : 'N/A'}
                        </td>
                        <td>
                          <button 
                            className="btn-icon-view"
                            title="View details"
                            onClick={() => handleViewDetail(user.id || user.userId)}
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
            </span>
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <button className="pagination-btn active">{currentPage}</button>
              <button 
                className="pagination-btn"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

export default UsersManagement;
