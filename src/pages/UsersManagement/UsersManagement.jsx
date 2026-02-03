import { useState, useEffect } from 'react';
import { getUsers, getUserById, updateUserRole, updateUserStatus, deleteUser, register, getRoles } from '../../api';
import './UsersManagement.css';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role: '',
    isActive: true
  });
  const [createFormData, setCreateFormData] = useState({
    username: '',
    password: '',
    email: ''
  });

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

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
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
      
      // Extract role names if roles are objects (e.g., {roleName: "Admin", description: "..."})
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
      setRoles(roleNames);
    } catch (err) {
      console.error('Error fetching roles:', err);
      // Fallback to default roles if API fails
      setRoles(['Admin', 'Player']);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleViewDetail = async (userId) => {
    console.log('View Detail - User ID:', userId);
    
    if (!userId) {
      setError('User ID không hợp lệ');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const userData = await getUserById(userId);
      console.log('User Detail Response:', userData);
      
      // Handle different response formats
      let userDetail = null;
      if (userData?.data) {
        userDetail = userData.data;
      } else if (userData) {
        userDetail = userData;
      }
      
      setSelectedUser(userDetail);
    } catch (err) {
      console.error('Error fetching user detail:', err);
      setError('Không thể tải thông tin user. Vui lòng thử lại.');
      setShowDetailModal(false);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role || 'Player',
      isActive: user.isActive ?? true
    });
    setShowEditModal(true);
    
    // Fetch roles when opening edit modal
    if (roles.length === 0) {
      await fetchRoles();
    }
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditFormData({
      role: '',
      isActive: true
    });
    // Clear error when closing modal
    setError(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      setLoadingUpdate(true);
      setError(null); // Clear any previous errors

      const userId = selectedUser.userId || selectedUser.id;
      let hasChanges = false;

      console.log('Updating user:', {
        userId,
        currentRole: selectedUser.role,
        newRole: editFormData.role,
        currentStatus: selectedUser.isActive,
        newStatus: editFormData.isActive
      });

      // Update role
      if (editFormData.role !== selectedUser.role) {
        console.log('Updating role to:', editFormData.role);
        await updateUserRole(userId, editFormData.role);
        hasChanges = true;
      }

      // Update status
      if (editFormData.isActive !== selectedUser.isActive) {
        console.log('Updating status to:', editFormData.isActive);
        await updateUserStatus(userId, editFormData.isActive);
        hasChanges = true;
      }

      if (!hasChanges) {
        setError('Không có thay đổi nào để cập nhật');
        return;
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        (u.userId || u.id) === userId 
          ? { ...u, role: editFormData.role, isActive: editFormData.isActive }
          : u
      ));

      setSuccess('Cập nhật user thành công! 🎉');
      setTimeout(() => setSuccess(null), 3000);
      handleCloseEdit();
      
      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      console.error('Error response:', err.response);
      // Keep the error in state to display in modal - do NOT close modal
      setError(err.response?.data?.message || err.message || 'Không thể cập nhật user. Vui lòng thử lại.');
      // Don't auto-clear error in modal, let user close it manually
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const userId = userToDelete.id || userToDelete.userId;
    if (!userId) {
      setError('User ID không hợp lệ');
      setTimeout(() => setError(null), 3000);
      setShowDeleteModal(false);
      return;
    }

    try {
      console.log('Deleting user with ID:', userId);
      await deleteUser(userId);
      
      // Cập nhật danh sách local
      setUsers(prev => prev.filter(u => (u.userId || u.id) !== userId));
      
      setSuccess(`Đã xóa user "${userToDelete.username}" thành công! ✓`);
      setTimeout(() => setSuccess(null), 3000);
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Refresh lại danh sách từ server
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || 'Không thể xóa user. Vui lòng kiểm tra quyền truy cập hoặc thử lại.');
      setTimeout(() => setError(null), 5000);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoadingCreate(true);
      setError(null);
      await register(createFormData);
      setSuccess('Tạo user mới thành công! 🎉');
      setTimeout(() => setSuccess(null), 3000);
      setShowCreateModal(false);
      setCreateFormData({ username: '', password: '', email: '' });
      await fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      // Keep error in modal, don't close modal
      setError(err.response?.data?.message || 'Không thể tạo user. Vui lòng thử lại.');
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>👥 Quản lý Users</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Tạo User Mới
        </button>
      </div>

      {/* Success and Error messages */}
      {success && (
        <div className="alert alert-success">
          ✓ {success}
        </div>
      )}
      
      {error && !showEditModal && !showCreateModal && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {/* Danh sách users */}
      <div className="users-section">
        <div className="section-header">
          <h2>Danh sách Users</h2>
          <span className="badge">{Array.isArray(users) ? users.length : 0} users</span>
        </div>

        {loading ? (
          <div className="loading">Đang tải danh sách users...</div>
        ) : !Array.isArray(users) || users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>Chưa có user nào</h3>
            <p>Danh sách users đang trống</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(users) && users.map((user, index) => (
                  <tr key={user.id || index}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="user-name">{user.username || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.fullName || 'N/A'}</td>
                    <td>
                      <span className={`role-badge role-${user.role?.toLowerCase() || 'user'}`}>
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('vi-VN') 
                        : 'N/A'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-view"
                          title="Xem chi tiết"
                          onClick={() => {
                            console.log('Clicking view for user:', user);
                            handleViewDetail(user.id || user.userId);
                          }}
                        >
                          👁️
                        </button>
                        <button 
                          className="btn-icon btn-edit"
                          title="Chỉnh sửa"
                          onClick={() => handleEditUser(user)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon btn-delete"
                          title="Xóa"
                          onClick={() => handleDeleteClick(user)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      {Array.isArray(users) && users.length > 0 && (
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Tổng Users</h3>
              <p className="stat-value">{users.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Active Users</h3>
              <p className="stat-value">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👑</div>
            <div className="stat-info">
              <h3>Admins</h3>
              <p className="stat-value">
                {users.filter(u => u.role?.toLowerCase() === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết User */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết User</h2>
              <button className="modal-close" onClick={handleCloseDetail}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {loadingDetail ? (
                <div className="modal-loading">
                  <div className="spinner-large"></div>
                  <p>Đang tải thông tin...</p>
                </div>
              ) : selectedUser ? (
                <div className="user-detail">
                  <div className="detail-avatar-section">
                    <div className="detail-avatar-large">
                      {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h3>{selectedUser.username || 'N/A'}</h3>
                    <div className="detail-badges">
                      <span className={`status-badge status-${selectedUser.isActive ? 'active' : 'inactive'}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`role-badge role-${selectedUser.role?.toLowerCase() || 'user'}`}>
                        {selectedUser.role || 'User'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>📋 Thông tin tài khoản</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">User ID:</span>
                        <span className="detail-value">{selectedUser.userId || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Username:</span>
                        <span className="detail-value">{selectedUser.username || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedUser.email || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Display Name:</span>
                        <span className="detail-value">{selectedUser.displayName || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Player ID:</span>
                        <span className="detail-value">{selectedUser.playerId || 'Chưa tạo'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created At:</span>
                        <span className="detail-value">
                          {selectedUser.createdAt 
                            ? new Date(selectedUser.createdAt).toLocaleString('vi-VN')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>🎮 Thống kê Game</h4>
                    <div className="stats-row">
                      <div className="stat-box">
                        <div className="stat-box-icon">🏆</div>
                        <div className="stat-box-content">
                          <div className="stat-box-label">Current ELO</div>
                          <div className="stat-box-value">{selectedUser.currentElo || 0}</div>
                        </div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-box-icon">⭐</div>
                        <div className="stat-box-content">
                          <div className="stat-box-label">EXP Points</div>
                          <div className="stat-box-value">{selectedUser.expPoints || 0}</div>
                        </div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-box-icon">🎯</div>
                        <div className="stat-box-content">
                          <div className="stat-box-label">Total Games</div>
                          <div className="stat-box-value">{selectedUser.totalGames || 0}</div>
                        </div>
                      </div>
                    </div>

                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Wins:</span>
                        <span className="detail-value success">{selectedUser.wins || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Losses:</span>
                        <span className="detail-value danger">{selectedUser.losses || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Win Rate:</span>
                        <span className="detail-value primary">
                          {selectedUser.winRate 
                            ? `${(selectedUser.winRate * 100).toFixed(1)}%` 
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="modal-error">
                  <p>Không thể tải thông tin user</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseDetail}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cập nhật User */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal-content modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cập nhật User</h2>
              <button className="modal-close" onClick={handleCloseEdit}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                {/* Error Alert in Modal */}
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                    ⚠️ {error}
                    <button 
                      className="alert-close"
                      onClick={() => setError(null)}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="edit-user-info">
                  <div className="edit-user-avatar">
                    {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="edit-user-details">
                    <h3>{selectedUser.username}</h3>
                    <p>{selectedUser.email}</p>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="role">
                      <span className="label-icon">👑</span>
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={editFormData.role}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                      disabled={loadingUpdate || loadingRoles}
                      required
                    >
                      {loadingRoles ? (
                        <option value="">Đang tải roles...</option>
                      ) : roles.length > 0 ? (
                        roles.map((role, index) => (
                          <option key={index} value={role}>
                            {role}
                          </option>
                        ))
                      ) : (
                        <option value="">Không có roles</option>
                      )}
                    </select>
                    <p className="form-hint">
                      Chọn vai trò cho user trong hệ thống
                      {loadingRoles && ' (Đang tải danh sách roles...)'}
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">
                      <span className="label-icon">🔒</span>
                      Trạng thái tài khoản
                    </label>
                    <div className="toggle-group">
                      <label className="toggle-option">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.isActive === true}
                          onChange={() => setEditFormData(prev => ({ ...prev, isActive: true }))}
                          disabled={loadingUpdate}
                        />
                        <span className="toggle-label active">
                          <span className="toggle-icon">✅</span>
                          Hoạt động (Mở khóa)
                        </span>
                      </label>
                      <label className="toggle-option">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.isActive === false}
                          onChange={() => setEditFormData(prev => ({ ...prev, isActive: false }))}
                          disabled={loadingUpdate}
                        />
                        <span className="toggle-label inactive">
                          <span className="toggle-icon">🔒</span>
                          Khóa (Không hoạt động)
                        </span>
                      </label>
                    </div>
                    <p className="form-hint">
                      {editFormData.isActive 
                        ? 'User có thể đăng nhập và sử dụng hệ thống' 
                        : 'User sẽ bị khóa và không thể đăng nhập'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCloseEdit}
                  disabled={loadingUpdate}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingUpdate || (editFormData.role === selectedUser.role && editFormData.isActive === selectedUser.isActive)}
                >
                  {loadingUpdate ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-danger">
              <div className="modal-icon-danger">⚠️</div>
              <h2>Xác Nhận Xóa User</h2>
              <button className="modal-close" onClick={handleCancelDelete}>✕</button>
            </div>

            <div className="modal-body">
              <div className="confirm-message">
                <p className="confirm-text">
                  Bạn có chắc chắn muốn xóa user <strong>"{userToDelete.username}"</strong> không?
                </p>
                <div className="user-info-box">
                  <div className="info-row">
                    <span className="info-label">📧 Email:</span>
                    <span className="info-value">{userToDelete.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">👤 Role:</span>
                    <span className="info-value">{userToDelete.role}</span>
                  </div>
                </div>
                <div className="warning-box">
                  <strong>⚠️ Lưu ý:</strong>
                  <ul>
                    <li>Thao tác này không thể hoàn tác</li>
                    <li>Tất cả dữ liệu liên quan đến user sẽ bị xóa</li>
                    <li>Cần quyền SuperAdmin để xóa Admin</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCancelDelete}
              >
                ❌ Hủy
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={handleConfirmDelete}
              >
                🗑️ Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo User Mới */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setError(null); // Clear error when closing
        }}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Tạo User Mới</h2>
              <button className="modal-close" onClick={() => {
                setShowCreateModal(false);
                setError(null); // Clear error when closing
              }}>✕</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                {/* Error Alert in Create Modal */}
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                    ⚠️ {error}
                    <button 
                      className="alert-close"
                      onClick={() => setError(null)}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="username">
                      <span className="label-icon">👤</span>
                      Username
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={createFormData.username}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Nhập username"
                      required
                      disabled={loadingCreate}
                    />
                    <p className="form-hint">Username để đăng nhập vào hệ thống</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">
                      <span className="label-icon">🔒</span>
                      Password
                      <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Nhập password"
                      required
                      minLength="6"
                      disabled={loadingCreate}
                    />
                    <p className="form-hint">Mật khẩu tối thiểu 6 ký tự</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      <span className="label-icon">📧</span>
                      Email
                      <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Nhập email"
                      required
                      disabled={loadingCreate}
                    />
                    <p className="form-hint">Email liên hệ của user</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={loadingCreate}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingCreate || !createFormData.username || !createFormData.password || !createFormData.email}
                >
                  {loadingCreate ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagement;
