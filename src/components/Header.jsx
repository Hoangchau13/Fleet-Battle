import { useState, useEffect } from 'react'
import { Ship, User, LogOut } from 'lucide-react'
import { logout } from '../api'
import './Header.css'

function Header({ toggleSidebar, hideToggle = false }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  
  useEffect(() => {
    // Get user info from localStorage (saved during login)
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])
  
  const handleLogout = () => {
    logout()
  }

  return (
    <header className="header">
      <div className="header-left">
        {!hideToggle && (
          <button className="menu-btn" onClick={toggleSidebar}>
            <span className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        )}
        {hideToggle && (
          <div className="header-logo">
            <Ship size={24} className="logo-icon" />
            <span className="logo-text">Fleet Battle</span>
          </div>
        )}
      </div>
      <div className="header-right">
        <div className="user-menu">
          <div 
            className="user-avatar" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <User size={20} />
          </div>
          {showUserMenu && (
            <div className="user-dropdown">
              <button className="dropdown-item logout" onClick={handleLogout}>
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
