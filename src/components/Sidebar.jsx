import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Gamepad2, Ship, Monitor } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen }) {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Ship size={28} strokeWidth={2} />
          <h2>Battleship VR</h2>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <span className="nav-icon">
            <LayoutDashboard size={20} />
          </span>
          <span>Dashboard</span>
        </Link>
        
        <Link to="/users" className={`nav-item ${isActive('/users')}`}>
          <span className="nav-icon">
            <Users size={20} />
          </span>
          <span>User Management</span>
        </Link>
        
        <Link to="/levels" className={`nav-item ${isActive('/levels')}`}>
          <span className="nav-icon">
            <Gamepad2 size={20} />
          </span>
          <span>Level Management</span>
        </Link>
        
        <Link to="/ships" className={`nav-item ${isActive('/ships')}`}>
          <span className="nav-icon">
            <Ship size={20} />
          </span>
          <span>Ship Types</span>
        </Link>
        
        <Link to="/games" className={`nav-item ${isActive('/games')}`}>
          <span className="nav-icon">
            <Monitor size={20} />
          </span>
          <span>Live Operations</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">N</div>
          <div className="user-info">
            <div className="user-name">Admin User</div>
            <div className="user-email">admin@battleship.vr</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
