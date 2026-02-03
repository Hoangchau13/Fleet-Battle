import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../../components/StatCard'
import { getUsers, getAdminLevels, getShipTypes } from '../../api'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    totalLevels: 0,
    totalShipTypes: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [levels, setLevels] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch data từ các API
      const [usersData, levelsData, shipTypesData] = await Promise.all([
        getUsers().catch(() => []),
        getAdminLevels().catch(() => []),
        getShipTypes().catch(() => [])
      ])

      console.log('Raw levels data from API:', levelsData) // Debug log

      // Process users data
      const usersArray = Array.isArray(usersData) ? usersData : (usersData?.data || usersData?.users || [])
      const activeUsersCount = usersArray.filter(u => u.isActive).length
      const adminUsersCount = usersArray.filter(u => u.role === 'Admin' || u.role === 'Superadmin').length

      // Process levels data
      const levelsArray = Array.isArray(levelsData) ? levelsData : (levelsData?.data || levelsData?.levels || [])
      console.log('Processed levels array:', levelsArray) // Debug log

      // Process ship types data
      const shipTypesArray = Array.isArray(shipTypesData) ? shipTypesData : (shipTypesData?.data || [])

      setStats({
        totalUsers: usersArray.length,
        activeUsers: activeUsersCount,
        adminUsers: adminUsersCount,
        totalLevels: levelsArray.length,
        totalShipTypes: shipTypesArray.length
      })

      // Get 3 recent users (sorted by createdAt)
      const sortedUsers = [...usersArray]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
      setRecentUsers(sortedUsers)

      // Get first 3 levels from API
      const topLevels = levelsArray.slice(0, 3)
      console.log('Top 3 levels to display:', topLevels) // Debug log
      setLevels(topLevels)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  const statsCards = [
    { 
      title: 'Tổng Users', 
      value: loading ? '...' : stats.totalUsers.toString(), 
      completed: `${stats.activeUsers} đang hoạt động`, 
      icon: '👥' 
    },
    { 
      title: 'Admin Users', 
      value: loading ? '...' : stats.adminUsers.toString(), 
      completed: `${stats.totalUsers - stats.adminUsers} Players`, 
      icon: '👑' 
    },
    { 
      title: 'Tổng Levels', 
      value: loading ? '...' : stats.totalLevels.toString(), 
      completed: 'Độ khó khác nhau', 
      icon: '🎮' 
    },
    { 
      title: 'Loại Tàu', 
      value: loading ? '...' : stats.totalShipTypes.toString(), 
      completed: 'Ship Types', 
      icon: '⚓' 
    },
  ]

  return (
    <div className="dashboard-page">
      <div className="content-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Xin chào! Đây là tổng quan hệ thống Fleet Battle</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statsCards.map((stat, index) => (
          <StatCard 
            key={index}
            title={stat.title}
            value={stat.value}
            completed={stat.completed}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="dashboard-content-grid">
        {/* Recent Users */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>👥 Users Mới Nhất</h3>
            <button className="btn-link" onClick={() => navigate('/users')}>
              Xem tất cả →
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-state">Đang tải...</div>
            ) : recentUsers.length === 0 ? (
              <div className="empty-state">Chưa có user nào</div>
            ) : (
              <div className="users-list">
                {recentUsers.map((user, index) => (
                  <div key={user.userId || user.id || index} className="user-item" data-role={user.role}>
                    <div className="user-avatar">
                      {user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Superadmin' ? '👑' : '👤'}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.username}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-meta">
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Hoạt động' : 'Khóa'}
                      </span>
                      <span className="user-role">{user.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Levels Overview */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🎮 Game Levels</h3>
            <button className="btn-link" onClick={() => navigate('/levels')}>
              Xem tất cả →
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-state">Đang tải...</div>
            ) : levels.length === 0 ? (
              <div className="empty-state">Chưa có level nào</div>
            ) : (
              <div className="levels-list">
                {levels.map((level, index) => (
                  <div key={level.levelId || level.id || index} className="level-item">
                    <div className="level-info">
                      <div className="level-name">{level.levelName || level.name || `Level ${level.levelId}`}</div>
                      <div className="level-details">
                        Board: {level.boardSize || level.gridSize || 'N/A'} × {level.boardSize || level.gridSize || 'N/A'}
                        {' • '}
                        Time: {level.timeLimit || 'N/A'}s
                      </div>
                    </div>
                    <div className="level-ships">
                      {level.ships?.length || 0} tàu
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card quick-actions-card">
          <div className="card-header">
            <h3>⚡ Thao Tác Nhanh</h3>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              <button 
                className="action-button"
                onClick={() => navigate('/users')}
              >
                <span className="action-icon">👥</span>
                <span className="action-label">Quản lý Users</span>
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/levels')}
              >
                <span className="action-icon">🎮</span>
                <span className="action-label">Quản lý Levels</span>
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/ships')}
              >
                <span className="action-icon">⚓</span>
                <span className="action-label">Quản lý Ships</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
