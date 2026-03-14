import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import './App.css'
import Sidebar from './components/Admin/Sidebar'
import ProtectedRoute from './components/Admin/ProtectedRoute'
import Login from './pages/Login/Login'
import Dashboard from './pages/Admin/Dashboard/Dashboard'
import LevelsManagement from './pages/Admin/LevelsManagement/LevelsManagement'
import ShipsManagement from './pages/Admin/ShipsManagement/ShipsManagement'
import UsersManagement from './pages/Admin/UsersManagement/UsersManagement'
import UserDetail from './pages/Admin/UsersManagement/UserDetail'
import GamesManagement from './pages/Admin/GamesManagement/GamesManagement'
import ServerSelection from './pages/Players/ServerSelection/ServerSelection'
import CreatePlayer from './pages/Players/CreatePlayer/CreatePlayer'
import HomePage from './pages/Players/HomePage/HomePage'
import GameModes from './pages/Players/GameModes/GameModes'
import Lobby from './pages/Players/Lobby/Lobby'
import WaitingRoom from './pages/Players/WaitingRoom/WaitingRoom'
import VRTransition from './pages/Players/VRTransition/VRTransition'
import WatchMatch from './pages/Players/WatchMatch/WatchMatch'
import ShipPlacement from './pages/Players/ShipPlacement/ShipPlacement'
import BattleScreen from './pages/Players/BattleScreen/BattleScreen'
import GameOver from './pages/Players/GameOver/GameOver'

function AdminLayout({ isSidebarOpen}) {
  return (
    <div className="dashboard">
      <Sidebar isOpen={isSidebarOpen} />

      <main className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/levels" element={<LevelsManagement />} />
            <Route path="/ships" element={<ShipsManagement />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/games" element={<GamesManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // Get initial user role from localStorage immediately
  const getUserRole = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        return user.role
      } catch (error) {
        console.error('Error parsing user data:', error)
        return null
      }
    }
    return null
  }

  const [userRole, setUserRole] = useState(getUserRole())

  useEffect(() => {
    // Update user role function
    const updateUserRole = () => {
      const role = getUserRole()
      console.log('Updating user role:', role) // Debug log
      setUserRole(role)
    }

    // Listen for storage changes (when user logs in)
    window.addEventListener('storage', updateUserRole)
    
    // Listen for custom login event
    window.addEventListener('userLogin', updateUserRole)

    return () => {
      window.removeEventListener('storage', updateUserRole)
      window.removeEventListener('userLogin', updateUserRole)
    }
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const isPlayer = userRole === 'Player'
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin' || userRole === 'Superadmin'
  
  console.log('Current user role:', userRole, 'isPlayer:', isPlayer, 'isAdmin:', isAdmin) // Debug log

  return (
    <Router>
      <Routes>
        {/* Public route - Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              {isPlayer ? (
                // Player layout - No sidebar
                <div className="player-layout">
                  <div className="player-content">
                    <Routes>
                      <Route path="/" element={<ServerSelection />} />
                      <Route path="/server-selection" element={<ServerSelection />} />
                      <Route path="/create-player" element={<CreatePlayer />} />
                      <Route path="/home" element={<HomePage />} />
                      <Route path="/game-modes" element={<GameModes />} />
                      <Route path="/lobby" element={<Lobby />} />
                      <Route path="/waiting-room/:roomId" element={<WaitingRoom />} />
                      <Route path="/vr-transition/:roomId" element={<VRTransition />} />
                      <Route path="/watch-match/:roomId" element={<WatchMatch />} />
                      <Route path="/ship-placement/:roomId" element={<ShipPlacement />} />
                      <Route path="/battle/:roomId" element={<BattleScreen />} />
                      <Route path="/game-over/:roomId" element={<GameOver />} />
                      <Route path="*" element={<Navigate to="/server-selection" replace />} />
                    </Routes>
                  </div>
                </div>
              ) : (
                // Admin layout - With sidebar
                <AdminLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              )}
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
