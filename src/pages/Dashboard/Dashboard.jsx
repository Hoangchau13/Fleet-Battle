import { useState, useEffect } from 'react'
import { Users, Activity, Trophy, Gamepad2 } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { getUsers, getAdminLevels } from '../../api'
import './Dashboard.css'

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    userGrowth: 0,
    activeMatches: 0,
    matchesChange: 0,
    totalMatches: 0,
    matchesToday: 0,
    totalLevels: 0,
    levelsUpdated: 0
  })
  const [recentMatches, setRecentMatches] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch data từ các API
      const [usersData, levelsData] = await Promise.all([
        getUsers().catch(() => []),
        getAdminLevels().catch(() => [])
      ])

      // Process users data
      const usersArray = Array.isArray(usersData) ? usersData : (usersData?.data || usersData?.users || [])
      
      // Process levels data
      const levelsArray = Array.isArray(levelsData) ? levelsData : (levelsData?.data || levelsData?.levels || [])

      // Tính toán stats (dữ liệu mẫu cho matches)
      const totalUsers = usersArray.length
      const userGrowth = totalUsers > 0 ? ((Math.random() * 5 + 10).toFixed(1)) : 0 // Mock growth percentage
      
      setStats({
        totalUsers: totalUsers,
        userGrowth: userGrowth,
        activeMatches: Math.floor(Math.random() * 20 + 30), // Mock data: 30-50
        matchesChange: Math.floor(Math.random() * 10 + 5), // Mock data: 5-15
        totalMatches: Math.floor(totalUsers * 7), // Giả định mỗi user ~ 7 trận
        matchesToday: Math.floor(Math.random() * 100 + 100), // Mock data: 100-200
        totalLevels: levelsArray.length,
        levelsUpdated: Math.min(3, levelsArray.length)
      })

      // Mock recent matches data
      const mockMatches = [
        {
          id: 1,
          player1: 'Commander_X',
          player2: 'Admiral_Y',
          level: 5,
          timeAgo: '15 min ago',
          status: 'Playing'
        },
        {
          id: 2,
          player1: 'Captain_Z',
          player2: 'Sailor_A',
          level: 3,
          timeAgo: '23 min ago',
          status: 'Completed'
        },
        {
          id: 3,
          player1: 'Naval_B',
          player2: 'Fleet_C',
          level: 8,
          timeAgo: '1 hour ago',
          status: 'Playing'
        },
        {
          id: 4,
          player1: 'SeaWolf_D',
          player2: 'Ocean_E',
          level: 2,
          timeAgo: '2 hours ago',
          status: 'Completed'
        }
      ]
      setRecentMatches(mockMatches)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { 
      title: 'Total Users', 
      value: loading ? '...' : stats.totalUsers.toLocaleString(), 
      completed: `+${stats.userGrowth}%`, 
      icon: Users
    },
    { 
      title: 'Active Matches', 
      value: loading ? '...' : stats.activeMatches.toString(), 
      completed: `+${stats.matchesChange} from yesterday`, 
      icon: Activity
    },
    { 
      title: 'Total Matches', 
      value: loading ? '...' : stats.totalMatches.toLocaleString(), 
      completed: `+${stats.matchesToday} today`, 
      icon: Trophy
    },
    { 
      title: 'Game Levels', 
      value: loading ? '...' : stats.totalLevels.toString(), 
      completed: `${stats.levelsUpdated} updated recently`, 
      icon: Gamepad2
    },
  ]

  return (
    <div className="dashboard-page">
      <div className="content-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Overview of Battleship VR Management System</p>
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
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="dashboard-content-grid">
        {/* Recent Matches */}
        <div className="dashboard-card recent-matches-card">
          <div className="card-header">
            <h3>Recent Matches</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : recentMatches.length === 0 ? (
              <div className="empty-state">No matches yet</div>
            ) : (
              <div className="matches-list">
                {recentMatches.map((match) => (
                  <div key={match.id} className="match-item">
                    <div className="match-info">
                      <div className="match-players">
                        {match.player1} vs {match.player2}
                      </div>
                      <div className="match-details">
                        Level {match.level} • {match.timeAgo}
                      </div>
                    </div>
                    <div className="match-status">
                      <span className={`status-badge ${match.status.toLowerCase()}`}>
                        {match.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
