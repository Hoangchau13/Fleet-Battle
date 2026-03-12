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
import HomePage from './pages/Players/HomePage/HomePage'

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
                      <Route path="/" element={<HomePage />} />
                      <Route path="/home" element={<HomePage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
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
