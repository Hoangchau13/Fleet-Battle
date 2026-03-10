import { useState, useEffect } from 'react'
import { Users, Activity, Trophy, Gamepad2 } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { getAdminOverview } from '../../api'
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

      // Fetch data from admin overview API
      const data = await getAdminOverview()

      // Extract stats from nested structure
      const statsData = data.stats || {}

      // Update stats from API response
      setStats({
        totalUsers: statsData.totalUsers || 0,
        userGrowth: statsData.userGrowthPercentage || 0,
        activeMatches: statsData.activeMatches || 0,
        matchesChange: statsData.matchesChangeFromYesterday || 0,
        totalMatches: statsData.totalMatches || 0,
        matchesToday: statsData.matchesToday || 0,
        totalLevels: statsData.gameLevels || 0,
        levelsUpdated: statsData.levelsUpdatedRecently || 0
      })

      // Update recent matches from API response
      const matches = data.recentMatches || []
      setRecentMatches(matches)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set empty state on error
      setStats({
        totalUsers: 0,
        userGrowth: 0,
        activeMatches: 0,
        matchesChange: 0,
        totalMatches: 0,
        matchesToday: 0,
        totalLevels: 0,
        levelsUpdated: 0
      })
      setRecentMatches([])
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { 
      title: 'Total Users', 
      value: loading ? '...' : stats.totalUsers.toLocaleString(), 
      icon: Users
    },
    { 
      title: 'Active Matches', 
      value: loading ? '...' : stats.activeMatches.toString(), 
      icon: Activity
    },
    { 
      title: 'Total Matches', 
      value: loading ? '...' : stats.totalMatches.toLocaleString(), 
      icon: Trophy
    },
    { 
      title: 'Game Levels', 
      value: loading ? '...' : stats.totalLevels.toString(), 
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
            icon={stat.icon}
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
              <div className="dashboard-loading">Loading...</div>
            ) : recentMatches.length === 0 ? (
              <div className="dashboard-empty">No matches yet</div>
            ) : (
              <div className="matches-list">
                {recentMatches.map((match) => (
                  <div key={match.gameId} className="match-item">
                    <div className="match-info">
                      <div className="match-players">
                        {match.player1Name} vs {match.player2Name}
                      </div>
                      <div className="match-details">
                        Level {match.levelName} • {match.startTime && new Date(match.startTime).toLocaleString()}
                      </div>
                    </div>
                    <div className="match-status">
                      <span className={`match-status-badge ${match.status.toLowerCase()}`}>
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
